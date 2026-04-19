import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Treatment } from "../entities/treatment.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);

  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(TreatmentStaffAssignment)
    private staffAssignmentRepository: Repository<TreatmentStaffAssignment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
    const { staffAssignments, ...treatmentData } = createTreatmentDto;
    const treatment = this.treatmentRepository.create(treatmentData);
    const savedTreatment = await this.treatmentRepository.save(treatment);

    // 創建員工分配
    if (staffAssignments && staffAssignments.length > 0) {
      for (const assignment of staffAssignments) {
        const staffAssignment = this.staffAssignmentRepository.create({
          treatmentId: savedTreatment.id,
          staffId: assignment.staffId,
          role: assignment.role,
          revenuePercentage: assignment.revenuePercentage || 0,
          isActive: true,
        });
        await this.staffAssignmentRepository.save(staffAssignment);
      }
    }

    // 發送 treatment.created 事件
    try {
      this.eventEmitter.emit("treatment.created", {
        treatmentId: savedTreatment.id,
        patientId: savedTreatment.patientId,
        clinicId: savedTreatment.clinicId,
        staffAssignments: staffAssignments?.length || 0,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit treatment.created event: ${error.message}`,
      );
    }

    return await this.findOne(savedTreatment.id);
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
    Object.assign(treatment, updateTreatmentDto);
    return await this.treatmentRepository.save(treatment);
  }

  async remove(id: string): Promise<void> {
    const treatment = await this.findOne(id);
    // 软删除：将状态标记为 cancelled
    treatment.status = "cancelled";
    await this.treatmentRepository.save(treatment);
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

    if (treatment.completedSessions >= treatment.totalSessions) {
      treatment.status = "completed";
      treatment.actualEndDate = new Date();
    } else if (treatment.completedSessions > 0) {
      treatment.status = "in_progress";
    }

    return await this.treatmentRepository.save(treatment);
  }

  // 員工分配方法
  async addStaffAssignment(
    treatmentId: string,
    assignmentData: { staffId: string; role: string; revenuePercentage?: number },
  ): Promise<TreatmentStaffAssignment> {
    await this.findOne(treatmentId); // 驗證治療存在

    const assignment = this.staffAssignmentRepository.create({
      treatmentId,
      staffId: assignmentData.staffId,
      role: assignmentData.role,
      revenuePercentage: assignmentData.revenuePercentage || 0,
      isActive: true,
    });

    return await this.staffAssignmentRepository.save(assignment);
  }

  async getStaffAssignments(treatmentId: string): Promise<TreatmentStaffAssignment[]> {
    return await this.staffAssignmentRepository.find({
      where: { treatmentId, isActive: true },
      relations: ["staff"],
    });
  }

  async removeStaffAssignment(
    treatmentId: string,
    assignmentId: string,
  ): Promise<void> {
    const assignment = await this.staffAssignmentRepository.findOne({
      where: { id: assignmentId, treatmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Staff assignment ${assignmentId} not found`);
    }

    assignment.isActive = false;
    await this.staffAssignmentRepository.save(assignment);
  }

  async updateStaffAssignment(
    treatmentId: string,
    assignmentId: string,
    updateData: { role?: string; revenuePercentage?: number },
  ): Promise<TreatmentStaffAssignment> {
    const assignment = await this.staffAssignmentRepository.findOne({
      where: { id: assignmentId, treatmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Staff assignment ${assignmentId} not found`);
    }

    Object.assign(assignment, updateData);
    return await this.staffAssignmentRepository.save(assignment);
  }
}
