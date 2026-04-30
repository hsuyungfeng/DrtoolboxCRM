import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TreatmentCourseService } from "../services/treatment-course.service";
import { TreatmentSessionService } from "../services/treatment-session.service";
import { TreatmentCourseTemplateService } from "../services/treatment-course-template.service";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentCourseDto } from "../dto/update-treatment-course.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";

/**
 * 療程 REST API 控制器
 * 負責處理療程相關的 HTTP 請求
 *
 * Treatment REST API Controller
 * Handles treatment-related HTTP requests with complete CRUD operations
 */
import { ClinicScoped } from "../../common/decorators/clinic-scoped.decorator";

@ApiBearerAuth()
@ApiTags('Treatment Courses')
@Controller("treatment-courses")
@ClinicScoped()
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
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() createDto: CreateTreatmentCourseDto,
    @Req() req: any,
  ) {
    return await this.courseService.createCourse(createDto);
  }

  /**
   * 查詢患者的所有療程套餐（Query 參數模式）
   * GET /treatments/courses?patientId=...&status=...
   *
   * @param patientId 患者 ID (query parameter)
   * @param clinicId 診所 ID (query parameter)
   * @param status 療程狀態過濾 (optional)
   * @returns 患者的所有療程套餐
   * @throws BadRequestException 當必要參數缺失時
   */
  @Get()
  @ApiOperation({ summary: "查詢療程套餐列表" })
  async getPatientCourses(
    @Query("clinicId") clinicId: string,
    @Query("patientId") patientId?: string,
    @Query("status") status?: string,
  ) {
    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    if (patientId) {
      const courses = await this.courseService.getPatientCourses(patientId, clinicId, status);
      return {
        statusCode: 200,
        data: courses,
        count: courses.length,
      };
    }

    // 如果沒有 patientId，則返回該診所的所有療程
    const courses = await this.courseService.findAll(clinicId);
    return {
      statusCode: 200,
      data: courses,
      count: courses.length,
    };
  }
  /**
   * 查詢患者所有療程（路由參數模式）
   * GET /treatments/patient/:patientId
   *
   * @param patientId 患者 ID (路由參數)
   * @param clinicId 診所 ID (query parameter)
   * @param status 療程狀態過濾 (optional)
   * @returns 患者所有療程含進度
   */
  @Get("patient/:patientId")
  async getPatientTreatments(
    @Param("patientId") patientId: string,
    @Query("clinicId") clinicId: string,
    @Query("status") status?: string,
    @Req() req?: any,
  ) {
    const resolvedClinicId = clinicId || req?.user?.clinicId;

    if (!resolvedClinicId || resolvedClinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const courses = await this.courseService.getPatientCourses(patientId, resolvedClinicId, status);
    return {
      statusCode: 200,
      data: courses,
      count: courses.length,
    };
  }

  /**
   * 查詢特定療程套餐（含進度）
   * GET /treatments/courses/:courseId
   *
   * @param courseId 療程套餐 ID
   * @param clinicId 診所 ID (query parameter)
   * @returns 療程套餐及其關聯的 sessions、staffAssignments 和進度
   * @throws NotFoundException 當療程不存在或診所 ID 不匹配時
   */
  @Get("courses/:courseId")
  async getCourseById(
    @Param("courseId") courseId: string,
    @Query("clinicId") clinicId: string,
    @Req() req?: any,
  ) {
    const resolvedClinicId = clinicId || req?.user?.clinicId;

    if (!resolvedClinicId || resolvedClinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const course = await this.courseService.getCourseWithProgress(courseId, resolvedClinicId);
    return {
      statusCode: 200,
      data: course,
    };
  }

  /**
   * 取得療程的所有課程
   * GET /treatments/courses/:courseId/sessions
   *
   * @param courseId 療程 ID
   * @param clinicId 診所 ID
   * @returns 課程列表（含醫護分配）
   */
  @Get("courses/:courseId/sessions")
  async getCourseSessions(
    @Param("courseId") courseId: string,
    @Query("clinicId") clinicId: string,
    @Req() req?: any,
  ) {
    const resolvedClinicId = clinicId || req?.user?.clinicId;

    if (!resolvedClinicId || resolvedClinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const sessions = await this.courseService.getCourseSessions(courseId, resolvedClinicId);
    return {
      statusCode: 200,
      data: sessions,
      count: sessions.length,
    };
  }

  /**
   * 編輯療程詳情
   * PATCH /treatments/courses/:courseId
   *
   * @param courseId 療程套餐 ID
   * @param dto 更新療程的 DTO
   * @param clinicId 診所 ID (query parameter)
   * @returns 更新後的療程套餐
   * @throws NotFoundException 當療程不存在時
   * @throws BadRequestException 當狀態無效時
   */
  @Patch("courses/:courseId")
  async updateCourse(
    @Param("courseId") courseId: string,
    @Body() dto: UpdateTreatmentCourseDto,
    @Query("clinicId") clinicId: string,
    @Req() req?: any,
  ) {
    const resolvedClinicId = clinicId || req?.user?.clinicId;

    if (!resolvedClinicId || resolvedClinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    const course = await this.courseService.updateCourse(courseId, dto, resolvedClinicId);
    return {
      statusCode: 200,
      message: '療程已更新',
      data: course,
    };
  }

  /**
   * 刪除療程
   * DELETE /treatments/courses/:courseId
   *
   * @param courseId 療程套餐 ID
   * @param clinicId 診所 ID (query parameter)
   * @throws NotFoundException 當療程不存在時
   * @throws BadRequestException 當療程已開始不能刪除時
   */
  @Delete("courses/:courseId")
  async deleteCourse(
    @Param("courseId") courseId: string,
    @Query("clinicId") clinicId: string,
    @Req() req?: any,
  ) {
    const resolvedClinicId = clinicId || req?.user?.clinicId;

    if (!resolvedClinicId || resolvedClinicId.trim() === "") {
      throw new BadRequestException("clinicId 不能為空");
    }

    await this.courseService.deleteCourse(courseId, resolvedClinicId);
    return {
      statusCode: 200,
      message: '療程已刪除',
    };
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

  /**
   * 標記療程次數為已完成（前端快捷操作）
   * PATCH /treatments/sessions/:id/complete
   *
   * 供前端 treatmentsApi.completeSession 呼叫，路由與前端完全匹配
   *
   * @param sessionId 療程次數 ID
   * @returns 已完成的療程次數
   * @throws NotFoundException 當療程次數不存在時
   */
  @Patch("sessions/:id/complete")
  async markSessionComplete(
    @Param("id") sessionId: string,
    @Req() req?: any,
  ) {
    const updateDto: UpdateTreatmentSessionDto = {
      completionStatus: "completed",
      actualEndTime: new Date(),
    };

    return await this.sessionService.completeSession(
      sessionId,
      updateDto,
      req?.user?.clinicId,
    );
  }
}

/**
 * 員工療程會話 REST API 控制器
 * 負責處理員工相關的療程查詢
 */
@Controller("staff-sessions")
@ClinicScoped()
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
