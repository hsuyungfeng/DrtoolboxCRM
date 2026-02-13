import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TreatmentTemplate } from "../entities/treatment-template.entity";
import { CreateTreatmentTemplateDto } from "../dto/create-treatment-template.dto";
import { UpdateTreatmentTemplateDto } from "../dto/update-treatment-template.dto";

@Injectable()
export class TreatmentTemplateService {
  private readonly logger = new Logger(TreatmentTemplateService.name);

  constructor(
    @InjectRepository(TreatmentTemplate)
    private readonly templateRepository: Repository<TreatmentTemplate>,
  ) {}

  async create(dto: CreateTreatmentTemplateDto): Promise<TreatmentTemplate> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  async findAll(clinicId: string): Promise<TreatmentTemplate[]> {
    return this.templateRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string, clinicId: string): Promise<TreatmentTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, clinicId },
    });
    if (!template) {
      throw new NotFoundException(`療法模板 ${id} 不存在`);
    }
    return template;
  }

  async update(
    id: string,
    clinicId: string,
    dto: UpdateTreatmentTemplateDto,
  ): Promise<TreatmentTemplate> {
    const template = await this.findById(id, clinicId);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async delete(id: string, clinicId: string): Promise<void> {
    const template = await this.findById(id, clinicId);
    template.isActive = false;
    await this.templateRepository.save(template);
  }
}
