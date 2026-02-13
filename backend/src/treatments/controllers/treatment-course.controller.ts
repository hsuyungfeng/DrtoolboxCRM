import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TreatmentCourseService } from "../services/treatment-course.service";
import { TreatmentSessionService } from "../services/treatment-session.service";
import { TreatmentCourseTemplateService } from "../services/treatment-course-template.service";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";

/**
 * 療程 REST API 控制器
 * 負責處理療程相關的 HTTP 請求
 * 支持五個主要端點：
 * 1. POST /treatments/courses - 建立療程套餐
 * 2. GET /treatments/courses/:courseId - 查詢特定療程套餐
 * 3. GET /treatments/templates - 查詢所有可用課程模板
 * 4. PUT /treatments/sessions/:sessionId - 完成療程次數
 * 5. GET /staff/:staffId/sessions - 查詢治療師的所有療程次數
 */
@Controller("treatments")
@UseGuards(JwtAuthGuard)
export class TreatmentCourseController {
  constructor(
    private readonly courseService: TreatmentCourseService,
    private readonly sessionService: TreatmentSessionService,
    private readonly templateService: TreatmentCourseTemplateService,
  ) {}

  /**
   * 建立療程套餐
   * POST /treatments/courses
   *
   * @param createDto 建立療程套餐的 DTO
   * @returns 新建立的療程套餐
   * @throws BadRequestException 當參數驗證失敗時
   * @throws NotFoundException 當模板或患者不存在時
   */
  @Post("courses")
  async createCourse(@Body() createDto: CreateTreatmentCourseDto) {
    return await this.courseService.createCourse(createDto);
  }

  /**
   * 查詢特定療程套餐
   * GET /treatments/courses/:courseId
   *
   * @param courseId 療程套餐 ID
   * @param clinicId 診所 ID (query parameter)
   * @returns 療程套餐及其關聯的 sessions 和 staffAssignments
   * @throws NotFoundException 當療程不存在或診所 ID 不匹配時
   */
  @Get("courses/:courseId")
  async getCourseById(
    @Param("courseId") courseId: string,
    @Query("clinicId") clinicId: string,
  ) {
    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    return await this.courseService.getCourseById(courseId, clinicId);
  }

  /**
   * 查詢所有可用課程模板
   * GET /treatments/templates
   *
   * @param clinicId 診所 ID (query parameter, required)
   * @returns 該診所的所有活躍課程模板
   * @throws BadRequestException 當 clinicId 缺失時
   */
  @Get("templates")
  async getActiveTemplates(@Query("clinicId") clinicId: string) {
    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    return await this.templateService.getActiveTemplates(clinicId);
  }

  /**
   * 完成療程次數
   * PUT /treatments/sessions/:sessionId
   *
   * @param sessionId 療程次數 ID
   * @param updateDto 更新療程次數的 DTO
   * @param clinicId 診所 ID (query parameter, required)
   * @returns 已完成的療程次數
   * @throws BadRequestException 當參數驗證失敗時
   * @throws NotFoundException 當療程次數不存在時
   */
  @Put("sessions/:sessionId")
  async completeSession(
    @Param("sessionId") sessionId: string,
    @Body() updateDto: UpdateTreatmentSessionDto,
    @Query("clinicId") clinicId: string,
  ) {
    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    return await this.sessionService.completeSession(
      sessionId,
      updateDto,
      clinicId,
    );
  }
}

/**
 * 員工療程會話 REST API 控制器
 * 負責處理員工相關的療程查詢
 */
@Controller("staff")
@UseGuards(JwtAuthGuard)
export class StaffSessionController {
  constructor(private readonly sessionService: TreatmentSessionService) {}

  /**
   * 查詢治療師的所有療程次數
   * GET /staff/:staffId/sessions
   *
   * @param staffId 治療師 ID
   * @param clinicId 診所 ID (query parameter, required)
   * @param status 療程狀態 (query parameter, optional) - pending|completed|cancelled
   * @param startDate 開始日期 (query parameter, optional)
   * @param endDate 結束日期 (query parameter, optional)
   * @returns 該治療師的所有療程次數，按 scheduledDate 降序排列
   * @throws NotFoundException 當員工不存在時
   */
  @Get(":staffId/sessions")
  async getStaffSessions(
    @Param("staffId") staffId: string,
    @Query("clinicId") clinicId: string,
    @Query("status") status?: "pending" | "completed" | "cancelled",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (startDate) {
      filter.startDate = new Date(startDate);
    }

    if (endDate) {
      filter.endDate = new Date(endDate);
    }

    return await this.sessionService.getStaffSessions(
      staffId,
      clinicId,
      Object.keys(filter).length > 0 ? filter : undefined,
    );
  }
}
