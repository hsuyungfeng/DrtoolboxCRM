import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { PatientService } from '../patients/services/patient.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly patientService: PatientService,
    private readonly dataSource: DataSource,
  ) {}

  async create(clinicId: string, createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create({
      ...createLeadDto,
      clinicId,
    });
    return await this.leadRepository.save(lead);
  }

  async findAll(clinicId: string): Promise<Lead[]> {
    return await this.leadRepository.find({
      where: { clinicId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, clinicId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async update(clinicId: string, id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(clinicId, id);
    Object.assign(lead, updateLeadDto);
    return await this.leadRepository.save(lead);
  }

  async remove(clinicId: string, id: string): Promise<void> {
    const lead = await this.findOne(clinicId, id);
    await this.leadRepository.remove(lead);
  }

  async updateStatus(clinicId: string, id: string, status: Lead['status']): Promise<Lead> {
    const lead = await this.findOne(clinicId, id);
    lead.status = status;
    return await this.leadRepository.save(lead);
  }

  async convertToPatient(clinicId: string, id: string, idNumber: string): Promise<Lead> {
    const lead = await this.findOne(clinicId, id);
    
    if (lead.status === 'converted') {
      return lead;
    }

    // 使用 Transaction 確保 Lead 狀態更新與 Patient 建立同步
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 建立 Patient
      const patient = await this.patientService.createPatient({
        name: lead.name,
        phone: lead.phoneNumber,
        email: lead.email,
        idNumber: idNumber, // 必填欄位由前端傳入
        clinicId: clinicId, // 必填欄位
        medicalNotes: `由線索轉化: ${lead.notes || ''}`,
      }, clinicId);

      // 更新 Lead 狀態
      lead.status = 'converted';
      lead.convertedPatientId = patient.id;
      const savedLead = await queryRunner.manager.save(lead);

      await queryRunner.commitTransaction();
      return savedLead;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
