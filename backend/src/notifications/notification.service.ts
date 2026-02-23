import { Injectable, Logger } from '@nestjs/common';
import { ChurnRisk } from './churn-prediction.service';

export interface Notification {
  id?: string;
  type: 'sms' | 'email' | 'push' | 'system';
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
  type: 'sms' | 'email' | 'push' | 'system';
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
  private notifications: Notification[] = [];

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
      status: 'pending',
      clinicId: dto.clinicId,
      createdAt: new Date(),
    };

    try {
      await this.deliverNotification(notification);
      notification.status = 'sent';
      notification.sentAt = new Date();
      this.logger.log(`Notification sent to ${dto.recipientName}: ${dto.title}`);
    } catch (error) {
      notification.status = 'failed';
      this.logger.error(`Failed to send notification: ${error.message}`);
    }

    this.notifications.push(notification);
    return notification;
  }

  async sendChurnRiskAlert(
    risk: ChurnRisk,
    clinicId: string,
  ): Promise<Notification> {
    const priority = risk.riskLevel === 'high' ? 'high' : 'medium';
    
    const message = this.buildChurnAlertMessage(risk);
    
    return this.sendNotification({
      type: 'system',
      recipientId: risk.patientId,
      recipientName: risk.patientName,
      title: `【流失預警】患者 ${risk.patientName}`,
      message,
      priority,
      clinicId,
    });
  }

  async sendBulkChurnAlerts(risks: ChurnRisk[], clinicId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    const results = await Promise.allSettled(
      risks.map((risk) => this.sendChurnRiskAlert(risk, clinicId)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { total: risks.length, successful, failed };
  }

  async getNotifications(
    clinicId: string,
    options?: { limit?: number; offset?: number; status?: string },
  ): Promise<Notification[]> {
    let filtered = this.notifications.filter((n) => n.clinicId === clinicId);

    if (options?.status) {
      filtered = filtered.filter((n) => n.status === options.status);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return filtered.slice(offset, offset + limit);
  }

  private buildChurnAlertMessage(risk: ChurnRisk): string {
    const riskLevelEmoji = {
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
    };

    const emoji = riskLevelEmoji[risk.riskLevel];

    let message = `${emoji} 流失風險預警\n\n`;
    message += `患者：${risk.patientName}\n`;
    message += `風險等級：${risk.riskLevel.toUpperCase()}\n`;
    message += `風險分數：${risk.riskScore}\n\n`;

    if (risk.reasons.length > 0) {
      message += `原因：\n`;
      risk.reasons.forEach((reason) => {
        message += `- ${reason}\n`;
      });
      message += '\n';
    }

    if (risk.recommendedActions.length > 0) {
      message += `建議行動：\n`;
      risk.recommendedActions.forEach((action) => {
        message += `- ${action}\n`;
      });
    }

    return message;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    switch (notification.type) {
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'push':
        await this.sendPush(notification);
        break;
      case 'system':
      default:
        await this.saveToSystem(notification);
        break;
    }
  }

  private async sendSMS(notification: Notification): Promise<void> {
    this.logger.log(`[SMS] Sending to ${notification.recipientPhone}: ${notification.message}`);
  }

  private async sendEmail(notification: Notification): Promise<void> {
    this.logger.log(`[Email] Sending to ${notification.recipientEmail}: ${notification.title}`);
  }

  private async sendPush(notification: Notification): Promise<void> {
    this.logger.log(`[Push] Sending to ${notification.recipientId}: ${notification.title}`);
  }

  private async saveToSystem(notification: Notification): Promise<void> {
    this.logger.log(`[System] Saved notification for ${notification.recipientName}`);
  }
}
