import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(TreatmentSession)
    private readonly sessionRepository: Repository<TreatmentSession>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 每天早上 08:00（台北時間）掃描明天的預約並發送提醒（NOTIF-04）
   * 使用 DATE() 函數處理 SQLite 字串日期欄位（參考 02-RESEARCH.md 陷阱 4）
   */
  @Cron('0 8 * * *', { timeZone: 'Asia/Taipei' })
  async sendAppointmentReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // 'yyyy-MM-dd'

    this.logger.log(`掃描 ${tomorrowStr} 的預約提醒`);

    try {
      const sessions = await this.sessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.treatmentCourse', 'course')
        .leftJoinAndSelect('course.patient', 'patient')
        .where('DATE(session.scheduledDate) = :date', { date: tomorrowStr })
        .andWhere('session.completionStatus = :status', { status: 'pending' })
        .getMany();

      this.logger.log(`找到 ${sessions.length} 個預約提醒`);

      for (const session of sessions) {
        const patient = session.treatmentCourse?.patient;
        if (!patient) {
          this.logger.warn(`session ${session.id} 無關聯患者，跳過`);
          continue;
        }

        try {
          await this.notificationService.sendMultiChannel({
            patient,
            eventType: 'appointment_reminder',
            title: '明日療程提醒',
            message: `親愛的 ${patient.name}，提醒您明天（${tomorrowStr}）有療程預約，請準時前往診所。`,
            relatedEntityId: session.id,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.error(`發送預約提醒失敗 sessionId=${session.id}: ${msg}`);
          // 繼續處理其他 session，不中斷整個批次
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`預約提醒排程失敗: ${msg}`);
    }
  }
}
