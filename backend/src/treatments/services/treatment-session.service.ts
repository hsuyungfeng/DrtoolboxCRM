import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository, DataSource } from "typeorm";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
import { Treatment } from "../entities/treatment.entity";
import { PPFCalculationService } from "./ppf-calculation.service";
import Decimal from "decimal.js";

/**
 * 療程會話管理服務 (TreatmentSessionService)
 *
 * 負責管理療程次數的生命週期，包括：
 * 1. updateSession: 簡單更新療程欄位 (備註、反饋等)
 * 2. completeSession: 複雜的療程完成流程 (事務處理 + PPF 計算 + 狀態更新)
 * 3. getStaffSessions: 查詢員工相關的所有療程次數
 */
@Injectable()
export class TreatmentSessionService {
  constructor(
    @InjectRepository(TreatmentSession)
    private readonly sessionRepository: Repository<TreatmentSession>,
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(StaffAssignment)
    private readonly assignmentRepository: Repository<StaffAssignment>,
    private readonly ppfCalculationService: PPFCalculationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 簡單更新療程欄位
   * 只更新：scheduledDate、therapistNotes、patientFeedback
   * 不觸發完成流程、PPF 計算或事件
   */
  async updateSession(
    sessionId: string,
    updateDto: UpdateTreatmentSessionDto,
    clinicId: string,
  ): Promise<TreatmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, clinicId },
    });

    if (!session) {
      throw new NotFoundException(
        `療程次數不存在或診所 ID 不匹配 - sessionId: ${sessionId}`,
      );
    }

    // 只更新允許的欄位
    if (updateDto.scheduledDate !== undefined) {
      session.scheduledDate = updateDto.scheduledDate;
    }
    if (updateDto.therapistNotes !== undefined) {
      session.therapistNotes = updateDto.therapistNotes;
    }
    if (updateDto.patientFeedback !== undefined) {
      session.patientFeedback = updateDto.patientFeedback;
    }

    return await this.sessionRepository.save(session);
  }

  /**
   * 複雜的療程完成流程 (完整事務)
   * 步驟：
   * 1. 查詢並驗證 session
   * 2. 更新 session 欄位
   * 3. 處理員工分配和 PPF 計算
   * 4. 保存並發出事件
   * 5. 檢查並更新療程套餐狀態
   */
  async completeSession(
    sessionId: string,
    updateDto: UpdateTreatmentSessionDto,
    clinicId: string,
  ): Promise<TreatmentSession> {
    return await this.dataSource.transaction(async (manager) => {
      // Step 1: 查詢 session 並驗證
      const session = await manager.findOne(TreatmentSession, {
        where: { id: sessionId, clinicId },
        relations: ["treatmentCourse", "staffAssignments"],
      });

      if (!session) {
        throw new NotFoundException(
          `療程次數不存在或診所 ID 不匹配 - sessionId: ${sessionId}`,
        );
      }

      // 檢查 completion status
      if (session.completionStatus !== "pending") {
        throw new BadRequestException(
          `療程次數無法完成 - 當前狀態為 ${session.completionStatus}，只有 pending 狀態可以完成`,
        );
      }

      // Step 2: 更新 session 欄位
      if (updateDto.actualStartTime !== undefined) {
        session.actualStartTime = updateDto.actualStartTime;
      }
      if (updateDto.actualEndTime !== undefined) {
        session.actualEndTime = updateDto.actualEndTime;
      }
      if (updateDto.therapistNotes !== undefined) {
        session.therapistNotes = updateDto.therapistNotes;
      }
      if (updateDto.patientFeedback !== undefined) {
        session.patientFeedback = updateDto.patientFeedback;
      }

      session.completionStatus = "completed";

      // Step 3: 處理員工分配 (如果提供)
      if (
        updateDto.staffAssignments &&
        updateDto.staffAssignments.length > 0
      ) {
        // 驗證百分比總和
        this.ppfCalculationService.validateStaffAssignments(
          updateDto.staffAssignments,
        );

        // 刪除舊的分配記錄
        await manager.delete(StaffAssignment, { sessionId });

        // 創建新的分配記錄
        const newAssignments: StaffAssignment[] = [];
        for (const assignmentDto of updateDto.staffAssignments) {
          const assignment = new StaffAssignment();
          assignment.sessionId = sessionId;
          assignment.staffId = assignmentDto.staffId;
          assignment.staffRole = assignmentDto.staffRole;
          assignment.ppfPercentage = new Decimal(assignmentDto.ppfPercentage);
          newAssignments.push(assignment);
        }

        // 計算每次療程的支付金額
        const courseWithSessions = await manager.findOne(TreatmentCourse, {
          where: { id: session.treatmentCourseId },
          relations: ["sessions"],
        });

        if (!courseWithSessions) {
          throw new NotFoundException(
            `療程套餐不存在 - courseId: ${session.treatmentCourseId}`,
          );
        }

        const totalSessions = courseWithSessions.sessions?.length || 1;
        const paymentPerSession = courseWithSessions.actualPayment.dividedBy(
          totalSessions,
        );

        // 使用 PPFCalculationService 計算 PPF
        const assignmentsWithPPF = await this.ppfCalculationService.distributeToStaff(
          sessionId,
          paymentPerSession,
          newAssignments,
        );

        session.staffAssignments = assignmentsWithPPF;
      }

      // Step 4: 保存 session
      const savedSession = await manager.save(TreatmentSession, session);

      // Step 5: 發出事件
      this.eventEmitter.emit("session.completed", {
        sessionId: savedSession.id,
        treatmentCourseId: savedSession.treatmentCourseId,
        patientId: session.treatmentCourse.patientId,
        completedAt: new Date(),
        staffAssignments: session.staffAssignments,
      });

      // Step 6: 檢查並更新療程套餐狀態
      const allSessions = await manager.find(TreatmentSession, {
        where: { treatmentCourseId: session.treatmentCourseId },
      });

      const completedCount = allSessions.filter(
        (s) => s.completionStatus === "completed",
      ).length;

      if (completedCount === allSessions.length) {
        const course = await manager.findOne(TreatmentCourse, {
          where: { id: session.treatmentCourseId },
        });

        if (course) {
          course.status = "completed";
          course.completedAt = new Date();
          await manager.save(TreatmentCourse, course);
        }
      }

      // Step 7: 返回已保存的 session
      return savedSession;
    });
  }

  /**
   * 查詢員工相關的所有療程次數
   * 支持按狀態和日期範圍過濾
   */
  async getStaffSessions(
    staffId: string,
    clinicId: string,
    filter?: { status?: string; startDate?: Date; endDate?: Date },
  ): Promise<TreatmentSession[]> {
    // 查詢該員工的所有分配
    const assignments = await this.assignmentRepository.find({
      where: { staffId },
      relations: ["session", "session.treatmentCourse"],
    });

    // 提取 sessions 並應用診所和過濾條件
    let sessions = assignments
      .map((a) => a.session)
      .filter(
        (s) =>
          s &&
          s.clinicId === clinicId &&
          (!filter?.status || s.completionStatus === filter.status) &&
          (!filter?.startDate || s.scheduledDate >= filter.startDate) &&
          (!filter?.endDate || s.scheduledDate <= filter.endDate),
      );

    // 按 scheduledDate 降序排列
    sessions.sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return dateB - dateA;
    });

    return sessions;
  }

  /**
   * 以下是舊有的 API，保持向後相容
   */

  async create(
    createTreatmentSessionDto: CreateTreatmentSessionDto,
  ): Promise<TreatmentSession> {
    const treatment = await this.courseRepository.findOne({
      where: {
        id: createTreatmentSessionDto.treatmentId,
        clinicId: createTreatmentSessionDto.clinicId,
      },
    });

    if (!treatment) {
      throw new NotFoundException(
        `Treatment with ID ${createTreatmentSessionDto.treatmentId} not found in clinic ${createTreatmentSessionDto.clinicId}`,
      );
    }

    const session = this.sessionRepository.create(
      createTreatmentSessionDto,
    );
    return await this.sessionRepository.save(session);
  }

  async findAllByTreatment(
    treatmentId: string,
    clinicId: string,
  ): Promise<TreatmentSession[]> {
    return await this.sessionRepository.find({
      where: { treatmentCourseId: treatmentId, clinicId },
      order: { sessionNumber: "ASC" },
      relations: ["treatmentCourse"],
    });
  }

  async findAllByClinic(clinicId: string): Promise<TreatmentSession[]> {
    return await this.sessionRepository.find({
      where: { clinicId },
      order: { createdAt: "DESC" },
      relations: ["treatmentCourse"],
    });
  }

  async findOne(id: string): Promise<TreatmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ["treatmentCourse"],
    });

    if (!session) {
      throw new NotFoundException(`TreatmentSession with ID ${id} not found`);
    }

    return session;
  }

  async update(
    id: string,
    updateTreatmentSessionDto: UpdateTreatmentSessionDto,
  ): Promise<TreatmentSession> {
    const session = await this.findOne(id);

    if (
      updateTreatmentSessionDto.status === "completed" &&
      !session.actualStartTime
    ) {
      session.actualStartTime = new Date();
    }

    Object.assign(session, updateTreatmentSessionDto);
    return await this.sessionRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    session.completionStatus = "cancelled";
    await this.sessionRepository.save(session);
  }

  async findByStatus(
    clinicId: string,
    status: "pending" | "completed" | "cancelled",
  ): Promise<TreatmentSession[]> {
    return await this.sessionRepository.find({
      where: { clinicId, completionStatus: status },
      order: { scheduledDate: "ASC" },
      relations: ["treatmentCourse"],
    });
  }

  async findUpcomingSessions(
    clinicId: string,
    days: number = 7,
  ): Promise<TreatmentSession[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.sessionRepository
      .createQueryBuilder("session")
      .where("session.clinicId = :clinicId", { clinicId })
      .andWhere("session.scheduledDate >= :startDate", { startDate })
      .andWhere("session.scheduledDate <= :endDate", { endDate })
      .andWhere("session.completionStatus IN (:...statuses)", {
        statuses: ["pending", "in_progress"],
      })
      .orderBy("session.scheduledDate", "ASC")
      .leftJoinAndSelect("session.treatmentCourse", "treatmentCourse")
      .getMany();
  }

  /**
   * 舊的 completeSession 簽名（向後相容）
   * @deprecated 使用新的 completeSession(sessionId, updateDto, clinicId) 代替
   */
  async completeSessionLegacy(
    id: string,
    notes?: string,
    observations?: string,
  ): Promise<TreatmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ["treatmentCourse"],
    });

    if (!session) {
      throw new NotFoundException(`TreatmentSession with ID ${id} not found`);
    }

    session.completionStatus = "completed";
    session.actualStartTime = new Date();

    if (notes) session.therapistNotes = notes;
    if (observations) session.patientFeedback = observations;

    return await this.sessionRepository.save(session);
  }
}
