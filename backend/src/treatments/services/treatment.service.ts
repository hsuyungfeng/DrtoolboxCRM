import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Treatment } from "../entities/treatment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
    const treatment = this.treatmentRepository.create(createTreatmentDto);
    return await this.treatmentRepository.save(treatment);
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
