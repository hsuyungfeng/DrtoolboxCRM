import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { PatientService } from '../../patients/services/patient.service';
import { SyncPatientIndex } from '../entities/sync-patient-index.entity';
import { SyncIndexService } from './sync-index.service';
import { RetryService } from './retry.service';
import { WebhookPayloadDto, ToolboxPatientDto } from '../dto/webhook-payload.dto';
import { SyncStatus } from '../../common/enums/sync-status.enum';

/**
 * SyncPatientService - 患者雙向同步邏輯
 *
 * 功能：
 * - syncFromToolbox: 接收 Doctor Toolbox 患者資料，進行查詢 → 衝突偵測 → 合併 → 建立或更新 CRM 患者
 * - pushPatientToToolbox: 將 CRM 患者變更推送回 Doctor Toolbox（含重試）
 * - detectConflict: 識別衝突（相同人但身份證號不同）
 * - mergePatients: 合併患者資料（CRM 為權威）
 *
 * 設計原則：
 * - CRM 為患者身份的權威來源
 * - 精確匹配：(clinicId, idNumber, name) → 備用匹配：(clinicId, name, phone)
 * - 衝突檢測：同一人不同身份證號 → 合併（保留 CRM 身份證號）
 * - 多診所隔離：所有操作透過 clinicId 隔離
 */
@Injectable()
export class SyncPatientService {
  private readonly logger = new Logger(SyncPatientService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(SyncPatientIndex)
    private readonly syncIndexRepository: Repository<SyncPatientIndex>,
    private readonly patientService: PatientService,
    private readonly syncIndexService: SyncIndexService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * 從 Doctor Toolbox 同步患者資料到 CRM
   *
   * 工作流程：
   * 1. 精確查詢：(clinicId, idNumber, name)
   *    - 若找到：應用更新（CRM 覆蓋），跳至步驟 5
   * 2. 備用查詢：(clinicId, name, phone)
   *    - 若找到：進行衝突檢測
   * 3. 若衝突：合併資料（CRM 身份證號優先），跳至步驟 5
   * 4. 若新患者：以 Toolbox 資料建立
   * 5. 返回最終患者實體
   *
   * @param payload Doctor Toolbox Webhook 承載
   * @param clinicId 診所 ID（多診所隔離）
   * @returns 已建立或更新的患者實體
   * @throws BadRequestException 若資料完整性檢驗失敗
   */
  async syncFromToolbox(
    payload: WebhookPayloadDto,
    clinicId: string,
  ): Promise<Patient> {
    const { patient: toolboxPatient } = payload;

    // 步驟 1：精確匹配
    let crmPatient = await this.findPatientExact(
      clinicId,
      toolboxPatient.idNumber,
      toolboxPatient.name,
    );

    if (crmPatient) {
      this.logger.debug(
        `精確匹配找到患者：ID=${crmPatient.id}，身份證號=${crmPatient.idNumber}`,
      );
      // 應用更新（CRM 覆蓋）
      return await this.applyToolboxUpdate(crmPatient, toolboxPatient);
    }

    // 步驟 2：備用匹配
    const fallbackPatient = await this.findPatientFallback(
      clinicId,
      toolboxPatient.name,
      toolboxPatient.phone,
    );

    if (fallbackPatient) {
      this.logger.debug(
        `備用匹配找到患者：ID=${fallbackPatient.id}，名字=${fallbackPatient.name}`,
      );

      // 步驟 3：衝突檢測
      const hasConflict = await this.detectConflict(
        fallbackPatient,
        toolboxPatient,
      );

      if (hasConflict) {
        this.logger.warn(
          `檢測到衝突：CRM 身份證號=${fallbackPatient.idNumber}, Toolbox 身份證號=${toolboxPatient.idNumber}`,
        );
        // 合併（CRM 優先）
        crmPatient = await this.mergePatients(fallbackPatient, toolboxPatient);
      } else {
        // 無衝突，應用更新
        crmPatient = await this.applyToolboxUpdate(
          fallbackPatient,
          toolboxPatient,
        );
      }

      return crmPatient;
    }

    // 步驟 4：新患者，以 Toolbox 資料建立
    this.logger.debug(`建立新患者：名字=${toolboxPatient.name}`);
    const newPatient = await this.patientService.createPatient(
      {
        name: toolboxPatient.name,
        idNumber: toolboxPatient.idNumber,
        email: toolboxPatient.email,
        phone: toolboxPatient.phone,
      },
      clinicId,
    );

    return newPatient;
  }

  /**
   * 衝突偵測：識別是否為同一人但身份證號不同
   *
   * 衝突條件：
   * - crmPatient.idNumber !== toolboxData.idNumber
   * - toolboxData.idNumber 非空
   *
   * @param crmPatient CRM 患者
   * @param toolboxData Doctor Toolbox 患者資料
   * @returns true 若檢測到衝突
   */
  async detectConflict(
    crmPatient: Patient,
    toolboxData: ToolboxPatientDto,
  ): Promise<boolean> {
    if (!crmPatient.idNumber || !toolboxData.idNumber) {
      return false;
    }

    return crmPatient.idNumber !== toolboxData.idNumber;
  }

  /**
   * 合併患者資料（CRM 為權威）
   *
   * 策略：
   * - 保留 CRM 身份證號（核心身份）
   * - 若 CRM phone/email 為空，則從 Toolbox 更新
   * - Toolbox 身份證號完全忽略
   *
   * @param crmPatient CRM 患者
   * @param toolboxData Doctor Toolbox 患者資料
   * @returns 已更新的患者實體
   */
  async mergePatients(
    crmPatient: Patient,
    toolboxData: ToolboxPatientDto,
  ): Promise<Patient> {
    // CRM 身份證號優先（不覆蓋）
    // 若 phone/email 為空，則從 Toolbox 補齊
    const updateData: any = {};

    if (!crmPatient.phoneNumber && toolboxData.phone) {
      updateData.phoneNumber = toolboxData.phone;
    }

    if (!crmPatient.email && toolboxData.email) {
      updateData.email = toolboxData.email;
    }

    // 若無更新，直接返回
    if (Object.keys(updateData).length === 0) {
      return crmPatient;
    }

    // 應用更新
    Object.assign(crmPatient, updateData);
    return this.patientRepository.save(crmPatient);
  }

  /**
   * 應用 Toolbox 更新到 CRM 患者
   *
   * @param crmPatient CRM 患者
   * @param toolboxData Doctor Toolbox 患者資料
   * @returns 已更新的患者實體
   */
  private async applyToolboxUpdate(
    crmPatient: Patient,
    toolboxData: ToolboxPatientDto,
  ): Promise<Patient> {
    const updateData: any = {};

    // 更新 contact 欄位（若 Toolbox 有提供）
    if (toolboxData.phone && toolboxData.phone !== crmPatient.phoneNumber) {
      updateData.phoneNumber = toolboxData.phone;
    }

    if (toolboxData.email && toolboxData.email !== crmPatient.email) {
      updateData.email = toolboxData.email;
    }

    // 若無更新，直接返回
    if (Object.keys(updateData).length === 0) {
      return crmPatient;
    }

    Object.assign(crmPatient, updateData);
    return this.patientRepository.save(crmPatient);
  }

  /**
   * 將 CRM 患者推送到 Doctor Toolbox
   *
   * 工作流程：
   * 1. 轉換 CRM 患者為 Toolbox schema
   * 2. 從配置取得 Toolbox Webhook URL 和 API 鑰
   * 3. 使用重試邏輯 POST 至 Toolbox
   * 4. 成功：更新 SyncPatientIndex.syncStatus = 'synced'
   * 5. 失敗：更新 syncStatus = 'failed' 並記錄錯誤
   *
   * @param patient CRM 患者
   * @param clinicId 診所 ID
   * @throws 所有重試都失敗時，log 並不拋出（以免中斷主流程）
   */
  async pushPatientToToolbox(
    patient: Patient,
    clinicId: string,
  ): Promise<void> {
    try {
      // 步驟 1：轉換資料
      const payload = {
        id: patient.id,
        name: patient.name,
        idNumber: patient.idNumber,
        phone: patient.phoneNumber,
        email: patient.email,
      };

      // 步驟 2：取得配置（從環境變數）
      const webhookUrl = process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
      const apiKey = process.env.DOCTOR_TOOLBOX_API_KEY;

      if (!webhookUrl) {
        this.logger.warn('DOCTOR_TOOLBOX_WEBHOOK_URL 未配置，跳過 Toolbox 推送');
        return;
      }

      // 步驟 3：使用重試推送
      await this.retryService.executeWithRetry(
        async () => {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(
              `Toolbox API 返回 ${response.status}: ${response.statusText}`,
            );
          }

          return response;
        },
        5, // 5 次嘗試（1 初始 + 4 重試）
      );

      // 步驟 4：成功，更新索引
      await this.syncIndexService.updateStatus(
        patient.id,
        SyncStatus.SYNCED,
        null,
      );
      this.logger.debug(`患者 ${patient.id} 已成功推送至 Toolbox`);
    } catch (error) {
      // 步驟 5：失敗，記錄錯誤
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `患者 ${patient.id} 推送 Toolbox 失敗：${errorMsg}`,
      );

      try {
        await this.syncIndexService.updateStatus(
          patient.id,
          SyncStatus.FAILED,
          errorMsg,
        );
      } catch (indexError) {
        this.logger.error(`更新同步索引失敗：${indexError}`);
      }

      // 不重新拋出，以免中斷主流程
    }
  }

  /**
   * 精確查詢患者 (clinicId + idNumber + name)
   *
   * @param clinicId 診所 ID
   * @param idNumber 身份證號
   * @param name 患者姓名
   * @returns 若找到返回患者實體，否則 null
   */
  async findPatientExact(
    clinicId: string,
    idNumber: string,
    name: string,
  ): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: {
        clinicId,
        idNumber,
        name,
      },
    });
  }

  /**
   * 備用查詢患者 (clinicId + name + phone)
   * 用於衝突檢測：若精確匹配失敗，嘗試根據姓名 + 電話查詢
   *
   * @param clinicId 診所 ID
   * @param name 患者姓名
   * @param phone 患者電話
   * @returns 若找到返回患者實體，否則 null
   */
  async findPatientFallback(
    clinicId: string,
    name: string,
    phone: string,
  ): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: {
        clinicId,
        name,
        phoneNumber: phone,
      },
    });
  }
}
