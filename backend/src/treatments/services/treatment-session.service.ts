import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
import { Treatment } from "../entities/treatment.entity";
import { SessionCompletedEvent } from "../../events/session-completed.event";
import { TreatmentCompletedEvent } from "../../events/treatment-completed.event";

@Injectable()
export class TreatmentSessionService {
  constructor(
    @InjectRepository(TreatmentSession)
    private treatmentSessionRepository: Repository<TreatmentSession>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createTreatmentSessionDto: CreateTreatmentSessionDto,
  ): Promise<TreatmentSession> {
    // 验证关联的 Treatment 存在
    const treatment = await this.treatmentRepository.findOne({
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

    const session = this.treatmentSessionRepository.create(
      createTreatmentSessionDto,
    );
    return await this.treatmentSessionRepository.save(session);
  }

  async findAllByTreatment(
    treatmentId: string,
    clinicId: string,
  ): Promise<TreatmentSession[]> {
    return await this.treatmentSessionRepository.find({
      where: { treatmentId, clinicId },
      order: { sessionIndex: "ASC" },
      relations: ["treatment"],
    });
  }

  async findAllByClinic(clinicId: string): Promise<TreatmentSession[]> {
    return await this.treatmentSessionRepository.find({
      where: { clinicId },
      order: { createdAt: "DESC" },
      relations: ["treatment"],
    });
  }

  async findOne(id: string): Promise<TreatmentSession> {
    const session = await this.treatmentSessionRepository.findOne({
      where: { id },
      relations: ["treatment"],
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

    // 如果状态更新为 completed，自动设置 actualTime
    if (
      updateTreatmentSessionDto.status === "completed" &&
      !session.actualTime
    ) {
      session.actualTime = new Date();
    }

    Object.assign(session, updateTreatmentSessionDto);
    return await this.treatmentSessionRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    // 软删除：将状态标记为 cancelled
    session.status = "cancelled";
    await this.treatmentSessionRepository.save(session);
  }

  async completeSession(
    id: string,
    notes?: string,
    observations?: string,
  ): Promise<TreatmentSession> {
    const session = await this.findOne(id);

    session.status = "completed";
    session.actualTime = new Date();

    if (notes) session.notes = notes;
    if (observations) session.observations = observations;

    const savedSession = await this.treatmentSessionRepository.save(session);

    // 發出療程次數完成事件
    this.eventEmitter.emit(
      "session.completed",
      new SessionCompletedEvent(
        savedSession.id,
        savedSession.treatmentId,
        savedSession.clinicId,
        savedSession.actualTime,
      ),
    );

    // 更新治療的 completedSessions 計數並檢查是否全部完成
    await this.updateTreatmentCompletionStatus(
      savedSession.treatmentId,
      savedSession.clinicId,
    );

    return savedSession;
  }

  async findByStatus(
    clinicId: string,
    status: string,
  ): Promise<TreatmentSession[]> {
    return await this.treatmentSessionRepository.find({
      where: { clinicId, status },
      order: { scheduledTime: "ASC" },
      relations: ["treatment"],
    });
  }

  async findUpcomingSessions(
    clinicId: string,
    days: number = 7,
  ): Promise<TreatmentSession[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.treatmentSessionRepository
      .createQueryBuilder("session")
      .where("session.clinicId = :clinicId", { clinicId })
      .andWhere("session.scheduledTime >= :startDate", { startDate })
      .andWhere("session.scheduledTime <= :endDate", { endDate })
      .andWhere("session.status IN (:...statuses)", {
        statuses: ["scheduled", "in_progress"],
      })
      .orderBy("session.scheduledTime", "ASC")
      .leftJoinAndSelect("session.treatment", "treatment")
      .getMany();
  }

  /**
   * 更新治療完成狀態並檢查是否全部完成
   */
  private async updateTreatmentCompletionStatus(
    treatmentId: string,
    clinicId: string,
  ): Promise<void> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId, clinicId },
      relations: ["sessions"],
    });

    if (!treatment) {
      return;
    }

    // 計算已完成的療程次數
    const completedSessions =
      treatment.sessions?.filter((s) => s.status === "completed").length || 0;

    // 更新治療的 completedSessions 字段
    treatment.completedSessions = completedSessions;

    // 檢查是否所有次數都已完成
    const allSessionsCompleted = completedSessions >= treatment.totalSessions;

    if (allSessionsCompleted && treatment.status !== "completed") {
      treatment.status = "completed";
      treatment.actualEndDate = new Date();

      await this.treatmentRepository.save(treatment);

      // 發出治療完成事件
      this.eventEmitter.emit(
        "treatment.completed",
        new TreatmentCompletedEvent(
          treatment.id,
          treatment.clinicId,
          treatment.actualEndDate,
        ),
      );
    } else {
      // 即使未全部完成，也保存 updated completedSessions
      await this.treatmentRepository.save(treatment);
    }
  }
}
