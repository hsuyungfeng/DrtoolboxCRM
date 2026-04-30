import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { TreatmentCourseTemplate } from "../entities/treatment-course-template.entity";
import { TreatmentTemplate } from "../../treatment-templates/entities/treatment-template.entity";
import { MedicalOrder } from "../entities/medical-order.entity";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentCourseDto } from "../dto/update-treatment-course.dto";
import { PointsService } from "../../points/services/points.service";
import Decimal from "decimal.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CourseStartedEvent } from "../../events/course-started.event";

/**
 * 療程套餐服務層
 */
@Injectable()
export class TreatmentCourseService {
  private readonly logger = new Logger(TreatmentCourseService.name);

  constructor(
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentTemplate)
    private readonly templateRepository: Repository<TreatmentTemplate>,
    private readonly pointsService: PointsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 建立新的療程套餐
   */
  async createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, clinicId: dto.clinicId },
    });

    if (!template) {
      throw new NotFoundException("找不到指定的療程模板");
    }

    const totalPrice = new Decimal(template.defaultPrice);
    const pointsToRedeem = new Decimal(dto.pointsToRedeem || 0);
    const actualPaymentValue = totalPrice.minus(pointsToRedeem);

    if (actualPaymentValue.isNegative()) {
      throw new BadRequestException("點數抵扣金額不能大於總金額");
    }

    const course = await this.dataSource.transaction(async (manager) => {
      // 建立課程記錄
      const newCourse = manager.create(TreatmentCourse, {
        patientId: dto.patientId,
        templateId: dto.templateId,
        name: template.name,
        purchaseAmount: totalPrice,
        purchaseDate: new Date(),
        pointsRedeemed: pointsToRedeem,
        actualPayment: actualPaymentValue,
        clinicId: dto.clinicId,
        status: "active",
      });

      const savedCourse = await manager.save(newCourse);

      // 生成 sessions
      const sessionPrice = actualPaymentValue.dividedBy(template.defaultSessions);

      for (let i = 1; i <= template.defaultSessions; i++) {
        const session = manager.create(TreatmentSession, {
          treatmentCourseId: savedCourse.id,
          sessionNumber: i,
          completionStatus: "pending",
          sessionPrice: sessionPrice,
          clinicId: dto.clinicId,
          status: "scheduled",
        });

        await manager.save(session);
      }

      // 🚨 Step 2: 購買療程時自動生成醫令
      if (template.customMedicalOrders && template.customMedicalOrders.length > 0) {
        for (const orderTemplate of template.customMedicalOrders) {
          const medicalOrder = manager.create(MedicalOrder, {
            clinicId: dto.clinicId,
            patientId: dto.patientId,
            drugOrTreatmentName: orderTemplate.nameZh || orderTemplate.nameEn,
            description: `來自療程模板: ${template.name}`,
            dosage: "按療程指示",
            usageMethod: "按療程指示",
            totalSessions: template.defaultSessions,
            completedSessions: 0,
            status: "pending",
            prescribedBy: "system", // 系統自動生成
          });
          await manager.save(medicalOrder);
        }
      }

      return savedCourse;
    });

    if (pointsToRedeem.greaterThan(0)) {
      await this.pointsService.redeemPoints(
        dto.patientId,
        pointsToRedeem.toNumber(),
        dto.clinicId,
        course.id,
      );
    }

    this.eventEmitter.emit(
      'course.started',
      new CourseStartedEvent(course.id, dto.patientId, dto.clinicId),
    );

    return course;
  }

  async findAll(clinicId: string): Promise<TreatmentCourse[]> {
    return await this.courseRepository.find({
      where: { clinicId },
      relations: ["patient", "sessions", "sessions.staffAssignments"],
      order: { createdAt: "DESC" },
    });
  }

  async getCourseById(
    courseId: string,
    clinicId: string,
  ): Promise<TreatmentCourse> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, clinicId },
      relations: ["patient", "sessions", "sessions.staffAssignments"],
    });

    if (!course) {
      throw new NotFoundException("療程不存在");
    }

    return course;
  }

  async getCourseWithProgress(
    courseId: string,
    clinicId: string,
  ): Promise<TreatmentCourse> {
    return this.getCourseById(courseId, clinicId);
  }

  async getCourseSessions(
    courseId: string,
    clinicId: string,
  ): Promise<TreatmentSession[]> {
    const course = await this.getCourseById(courseId, clinicId);
    return course.sessions || [];
  }

  async getPatientCourses(
    patientId: string,
    clinicId: string,
    status?: any,
  ): Promise<TreatmentCourse[]> {
    const where: any = { patientId, clinicId };
    if (status) where.status = status;

    return await this.courseRepository.find({
      where,
      relations: ["sessions"],
      order: { createdAt: "DESC" },
    });
  }

  async updateCourse(
    id: string,
    dto: UpdateTreatmentCourseDto,
    clinicId: string,
  ): Promise<TreatmentCourse> {
    const course = await this.getCourseById(id, clinicId);
    Object.assign(course, dto);
    return await this.courseRepository.save(course);
  }

  async deleteCourse(id: string, clinicId: string): Promise<void> {
    const course = await this.getCourseById(id, clinicId);
    await this.courseRepository.remove(course);
  }
}
