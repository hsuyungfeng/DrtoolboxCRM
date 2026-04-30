import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SyncOutboundService } from '../services/sync-outbound.service';

/**
 * SyncOutboundListener — 出站同步事件監聽器
 * 
 * 用途：
 * - 監聽患者與治療的生命週期事件
 * - 自動建立同步日誌並觸發同步流程
 */
@Injectable()
export class SyncOutboundListener {
  private readonly logger = new Logger(SyncOutboundListener.name);

  constructor(private readonly syncOutboundService: SyncOutboundService) {}

  /**
   * 處理患者事件 (created, updated, deleted)
   */
  @OnEvent('patient.*', { async: true })
  async handlePatientEvent(payload: any, eventName: string) {
    const action = eventName.split('.')[1];
    this.logger.debug(`收到患者同步事件: ${eventName}`);

    try {
      const log = await this.syncOutboundService.createLog({
        clinicId: payload.clinicId,
        entityType: 'Patient',
        entityId: payload.id,
        action: action.charAt(0).toUpperCase() + action.slice(1),
        payload: payload,
      });

      // 觸發同步執行（不等待，背景執行）
      this.syncOutboundService.performSync(log.id).catch(err => {
        this.logger.error(`觸發患者同步失敗 (${payload.id}): ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`建立患者同步日誌失敗: ${error.message}`);
    }
  }

  /**
   * 處理治療事件 (created, updated, deleted)
   */
  @OnEvent('treatment.*', { async: true })
  async handleTreatmentEvent(payload: any, eventName: string) {
    // 忽略非生命週期事件（例如 treatment.session.completed 等，若有的話）
    const parts = eventName.split('.');
    if (parts.length !== 2) return;
    
    const action = parts[1];
    // 只處理 created, updated, deleted
    if (!['created', 'updated', 'deleted'].includes(action)) return;

    this.logger.debug(`收到治療同步事件: ${eventName}`);

    try {
      const { clinicId, treatmentId, data } = payload;

      const log = await this.syncOutboundService.createLog({
        clinicId: clinicId,
        entityType: 'Treatment',
        entityId: treatmentId,
        action: action.charAt(0).toUpperCase() + action.slice(1),
        payload: data || payload,
      });

      // 觸發同步執行（不等待，背景執行）
      this.syncOutboundService.performSync(log.id).catch(err => {
        this.logger.error(`觸發治療同步失敗 (${treatmentId}): ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`建立治療同步日誌失敗: ${error.message}`);
    }
  }
}
