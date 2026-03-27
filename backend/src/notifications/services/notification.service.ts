import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRecord } from '../entities/notification-record.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { ChurnRisk } from '../churn-prediction.service';

export type NotificationEventType =
  | 'course_started'
  | 'session_completed'
  | 'course_completed'
  | 'appointment_reminder';

// 保留舊 interface 向後相容（ChurnPredictionService 使用）
export interface Notification {
  id?: string;
  type: 'sms' | 'email' | 'in_app' | 'system';
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'sent' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  clinicId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SendNotificationDto {
  type: 'sms' | 'email' | 'in_app' | 'system';
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
  clinicId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationRecord)
    private readonly notificationRecordRepo: Repository<NotificationRecord>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
  ) {}

  /**
   * 多渠道發送通知（Phase 2 新方法）
   * 查詢患者偏好，分渠道發送，持久化記錄
   */
  async sendMultiChannel(params: {
    patient: Patient;
    eventType: NotificationEventType;
    title: string;
    message: string;
    relatedEntityId?: string;
  }): Promise<void> {
    const pref = await this.preferenceRepo.findOne({
      where: {
        patientId: params.patient.id,
        clinicId: params.patient.clinicId,
      },
    });

    // 檢查事件類型偏好
    if (!this.checkEventPreference(pref, params.eventType)) {
      this.logger.log(
        `患者 ${params.patient.id} 已關閉 ${params.eventType} 類型通知`,
      );
      return;
    }

    const emailEnabled = pref?.emailEnabled ?? true;
    const smsEnabled = pref?.smsEnabled ?? true;
    const inAppEnabled = pref?.inAppEnabled ?? true;

    const sends: Promise<void>[] = [];

    if (emailEnabled && params.patient.email) {
      sends.push(
        this.saveRecord({
          clinicId: params.patient.clinicId,
          patientId: params.patient.id,
          channel: 'email',
          eventType: params.eventType,
          title: params.title,
          message: params.message,
          relatedEntityId: params.relatedEntityId,
          // 實際 email 發送由 EmailChannelService（Plan 03）負責
          // 本計劃先儲存記錄，status 設為 pending
          status: 'pending',
        }),
      );
    }

    if (smsEnabled && params.patient.phoneNumber) {
      sends.push(
        this.saveRecord({
          clinicId: params.patient.clinicId,
          patientId: params.patient.id,
          channel: 'sms',
          eventType: params.eventType,
          title: params.title,
          message: params.message,
          relatedEntityId: params.relatedEntityId,
          status: 'pending',
        }),
      );
    }

    if (inAppEnabled) {
      sends.push(
        this.saveRecord({
          clinicId: params.patient.clinicId,
          patientId: params.patient.id,
          channel: 'in_app',
          eventType: params.eventType,
          title: params.title,
          message: params.message,
          relatedEntityId: params.relatedEntityId,
          status: 'sent', // in_app 儲存即視為已送達
        }),
      );
    }

    await Promise.allSettled(sends);
  }

  /**
   * 取得患者應用內未讀通知
   */
  async getInboxNotifications(
    patientId: string,
    clinicId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationRecord[]> {
    const qb = this.notificationRecordRepo
      .createQueryBuilder('record')
      .where('record.patientId = :patientId', { patientId })
      .andWhere('record.clinicId = :clinicId', { clinicId })
      .andWhere('record.channel = :channel', { channel: 'in_app' })
      .orderBy('record.createdAt', 'DESC');

    if (options?.unreadOnly) {
      qb.andWhere('record.isRead = :isRead', { isRead: false });
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    qb.limit(limit).offset(offset);

    return qb.getMany();
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(recordId: string, clinicId: string): Promise<void> {
    await this.notificationRecordRepo.update(
      { id: recordId, clinicId },
      { isRead: true },
    );
  }

  // ────────────────────────────────────────────────────────────
  // 以下為向後相容方法（ChurnPredictionService 依賴，不可刪除）
  // ────────────────────────────────────────────────────────────

  async sendChurnRiskAlert(
    risk: ChurnRisk,
    clinicId: string,
  ): Promise<Notification> {
    const message = this.buildChurnAlertMessage(risk);
    return this.sendNotification({
      type: 'system',
      recipientId: risk.patientId,
      recipientName: risk.patientName,
      title: `【流失預警】患者 ${risk.patientName}`,
      message,
      priority: risk.riskLevel === 'high' ? 'high' : 'medium',
      clinicId,
    });
  }

  async sendBulkChurnAlerts(
    risks: ChurnRisk[],
    clinicId: string,
  ): Promise<{ total: number; successful: number; failed: number }> {
    const results = await Promise.allSettled(
      risks.map((risk) => this.sendChurnRiskAlert(risk, clinicId)),
    );
    return {
      total: risks.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  async sendNotification(dto: SendNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: dto.type,
      recipientId: dto.recipientId,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      recipientEmail: dto.recipientEmail,
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'medium',
      status: 'sent',
      clinicId: dto.clinicId,
      createdAt: new Date(),
      sentAt: new Date(),
    };
    this.logger.log(`[系統通知] ${dto.recipientName}: ${dto.title}`);
    return notification;
  }

  async getNotifications(
    clinicId: string,
    options?: { limit?: number; offset?: number; status?: string },
  ): Promise<NotificationRecord[]> {
    const qb = this.notificationRecordRepo
      .createQueryBuilder('record')
      .where('record.clinicId = :clinicId', { clinicId })
      .orderBy('record.createdAt', 'DESC');

    if (options?.status) {
      qb.andWhere('record.status = :status', { status: options.status });
    }

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    qb.limit(limit).offset(offset);

    return qb.getMany();
  }

  // ────────────────────────────────────────────────────────────
  // 私有方法
  // ────────────────────────────────────────────────────────────

  private async saveRecord(params: {
    clinicId: string;
    patientId: string;
    channel: 'email' | 'sms' | 'in_app';
    eventType: NotificationEventType;
    title: string;
    message: string;
    relatedEntityId?: string;
    status: 'pending' | 'sent' | 'failed';
  }): Promise<void> {
    const record = this.notificationRecordRepo.create({
      ...params,
    });
    await this.notificationRecordRepo.save(record);
  }

  private checkEventPreference(
    pref: NotificationPreference | null,
    eventType: NotificationEventType,
  ): boolean {
    if (!pref) return true; // 無偏好記錄，預設發送

    const map: Record<NotificationEventType, keyof NotificationPreference> = {
      course_started: 'notifyOnCourseStart',
      session_completed: 'notifyOnSessionComplete',
      course_completed: 'notifyOnCourseComplete',
      appointment_reminder: 'notifyOnAppointmentReminder',
    };

    return pref[map[eventType]] as boolean;
  }

  private buildChurnAlertMessage(risk: ChurnRisk): string {
    const emoji =
      risk.riskLevel === 'high' ? '⚠️' : risk.riskLevel === 'medium' ? '⚡' : 'ℹ️';
    let message = `${emoji} 流失風險預警\n\n患者：${risk.patientName}\n風險等級：${risk.riskLevel.toUpperCase()}\n`;
    if (risk.reasons?.length) {
      message += `原因：\n${risk.reasons.map((r) => `- ${r}`).join('\n')}\n`;
    }
    if (risk.recommendedActions?.length) {
      message += `建議行動：\n${risk.recommendedActions.map((a) => `- ${a}`).join('\n')}`;
    }
    return message;
  }
}
