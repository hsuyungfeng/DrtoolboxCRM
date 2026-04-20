import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SyncAuditLog } from '../../common/entities/sync-audit-log.entity';

/**
 * 同步稽核服務
 *
 * 用途：
 * - 記錄所有同步事件（webhook、衝突、重試、遷移）
 * - 查詢稽核日誌（按患者、診所、日期）
 * - 支援監控和合規性報告
 *
 * 多診所隔離：所有查詢包含 clinicId 過濾
 */
@Injectable()
export class SyncAuditService {
  private readonly logger = new Logger(SyncAuditService.name);

  constructor(
    @InjectRepository(SyncAuditLog)
    private readonly auditLogRepository: Repository<SyncAuditLog>,
  ) {}

  /**
   * 記錄同步事件
   */
  async logEvent(event: {
    clinicId: string;
    patientId?: string;
    action: string;
    source: string;
    status: string;
    errorMessage?: string;
    eventData?: Record<string, any>;
  }): Promise<SyncAuditLog> {
    const auditLog = this.auditLogRepository.create(event);
    const saved = await this.auditLogRepository.save(auditLog);

    this.logger.log(
      `稽核記錄：${event.action} (${event.status})，clinicId=${event.clinicId}`,
    );

    return saved;
  }

  /**
   * 按患者查詢稽核日誌
   */
  async queryByPatient(
    clinicId: string,
    patientId: string,
    limit: number = 100,
  ): Promise<SyncAuditLog[]> {
    return this.auditLogRepository.find({
      where: { clinicId, patientId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * 按診所查詢稽核日誌
   */
  async queryByClinic(
    clinicId: string,
    limit: number = 1000,
  ): Promise<SyncAuditLog[]> {
    return this.auditLogRepository.find({
      where: { clinicId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * 按日期範圍查詢
   */
  async queryByDateRange(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 5000,
  ): Promise<SyncAuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        clinicId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * 按動作類型查詢
   */
  async queryByAction(
    clinicId: string,
    action: string,
  ): Promise<SyncAuditLog[]> {
    return this.auditLogRepository.find({
      where: { clinicId, action },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * 查詢失敗記錄
   */
  async queryFailures(
    clinicId: string,
    limitHours: number = 24,
  ): Promise<SyncAuditLog[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - limitHours);

    return this.auditLogRepository.find({
      where: {
        clinicId,
        status: 'failed',
        timestamp: Between(startDate, new Date()),
      },
      order: { timestamp: 'DESC' },
    });
  }
}
