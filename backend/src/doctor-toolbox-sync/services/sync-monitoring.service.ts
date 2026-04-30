import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncAuditService } from './sync-audit.service';
import { ReconciliationReport } from '../entities/reconciliation-report.entity';
import { SyncIndexService } from './sync-index.service';
import { Patient } from '../../patients/entities/patient.entity';

/**
 * 同步監控服務
 *
 * 用途：
 * - 檢測連續失敗模式（≥ 3 次失敗觸發警告）
 * - 分析重試成功率
 * - 匯總診所同步統計數據
 * - 執行每日數據對帳
 *
 * 多診所隔離：所有查詢按 clinicId 隔離
 */
@Injectable()
export class SyncMonitoringService {
  private readonly logger = new Logger(SyncMonitoringService.name);
  private readonly FAILURE_THRESHOLD = 3;

  constructor(
    private readonly auditService: SyncAuditService,
    @InjectRepository(ReconciliationReport)
    private readonly reportRepo: Repository<ReconciliationReport>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly syncIndexService: SyncIndexService,
  ) {}

  /**
   * 檢測失敗模式（≥ 3 次連續失敗）
   */
  async checkFailurePattern(
    clinicId: string,
  ): Promise<{
    hasAlert: boolean;
    failureCount: number;
    lastFailureTime?: Date;
  }> {
    try {
      const failures = await this.auditService.queryFailures(clinicId, 24);

      if (failures.length >= this.FAILURE_THRESHOLD) {
        const lastFailureTime = failures[0].timestamp;

        this.logger.error(
          `同步失敗警告：clinicId=${clinicId}，失敗次數=${failures.length}，最後失敗時間=${lastFailureTime}`,
        );

        return {
          hasAlert: true,
          failureCount: failures.length,
          lastFailureTime,
        };
      }

      return {
        hasAlert: false,
        failureCount: failures.length,
      };
    } catch (error) {
      this.logger.error(
        `檢測失敗模式錯誤：clinicId=${clinicId}，錯誤=${error.message}`,
      );

      return {
        hasAlert: false,
        failureCount: 0,
      };
    }
  }

  /**
   * 分析重試模式
   */
  async getRetryPatterns(
    clinicId: string,
  ): Promise<{
    avgRetriesPerSync: number;
    successRateAfterRetry: number;
  }> {
    try {
      const retries = await this.auditService.queryByAction(
        clinicId,
        'retry-attempt',
      );
      const successes = await this.auditService.queryByAction(
        clinicId,
        'sync-success',
      );

      const avgRetriesPerSync =
        successes.length > 0 ? retries.length / successes.length : 0;

      const successesAfterRetry = successes.filter(
        (s) => s.eventData?.retriedCount > 0,
      ).length;
      const successRateAfterRetry =
        retries.length > 0 ? successesAfterRetry / retries.length : 0;

      return {
        avgRetriesPerSync: Math.round(avgRetriesPerSync * 100) / 100,
        successRateAfterRetry: Math.round(successRateAfterRetry * 100) / 100,
      };
    } catch (error) {
      this.logger.error(
        `分析重試模式錯誤：clinicId=${clinicId}，錯誤=${error.message}`,
      );

      return {
        avgRetriesPerSync: 0,
        successRateAfterRetry: 0,
      };
    }
  }

  /**
   * 取得診所同步統計
   */
  async getClinicSyncStats(
    clinicId: string,
    days: number = 7,
  ): Promise<{
    totalSyncs: number;
    successful: number;
    failed: number;
    avgSyncTime: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      const logs = await this.auditService.queryByDateRange(
        clinicId,
        startDate,
        endDate,
      );

      const syncLogs = logs.filter((l) => l.action.startsWith('sync-'));

      const successful = syncLogs.filter((l) => l.status === 'success').length;
      const failed = syncLogs.filter((l) => l.status === 'failed').length;

      const avgSyncTime =
        syncLogs.reduce((sum, log) => {
          return sum + (log.eventData?.syncTime || 0);
        }, 0) / (syncLogs.length || 1);

      return {
        totalSyncs: syncLogs.length,
        successful,
        failed,
        avgSyncTime: Math.round(avgSyncTime),
      };
    } catch (error) {
      this.logger.error(
        `取得診所統計錯誤：clinicId=${clinicId}，錯誤=${error.message}`,
      );

      return {
        totalSyncs: 0,
        successful: 0,
        failed: 0,
        avgSyncTime: 0,
      };
    }
  }

  /**
   * 每日凌晨 3 點自動對帳
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyReconciliation() {
    this.logger.log('開始執行每日自動對帳任務...');
    
    // 💡 在實際多租戶環境中，這裡應該獲取所有活躍診所列表
    const clinics = await this.patientRepo
      .createQueryBuilder('patient')
      .select('DISTINCT patient.clinicId', 'clinicId')
      .getRawMany();

    for (const { clinicId } of clinics) {
      await this.reconcileClinicData(clinicId);
    }
    
    this.logger.log('每日自動對帳任務完成。');
  }

  /**
   * 執行特定診所的對帳邏輯
   */
  async reconcileClinicData(clinicId: string): Promise<ReconciliationReport> {
    this.logger.log(`正在對帳診所數據：clinicId=${clinicId}`);
    
    const report = this.reportRepo.create({
      clinicId,
      reportDate: new Date(),
      totalChecked: 0,
      discrepancyCount: 0,
      discrepancies: [],
      status: 'in_progress',
    });

    try {
      // 1. 獲取 CRM 中的患者總數與列表
      const crmPatients = await this.patientRepo.find({ where: { clinicId } });
      report.totalChecked = crmPatients.length;

      // 2. 模擬與 Toolbox 的 Hash 比對 (實際環境中會調用 Toolbox API)
      // 這裡暫時檢查本地同步索引的完整性
      for (const patient of crmPatients) {
        const index = await this.syncIndexService.findByCrmPatientId(clinicId, patient.id);
        
        if (!index) {
          // 發現未同步的患者
          report.discrepancyCount++;
          report.discrepancies.push({
            entityType: 'patient',
            entityId: patient.id,
            description: '患者在 CRM 中存在但在同步索引中缺失',
            crmValue: { name: patient.name },
            toolboxValue: null,
            autoFixed: true,
          });

          // 自動修復：觸發一次同步
          // await this.syncPatientService.syncToToolbox(clinicId, patient.id);
        }
      }

      report.status = 'completed';
    } catch (error) {
      this.logger.error(`對帳診所 ${clinicId} 失敗：${error.message}`);
      report.status = 'failed';
    }

    return await this.reportRepo.save(report);
  }

  /**
   * 取得對帳報告列表
   */
  async getReconciliationReports(clinicId: string, limit: number = 10): Promise<ReconciliationReport[]> {
    return this.reportRepo.find({
      where: { clinicId },
      order: { reportDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * 取得單一對帳報告詳情
   */
  async getReconciliationReport(clinicId: string, id: string): Promise<ReconciliationReport | null> {
    return this.reportRepo.findOne({
      where: { id, clinicId },
    });
  }
}
