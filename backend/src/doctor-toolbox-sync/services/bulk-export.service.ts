import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SyncPatientService } from './sync-patient.service';
import { RetryService } from './retry.service';
import { MigrationProgressService } from './migration-progress.service';
import { MigrationProgress } from '../entities/migration-progress.entity';
import { WebhookPayloadDto, ToolboxPatientDto, WebhookAction } from '../dto/webhook-payload.dto';

/**
 * BulkExportService — 批量患者匯入（初始遷移）
 *
 * 用途：
 * - 診所首次連線時，從 Doctor Toolbox 匯入所有既有患者
 * - 支援批處理和恢復（resume）
 * - 自動衝突解決（CRM 為權威）
 * - 進度追蹤與錯誤恢復
 *
 * 設計：
 * - 批量大小：50 患者 / 批次
 * - 批次逾時：30 秒
 * - 重試邏輯：指數退避（Plan 02）
 * - 多診所隔離：所有操作按 clinicId 隔離
 */
@Injectable()
export class BulkExportService {
  private readonly logger = new Logger(BulkExportService.name);
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT_MS = 30000; // 30 seconds

  constructor(
    private readonly syncPatientService: SyncPatientService,
    private readonly retryService: RetryService,
    private readonly migrationProgressService: MigrationProgressService,
  ) {}

  /**
   * 開始新遷移
   *
   * @param clinicId 診所ID
   * @returns 遷移進度
   */
  async startMigration(clinicId: string): Promise<MigrationProgress> {
    this.logger.log(`開始遷移：clinicId=${clinicId}`);

    try {
      // 從 Doctor Toolbox 取得患者列表
      const toolboxPatients = await this.fetchAllPatientsFromToolbox(clinicId);
      this.logger.log(
        `從 Toolbox 取得 ${toolboxPatients.length} 個患者：clinicId=${clinicId}`,
      );

      // 建立進度追蹤
      let progress = await this.migrationProgressService.startProgress(
        clinicId,
        toolboxPatients.length,
      );

      // 分批處理
      for (let i = 0; i < toolboxPatients.length; i += this.BATCH_SIZE) {
        const batch = toolboxPatients.slice(
          i,
          i + this.BATCH_SIZE,
        );
        const batchId = `batch-${Math.ceil((i + 1) / this.BATCH_SIZE)}`;

        try {
          // 處理批次（含逾時保護）
          await Promise.race([
            this.processBatch(batch, clinicId),
            this.timeout(this.BATCH_TIMEOUT_MS),
          ]);

          // 更新進度
          progress = await this.migrationProgressService.updateProgress(
            clinicId,
            i + batch.length,
            0,
            batchId,
          );

          const percentage = progress.getProgressPercentage();
          const eta = progress.getEstimatedTimeRemaining();
          this.logger.log(
            `批次完成：${batchId} (${percentage}%)，預計剩餘時間：${eta}s`,
          );
        } catch (error) {
          this.logger.error(
            `批次失敗：${batchId}。錯誤：${error.message}。已處理：${i + batch.length}/${toolboxPatients.length}`,
          );
          // 記錄失敗但繼續（fail-soft approach）
          progress = await this.migrationProgressService.updateProgress(
            clinicId,
            i + batch.length,
            batch.length,
            batchId,
          );
        }
      }

      // 標記完成
      progress = await this.migrationProgressService.markComplete(clinicId);
      this.logger.log(
        `遷移完成：clinicId=${clinicId}，已成功處理 ${progress.processedPatients - progress.failedCount}/${progress.totalPatients} 個患者`,
      );

      return progress;
    } catch (error) {
      this.logger.error(
        `遷移初始化失敗：clinicId=${clinicId}。錯誤：${error.message}`,
      );
      await this.migrationProgressService.markFailed(clinicId);
      throw error;
    }
  }

  /**
   * 恢復中斷的遷移
   *
   * @param clinicId 診所ID
   * @returns 遷移進度
   */
  async resumeMigration(clinicId: string): Promise<MigrationProgress> {
    this.logger.log(`恢復遷移：clinicId=${clinicId}`);

    const progress = await this.migrationProgressService.getProgress(clinicId);
    if (!progress) {
      throw new Error(`No migration found for clinicId: ${clinicId}`);
    }

    if (progress.status === 'completed') {
      this.logger.log(`遷移已完成，無須恢復：clinicId=${clinicId}`);
      return progress;
    }

    try {
      // 重新取得患者列表並從 lastBatchId 繼續
      const toolboxPatients = await this.fetchAllPatientsFromToolbox(clinicId);
      let resumeIndex: number;
      if (progress.lastBatchId) {
        const batchNum = parseInt(progress.lastBatchId.split('-')[1], 10);
        resumeIndex = isNaN(batchNum) ? progress.processedPatients : batchNum * this.BATCH_SIZE;
      } else {
        resumeIndex = progress.processedPatients;
      }

      this.logger.log(
        `從第 ${resumeIndex} 個患者恢復：clinicId=${clinicId}`,
      );

      // 繼續分批處理
      for (let i = resumeIndex; i < toolboxPatients.length; i += this.BATCH_SIZE) {
        const batch = toolboxPatients.slice(
          i,
          i + this.BATCH_SIZE,
        );
        const batchId = `batch-${Math.ceil((i + 1) / this.BATCH_SIZE)}`;

        try {
          await Promise.race([
            this.processBatch(batch, clinicId),
            this.timeout(this.BATCH_TIMEOUT_MS),
          ]);

          await this.migrationProgressService.updateProgress(
            clinicId,
            i + batch.length,
            0,
            batchId,
          );
        } catch (error) {
          this.logger.error(
            `批次失敗（恢復中）：${batchId}。錯誤：${error.message}`,
          );
          await this.migrationProgressService.updateProgress(
            clinicId,
            i + batch.length,
            batch.length,
            batchId,
          );
        }
      }

      return await this.migrationProgressService.markComplete(clinicId);
    } catch (error) {
      this.logger.error(
        `恢復遷移失敗：clinicId=${clinicId}。錯誤：${error.message}`,
      );
      await this.migrationProgressService.markFailed(clinicId);
      throw error;
    }
  }

  /**
   * 中止遷移
   *
   * @param clinicId 診所ID
   */
  async abortMigration(clinicId: string): Promise<void> {
    this.logger.log(`中止遷移：clinicId=${clinicId}`);
    await this.migrationProgressService.markFailed(clinicId);
  }

  /**
   * 從 Doctor Toolbox 取得所有患者
   * 實際實作時，應呼叫 Toolbox API
   */
  private async fetchAllPatientsFromToolbox(
    clinicId: string,
  ): Promise<ToolboxPatientDto[]> {
    const toolboxUrl = process.env.DOCTOR_TOOLBOX_API_URL;
    if (!toolboxUrl) {
      throw new Error('DOCTOR_TOOLBOX_API_URL not configured');
    }

    // 使用 retryService 包裝 API 呼叫
    return this.retryService.executeWithRetry(
      async () => {
        const url = new URL(`${toolboxUrl}/patients`);
        url.searchParams.set('clinicId', clinicId);
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Toolbox API returned ${response.status}`);
        }
        const data = await response.json();
        return data.patients || [];
      },
      4, // maxAttempts
    );
  }

  /**
   * 處理單個批次
   */
  private async processBatch(
    patients: ToolboxPatientDto[],
    clinicId: string,
  ): Promise<void> {
    for (const patient of patients) {
      const payload: WebhookPayloadDto = {
        webhookId: `migration-${clinicId}-${patient.id}`,
        patientId: patient.id,
        action: WebhookAction.PATIENT_CREATED,
        timestamp: Math.floor(Date.now() / 1000),
        patient,
      };

      try {
        // 重用 Wave 2 的同步邏輯（含衝突解決）
        await this.syncPatientService.syncFromToolbox(payload, clinicId);
      } catch (error) {
        this.logger.warn(
          `患者同步失敗（繼續）：patientId=${patient.id}，clinicId=${clinicId}。錯誤：${error.message}`,
        );
        // Fail-soft：記錄但繼續下一個患者
      }
    }
  }

  /**
   * Promise 逾時助手
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms),
    );
  }
}
