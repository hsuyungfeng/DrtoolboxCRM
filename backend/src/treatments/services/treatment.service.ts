import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Treatment } from "../entities/treatment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";
import { AttributeService } from "../../common/attributes/services/attribute.service";
import { AttributeTarget } from "../../common/attributes/entities/attribute-definition.entity";

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);

  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    private attributeService: AttributeService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
    // 驗證自定義欄位
    if (createTreatmentDto.customFields) {
      await this.attributeService.validateCustomFields(
        createTreatmentDto.clinicId,
        AttributeTarget.TREATMENT,
        createTreatmentDto.customFields,
      );
    }

    const treatment = this.treatmentRepository.create(createTreatmentDto);
    const savedTreatment = await this.treatmentRepository.save(treatment);

    // 發送 treatment.created 事件
    this.emitEvent("treatment.created", savedTreatment);

    return savedTreatment;
  }

  async findAll(clinicId: string): Promise<Treatment[]> {
    return await this.treatmentRepository.find({
      where: { clinicId },
      order: { createdAt: "DESC" },
      relations: ["patient", "sessions", "staffAssignments"],
    });
  }

  async findOne(id: string): Promise<Treatment> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: ["patient", "sessions", "staffAssignments"],
    });

    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    return treatment;
  }

  async update(
    id: string,
    updateTreatmentDto: UpdateTreatmentDto,
  ): Promise<Treatment> {
    const treatment = await this.findOne(id);

    // 驗證自定義欄位
    if (updateTreatmentDto.customFields) {
      await this.attributeService.validateCustomFields(
        treatment.clinicId,
        AttributeTarget.TREATMENT,
        updateTreatmentDto.customFields,
      );
    }

    Object.assign(treatment, updateTreatmentDto);
    const savedTreatment = await this.treatmentRepository.save(treatment);

    // 發送事件
    this.emitEvent("treatment.updated", savedTreatment);

    return savedTreatment;
  }

  async remove(id: string): Promise<void> {
    const treatment = await this.findOne(id);
    // 软删除：将状态标记为 cancelled
    treatment.status = "cancelled";
    const savedTreatment = await this.treatmentRepository.save(treatment);

    // 發送事件
    this.emitEvent("treatment.deleted", savedTreatment);
  }

  /**
   * 發送事件助手方法
   */
  private emitEvent(eventName: string, treatment: Treatment) {
    try {
      this.eventEmitter.emit(eventName, {
        treatmentId: treatment.id,
        patientId: treatment.patientId,
        clinicId: treatment.clinicId,
        data: treatment,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit ${eventName} event: ${error.message}`);
    }
  }

  async findByPatientId(patientId: string): Promise<Treatment[]> {
    return await this.treatmentRepository.find({
      where: { patientId },
      order: { createdAt: "DESC" },
      relations: ["sessions", "staffAssignments"],
    });
  }

  async updateCompletedSessions(
    id: string,
    completedSessions: number,
  ): Promise<Treatment> {
    const treatment = await this.findOne(id);
    treatment.completedSessions = completedSessions;

    // 如果完成次数等于总次数，自动更新状态为 completed
    if (treatment.completedSessions >= treatment.totalSessions) {
      treatment.status = "completed";
      treatment.actualEndDate = new Date();
    } else if (treatment.completedSessions > 0) {
      treatment.status = "in_progress";
    }

    return await this.treatmentRepository.save(treatment);
  }
}
