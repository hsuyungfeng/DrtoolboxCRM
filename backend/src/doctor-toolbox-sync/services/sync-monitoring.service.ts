import { Injectable, Logger } from '@nestjs/common';
import { SyncAuditService } from './sync-audit.service';

/**
 * 同步監控服務
 *
 * 用途：
 * - 檢測連續失敗模式（≥ 3 次失敗觸發警告）
 * - 分析重試成功率
 * - 匯總診所同步統計數據
 *
 * 多診所隔離：所有查詢按 clinicId 隔離
 */
@Injectable()
export class SyncMonitoringService {
  private readonly logger = new Logger(SyncMonitoringService.name);
  private readonly FAILURE_THRESHOLD = 3;

  constructor(private readonly auditService: SyncAuditService) {}

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
}
