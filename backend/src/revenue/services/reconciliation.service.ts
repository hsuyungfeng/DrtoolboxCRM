import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Payment } from '../entities/payment.entity';
import { ReconciliationReport } from '../entities/reconciliation-report.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ReconciliationReport)
    private readonly reportRepository: Repository<ReconciliationReport>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 每天凌晨 00:30 執行對帳任務 (對昨天的數據進行對帳)
   */
  @Cron('0 30 0 * * *')
  async handleDailyReconciliation() {
    this.logger.log('開始執行每日自動對帳任務...');
    
    // 獲取昨天的日期範圍
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    // 1. 找出所有活躍的診所 (這裡簡化為從 Payment 中找出唯一的 clinicId)
    const clinics = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DISTINCT payment.clinicId', 'clinicId')
      .getRawMany();

    for (const { clinicId } of clinics) {
      await this.reconcileForClinic(clinicId, dateString, startOfDay, endOfDay);
    }
    
    this.logger.log('每日自動對帳任務完成。');
  }

  async reconcileForClinic(clinicId: string, dateString: string, start: Date, end: Date) {
    try {
      // 1. 計算 CRM 內部收款總額
      const result = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'sum')
        .where('payment.clinicId = :clinicId', { clinicId })
        .andWhere('payment.status = :status', { status: 'completed' })
        .andWhere('payment.paidAt BETWEEN :start AND :end', { start, end })
        .getRawOne();

      const crmTotalAmount = Number(result?.sum || 0);

      // 2. 呼叫 Doctor Toolbox API 獲取外部總額 (這裡模擬 API 呼叫)
      // 在生產環境環境下，這會是一個真實的 HTTP 請求
      const externalTotalAmount = await this.mockFetchExternalTotal(clinicId, dateString);

      const discrepancyAmount = crmTotalAmount - externalTotalAmount;
      const status = Math.abs(discrepancyAmount) < 0.01 ? 'matched' : 'discrepancy';

      // 3. 儲存對帳報告
      const report = this.reportRepository.create({
        clinicId,
        reportDate: dateString,
        crmTotalAmount,
        externalTotalAmount,
        discrepancyAmount,
        status,
        details: {
          checkedAt: new Date().toISOString(),
          period: { start, end },
        },
      });

      await this.reportRepository.save(report);

      // 4. 如果有差異，觸發事件
      if (status === 'discrepancy') {
        this.logger.warn(`診所 ${clinicId} 於 ${dateString} 發現對帳差異: ${discrepancyAmount}`);
        this.eventEmitter.emit('reconciliation.discrepancy', {
          clinicId,
          date: dateString,
          discrepancyAmount,
          reportId: report.id,
        });
      }
    } catch (error) {
      this.logger.error(`診所 ${clinicId} 對帳失敗: ${error.message}`);
      await this.reportRepository.save(this.reportRepository.create({
        clinicId,
        reportDate: dateString,
        crmTotalAmount: 0,
        externalTotalAmount: 0,
        discrepancyAmount: 0,
        status: 'failed',
        details: { error: error.message },
      }));
    }
  }

  /**
   * 模擬呼叫 Doctor Toolbox API
   */
  private async mockFetchExternalTotal(clinicId: string, date: string): Promise<number> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模擬回傳值 (95% 機率是準確的)
    // 這裡我們直接查詢資料庫來獲得一個基準值，但在真實情境下是呼叫外部 API
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where('payment.clinicId = :clinicId', { clinicId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();
    
    const baseValue = Number(result?.sum || 1000) / 10; // 模擬數據
    return Math.random() > 0.05 ? baseValue : baseValue + (Math.random() * 100 - 50);
  }

  async getReports(clinicId: string) {
    return await this.reportRepository.find({
      where: { clinicId },
      order: { reportDate: 'DESC' },
      take: 30,
    });
  }
}
