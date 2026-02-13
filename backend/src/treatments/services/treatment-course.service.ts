import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { TreatmentCourseTemplateService } from "./treatment-course-template.service";
import { PointsService } from "../../points/services/points.service";
import Decimal from "decimal.js";

/**
 * 療程套餐服務
 * 負責管理和查詢療程套餐
 * 提供多租戶隔離的套餐管理功能
 * 支持與點數系統的集成
 */
@Injectable()
export class TreatmentCourseService {
  private readonly logger = new Logger(TreatmentCourseService.name);

  constructor(
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentSession)
    private readonly sessionRepository: Repository<TreatmentSession>,
    private readonly templateService: TreatmentCourseTemplateService,
    private readonly pointsService: PointsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 建立療程套餐
   * 自動生成 1-N 個空 TreatmentSession（N 由模板決定）
   * 驗證模板存在
   * 計算實際支付金額 = 套餐價格 - 點數抵扣
   * 在事務中保存套餐和 sessions
   * 如有點數抵扣，調用 PointsService.redeemPoints()
   *
   * @param dto 建立療程套餐的 DTO
   * @returns 創建的療程套餐
   * @throws BadRequestException 當參數無效或點數抵扣超出限額時
   * @throws NotFoundException 當模板不存在時
   */
  async createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    // 1. 驗證輸入參數
    this.validateCreateCourseInput(dto);

    // 2. 驗證模板存在
    const template = await this.templateService.getTemplateById(
      dto.templateId,
      dto.clinicId,
    );

    if (!template) {
      this.logger.warn(
        `模板不存在 - templateId: ${dto.templateId}, clinicId: ${dto.clinicId}`,
      );
      throw new NotFoundException("課程模板不存在");
    }

    // 3. 計算實際支付金額
    const pointsRedeemed = new Decimal(dto.pointsToRedeem || 0);
    const totalPrice = new Decimal(template.totalPrice);

    if (pointsRedeemed.greaterThan(totalPrice)) {
      throw new BadRequestException("點數抵扣金額不能超過套餐價格");
    }

    const actualPayment = totalPrice.minus(pointsRedeemed);

    // 4. 在事務中建立套餐和 sessions
    const course = await this.dataSource.transaction(async (manager) => {
      // 建立療程套餐
      const newCourse = new TreatmentCourse();
      newCourse.patientId = dto.patientId;
      newCourse.templateId = dto.templateId;
      newCourse.status = "active";
      newCourse.purchaseDate = new Date();
      newCourse.purchaseAmount = totalPrice;
      newCourse.pointsRedeemed = pointsRedeemed;
      newCourse.actualPayment = actualPayment;
      newCourse.clinicId = dto.clinicId;

      const savedCourse = await manager.save(newCourse);

      // 生成 1-N 個空 sessions（N 由模板的 totalSessions 決定）
      const sessionPrice = actualPayment.dividedBy(template.totalSessions);

      for (let i = 1; i <= template.totalSessions; i++) {
        const session = new TreatmentSession();
        session.treatmentCourseId = savedCourse.id;
        session.sessionNumber = i;
        // scheduledDate 預設為 null（待定）
        session.completionStatus = "pending";
        session.sessionPrice = sessionPrice;
        session.clinicId = dto.clinicId;

        await manager.save(session);
      }

      this.logger.log(
        `成功建立療程套餐 - courseId: ${savedCourse.id}, patientId: ${dto.patientId}, 生成 ${template.totalSessions} 個 sessions`,
      );

      return savedCourse;
    });

    // 5. 如有點數抵扣，調用 PointsService.redeemPoints()
    if (pointsRedeemed.greaterThan(0)) {
      try {
        await this.pointsService.redeemPoints(
          dto.patientId,
          pointsRedeemed.toNumber(),
          dto.clinicId,
          course.id, // treatmentId 傳入課程 ID
        );
        this.logger.log(
          `成功兌換點數 - courseId: ${course.id}, patientId: ${dto.patientId}, points: ${pointsRedeemed.toString()}`,
        );
      } catch (error) {
        this.logger.error(
          `點數兌換失敗 - courseId: ${course.id}, patientId: ${dto.patientId}, error: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
        throw error;
      }
    }

    return course;
  }

  /**
   * 按 ID 查詢單個課程
   * 包含關聯的 sessions 和 staffAssignments
   * 支持多租戶隔離
   *
   * @param courseId 課程 ID
   * @param clinicId 診所 ID
   * @returns 療程套餐
   * @throws BadRequestException 當參數缺失時
   * @throws NotFoundException 當課程不存在時
   */
  async getCourseById(
    courseId: string,
    clinicId: string,
  ): Promise<TreatmentCourse> {
    // 驗證必要參數
    if (!courseId || courseId.trim() === "") {
      throw new BadRequestException("courseId 不能為空");
    }

    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId, clinicId },
      relations: ["sessions", "sessions.staffAssignments"],
    });

    if (!course) {
      this.logger.warn(
        `療程不存在 - courseId: ${courseId}, clinicId: ${clinicId}`,
      );
      throw new NotFoundException("療程不存在");
    }

    return course;
  }

  /**
   * 查詢患者的所有套餐
   * 按創建時間降序排列
   * 包含 sessions 關聯
   * 支持多租戶隔離
   *
   * @param patientId 患者 ID
   * @param clinicId 診所 ID
   * @returns 療程套餐陣列
   * @throws BadRequestException 當參數缺失時
   */
  async getPatientCourses(
    patientId: string,
    clinicId: string,
  ): Promise<TreatmentCourse[]> {
    // 驗證必要參數
    if (!patientId || patientId.trim() === "") {
      throw new BadRequestException("patientId 不能為空");
    }

    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const courses = await this.courseRepository.find({
      where: { patientId, clinicId },
      relations: ["sessions", "sessions.staffAssignments"],
      order: { createdAt: "DESC" },
    });

    this.logger.log(
      `查詢患者療程 - patientId: ${patientId}, clinicId: ${clinicId}, count: ${courses.length}`,
    );

    return courses;
  }

  /**
   * 更新課程狀態
   * 支持狀態：active, completed, abandoned
   * 當狀態為 completed 時，自動設置 completedAt
   * 支持多租戶隔離
   *
   * @param courseId 課程 ID
   * @param clinicId 診所 ID
   * @param status 新的課程狀態
   * @returns 更新後的療程套餐
   * @throws BadRequestException 當參數無效或狀態無效時
   * @throws NotFoundException 當課程不存在時
   */
  async updateCourseStatus(
    courseId: string,
    clinicId: string,
    status: "active" | "completed" | "abandoned",
  ): Promise<TreatmentCourse> {
    // 驗證必要參數
    if (!courseId || courseId.trim() === "") {
      throw new BadRequestException("courseId 不能為空");
    }

    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    // 驗證狀態有效性
    const validStatuses = ["active", "completed", "abandoned"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException("無效的課程狀態");
    }

    // 查詢課程是否存在
    const course = await this.getCourseById(courseId, clinicId);

    // 更新狀態
    course.status = status;

    // 如果狀態為 completed，設置 completedAt
    if (status === "completed") {
      course.completedAt = new Date();
    }

    // 保存更新
    const result = await this.courseRepository.save(course);

    if (!result) {
      this.logger.error(
        `更新課程狀態失敗 - courseId: ${courseId}, status: ${status}`,
      );
      throw new BadRequestException("更新課程狀態失敗");
    }

    this.logger.log(
      `成功更新課程狀態 - courseId: ${courseId}, status: ${status}`,
    );

    return result;
  }

  /**
   * 驗證建立療程套餐的輸入參數
   * @param dto 建立療程套餐的 DTO
   * @throws BadRequestException 當必要參數缺失時
   */
  private validateCreateCourseInput(dto: CreateTreatmentCourseDto): void {
    if (!dto.patientId || dto.patientId.trim() === "") {
      throw new BadRequestException("patientId 不能為空");
    }

    if (!dto.templateId || dto.templateId.trim() === "") {
      throw new BadRequestException("templateId 不能為空");
    }

    if (!dto.clinicId || dto.clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }
  }
}
