import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CourseCompletedEvent } from "../../events/course-completed.event";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentTemplate } from "../../treatment-templates/entities/treatment-template.entity";
import { NotificationService } from "../../notifications/services/notification.service";
import { Patient } from "../../patients/entities/patient.entity";

@Injectable()
export class TreatmentEventListener {
  private readonly logger = new Logger(TreatmentEventListener.name);

  constructor(
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentTemplate)
    private readonly templateRepository: Repository<TreatmentTemplate>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent("course.completed")
  async handleCourseCompleted(event: CourseCompletedEvent) {
    this.logger.log(`Handling course.completed event for course ${event.courseId}`);

    try {
      // 1. 獲取療程資訊
      const course = await this.courseRepository.findOne({
        where: { id: event.courseId },
      });

      if (!course || !course.templateId) {
        return;
      }

      // 2. 獲取模板資訊（確認回診間隔）
      const template = await this.templateRepository.findOne({
        where: { id: course.templateId },
      });

      if (!template || !template.followUpIntervalDays || template.followUpIntervalDays <= 0) {
        this.logger.debug(`No follow-up interval set for template ${template?.name || 'unknown'}`);
        return;
      }

      // 3. 獲取患者資訊
      const patient = await this.patientRepository.findOne({
        where: { id: event.patientId },
      });

      if (!patient) {
        return;
      }

      // 4. 計算提醒日期
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + template.followUpIntervalDays);

      // 5. 發送/排程通知
      await this.notificationService.sendNotification({
        type: "system",
        recipientId: patient.id,
        recipientName: patient.name,
        recipientPhone: patient.phoneNumber,
        recipientEmail: patient.email,
        title: "療程完成回診提醒",
        message: `親愛的 ${patient.name} 您好，您購買的「${course.name}」已完成。建議您在 ${template.followUpIntervalDays} 天後（約 ${scheduledAt.toLocaleDateString('zh-TW')}）回診追蹤，以確保最佳療效。`,
        priority: "medium",
        clinicId: event.clinicId,
      });

      this.logger.log(`Scheduled follow-up notification for patient ${patient.name} in ${template.followUpIntervalDays} days`);
    } catch (error) {
      this.logger.error(`Error handling course.completed event: ${error.message}`);
    }
  }
}
