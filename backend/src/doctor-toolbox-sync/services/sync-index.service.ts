import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncPatientIndex } from '../entities/sync-patient-index.entity';
import { SyncStatus } from '../../common/enums/sync-status.enum';

/**
 * SyncIndexService - 患者同步索引 CRUD 與查詢
 *
 * 功能：
 * - 管理 sync_patient_index 表
 * - 記錄 Toolbox ↔ CRM 患者映射
 * - 追蹤同步狀態與錯誤訊息
 * - 支援快速查詢（精確匹配、備用匹配）
 *
 * 用途：
 * - Webhook 冪等性：透過 (clinicId, webhookId) 防重複
 * - 患者快速查詢：透過 (clinicId, idNumber, name) 或 (clinicId, name, phone)
 * - 同步追蹤：記錄每個同步事件的狀態與錯誤
 */
@Injectable()
export class SyncIndexService {
  private readonly logger = new Logger(SyncIndexService.name);

  constructor(
    @InjectRepository(SyncPatientIndex)
    private readonly syncIndexRepository: Repository<SyncPatientIndex>,
  ) {}

  /**
   * 建立或更新同步索引記錄
   *
   * @param clinicId 診所 ID
   * @param webhookId Webhook 事件 ID（冪等性鑰）
   * @param toolboxPatientId Doctor Toolbox 患者 ID
   * @param crmPatientId CRM 患者 ID
   * @param idNumber 患者身份證號
   * @param name 患者姓名
   * @param syncStatus 同步狀態（預設 'pending'）
   * @returns 已建立或更新的索引記錄
   */
  async upsertIndex(
    clinicId: string,
    webhookId: string,
    toolboxPatientId: string,
    crmPatientId: string,
    idNumber: string,
    name: string,
    syncStatus: SyncStatus = SyncStatus.PENDING,
  ): Promise<SyncPatientIndex> {
    let index = await this.syncIndexRepository.findOne({
      where: { clinicId, webhookId },
    });

    if (index) {
      // 更新既有記錄
      index.toolboxPatientId = toolboxPatientId;
      index.crmPatientId = crmPatientId;
      index.idNumber = idNumber;
      index.name = name;
      index.syncStatus = syncStatus;
      index.lastSyncAt = new Date();
    } else {
      // 建立新記錄
      index = this.syncIndexRepository.create({
        clinicId,
        webhookId,
        toolboxPatientId,
        crmPatientId,
        idNumber,
        name,
        syncStatus,
        lastSyncAt: new Date(),
      });
    }

    return this.syncIndexRepository.save(index);
  }

  /**
   * 查詢同步索引（根據 CRM 患者 ID）
   *
   * 用於反向查詢：已知 CRM patientId，需取得 Toolbox 映射資訊
   *
   * @param clinicId 診所 ID
   * @param crmPatientId CRM 患者 ID
   * @returns 若找到返回索引記錄，否則 null
   */
  async findByCrmPatientId(
    clinicId: string,
    crmPatientId: string,
  ): Promise<SyncPatientIndex | null> {
    return this.syncIndexRepository.findOne({
      where: { clinicId, crmPatientId },
    });
  }

  /**
   * 查詢同步索引（根據 Webhook ID）
   *
   * 用於冪等性檢查：檢查是否已處理過相同 Webhook 事件
   *
   * @param clinicId 診所 ID
   * @param webhookId Webhook 事件 ID
   * @returns 若找到返回索引記錄，否則 null
   */
  async findByWebhookId(
    clinicId: string,
    webhookId: string,
  ): Promise<SyncPatientIndex | null> {
    return this.syncIndexRepository.findOne({
      where: { clinicId, webhookId },
    });
  }

  /**
   * 精確查詢同步索引（idNumber + name）
   *
   * @param clinicId 診所 ID
   * @param idNumber 患者身份證號
   * @param name 患者姓名
   * @returns 若找到返回索引記錄，否則 null
   */
  async findByIdNumberAndName(
    clinicId: string,
    idNumber: string,
    name: string,
  ): Promise<SyncPatientIndex | null> {
    return this.syncIndexRepository.findOne({
      where: { clinicId, idNumber, name },
    });
  }

  /**
   * 更新同步狀態
   *
   * @param crmPatientId CRM 患者 ID
   * @param syncStatus 新的同步狀態
   * @param errorMessage 錯誤訊息（若失敗時記錄）
   */
  async updateStatus(
    crmPatientId: string,
    syncStatus: SyncStatus,
    errorMessage?: string | null,
  ): Promise<void> {
    const updateData: any = {
      syncStatus,
      lastSyncAt: new Date(),
    };

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    await this.syncIndexRepository.update(
      { crmPatientId },
      updateData,
    );
  }

  /**
   * 取得失敗的同步記錄
   *
   * 用於重試或稽核：列出所有狀態為 'failed' 的記錄
   *
   * @param clinicId 診所 ID
   * @param limit 最多返回筆數
   * @returns 失敗的同步記錄陣列
   */
  async getFailedSyncs(
    clinicId: string,
    limit: number = 100,
  ): Promise<SyncPatientIndex[]> {
    return this.syncIndexRepository.find({
      where: { clinicId, syncStatus: SyncStatus.FAILED },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * 刪除同步索引記錄
   *
   * 用於清理或重新同步
   *
   * @param clinicId 診所 ID
   * @param crmPatientId CRM 患者 ID
   */
  async deleteIndex(clinicId: string, crmPatientId: string): Promise<void> {
    await this.syncIndexRepository.delete({
      clinicId,
      crmPatientId,
    });
  }
}
