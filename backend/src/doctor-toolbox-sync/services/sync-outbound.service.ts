import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { SyncOutboundLog, SyncOutboundStatus } from '../entities/sync-outbound-log.entity';
import { RetryService } from './retry.service';

/**
 * SyncOutboundService — 出站同步服務
 * 
 * 用途：
 * - 執行從 CRM 到 Doctor Toolbox 的資料同步
 * - 封裝 HMAC 簽名邏輯
 * - 整合重試機制 (RetryService)
 * - 更新同步日誌狀態
 */
@Injectable()
export class SyncOutboundService {
  private readonly logger = new Logger(SyncOutboundService.name);

  constructor(
    @InjectRepository(SyncOutboundLog)
    private readonly logRepository: Repository<SyncOutboundLog>,
    private readonly retryService: RetryService,
  ) {}

  /**
   * 建立同步日誌紀錄
   */
  async createLog(data: {
    clinicId: string;
    entityType: string;
    entityId: string;
    action: string;
    payload: any;
  }): Promise<SyncOutboundLog> {
    const log = this.logRepository.create({
      ...data,
      status: SyncOutboundStatus.PENDING,
      attempts: 0,
    });
    return await this.logRepository.save(log);
  }

  /**
   * 執行同步操作
   * 
   * @param logId 同步日誌 ID
   */
  async performSync(logId: string): Promise<void> {
    const log = await this.logRepository.findOne({ where: { id: logId } });
    if (!log) {
      this.logger.error(`找不到同步日誌: ${logId}`);
      return;
    }

    try {
      await this.retryService.executeWithRetry(async () => {
        log.attempts++;
        log.lastAttemptAt = new Date();
        
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const secret = process.env.DOCTOR_TOOLBOX_WEBHOOK_SECRET;
        
        if (!secret) {
          throw new Error('未配置 DOCTOR_TOOLBOX_WEBHOOK_SECRET');
        }

        const signature = this.computeSignature(timestamp, log.payload, secret);
        const webhookUrl = process.env.DOCTOR_TOOLBOX_OUTBOUND_URL || process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('未配置 DOCTOR_TOOLBOX_OUTBOUND_URL');
        }

        this.logger.debug(`正在推送同步資料至 Toolbox: ${webhookUrl} (Attempt: ${log.attempts})`);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-signature': signature,
            'x-timestamp': timestamp,
          },
          body: JSON.stringify(log.payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Toolbox API 回傳錯誤 ${response.status}: ${errorText || response.statusText}`);
        }

        return await response.json().catch(() => ({ success: true }));
      });

      log.status = SyncOutboundStatus.SUCCESS;
      log.lastError = null;
      this.logger.log(`同步成功: ${log.entityType} ${log.entityId} (${log.action})`);
    } catch (error) {
      log.status = SyncOutboundStatus.FAILED;
      log.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步失敗 (Log ID: ${logId}): ${log.lastError}`);
    } finally {
      await this.logRepository.save(log);
    }
  }

  /**
   * 計算 HMAC-SHA256 簽名
   */
  private computeSignature(
    timestamp: string,
    body: unknown,
    secret: string,
  ): string {
    const message = `${timestamp}.${JSON.stringify(body)}`;
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }
}
