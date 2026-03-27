import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { NotificationService } from '../services/notification.service';
import { CourseStartedEvent } from '../../events/course-started.event';
import { CourseCompletedEvent } from '../../events/course-completed.event';

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * 處理療程開始事件（NOTIF-01）
   */
  @OnEvent('course.started', { async: true })
  async handleCourseStarted(event: CourseStartedEvent): Promise<void> {
    this.logger.log(`處理 course.started 事件: courseId=${event.courseId}`);
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: event.patientId },
      });
      if (!patient) {
        this.logger.warn(`患者不存在: patientId=${event.patientId}`);
        return;
      }
      await this.notificationService.sendMultiChannel({
        patient,
        eventType: 'course_started',
        title: '療程已開始',
        message: `親愛的 ${patient.name}，您的療程已正式開始，請按預約時間前來接受治療。`,
        relatedEntityId: event.courseId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`處理 course.started 通知失敗: ${msg}`, stack);
      // 不拋出：避免影響其他 listener（如 RevenueEventListener）
    }
  }

  /**
   * 處理療程次數完成事件（NOTIF-02）
   */
  @OnEvent('session.completed', { async: true })
  async handleSessionCompleted(event: {
    sessionId: string;
    treatmentCourseId: string;
    patientId: string;
    completedAt: Date;
  }): Promise<void> {
    this.logger.log(
      `處理 session.completed 通知: sessionId=${event.sessionId}`,
    );
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: event.patientId },
      });
      if (!patient) {
        this.logger.warn(`患者不存在: patientId=${event.patientId}`);
        return;
      }
      await this.notificationService.sendMultiChannel({
        patient,
        eventType: 'session_completed',
        title: '療程進度更新',
        message: `親愛的 ${patient.name}，您完成了一次療程，繼續保持！請留意下次預約時間。`,
        relatedEntityId: event.sessionId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`處理 session.completed 通知失敗: ${msg}`, stack);
    }
  }

  /**
   * 處理療程完成事件（NOTIF-03）
   */
  @OnEvent('course.completed', { async: true })
  async handleCourseCompleted(event: CourseCompletedEvent): Promise<void> {
    this.logger.log(`處理 course.completed 事件: courseId=${event.courseId}`);
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: event.patientId },
      });
      if (!patient) {
        this.logger.warn(`患者不存在: patientId=${event.patientId}`);
        return;
      }
      await this.notificationService.sendMultiChannel({
        patient,
        eventType: 'course_completed',
        title: '療程圓滿完成',
        message: `親愛的 ${patient.name}，恭喜您完成了完整的療程！感謝您的信任，期待再次為您服務。`,
        relatedEntityId: event.courseId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`處理 course.completed 通知失敗: ${msg}`, stack);
    }
  }
}
