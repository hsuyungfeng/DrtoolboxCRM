import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Patient } from "../entities/patient.entity";
import { CreatePatientDto } from "../dto/create-patient.dto";
import { UpdatePatientDto } from "../dto/update-patient.dto";
import { PatientSearchService } from "./patient-search.service";
import { AttributeService } from "../../common/attributes/services/attribute.service";
import { AttributeTarget } from "../../common/attributes/entities/attribute-definition.entity";

/**
 * 患者業務邏輯服務
 *
 * 設計重點：
 * - createPatient：建立患者前驗證身份證ID唯一性（診所內）
 * - updatePatient：編輯患者時若更換身份證ID則重新驗證唯一性
 * - 多租戶隔離：所有操作都過濾 clinicId
 */
@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly patientSearchService: PatientSearchService,
    private readonly attributeService: AttributeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 建立患者（含身份證ID唯一性驗證）
   * 確保同一診所內身份證ID不重複
   */
  async createPatient(
    dto: CreatePatientDto,
    clinicId: string,
  ): Promise<Patient> {
    // 驗證自定義欄位
    if (dto.customFields) {
      await this.attributeService.validateCustomFields(
        clinicId,
        AttributeTarget.PATIENT,
        dto.customFields,
      );
    }

    // 驗證身份證ID在診所內的唯一性
    const available =
      await this.patientSearchService.validateIdNumberAvailability(
        dto.idNumber,
        clinicId,
      );

    if (!available) {
      throw new BadRequestException(
        `身份證ID「${dto.idNumber}」已存在於本診所，請確認是否重複建檔`,
      );
    }

    const patient = this.patientRepository.create({
      ...dto,
      clinicId, // 強制使用 Guard 提供的 clinicId，忽略請求中的 clinicId
      status: "active",
    });

    const savedPatient = await this.patientRepository.save(patient);

    // 發送事件
    this.emitEvent("patient.created", savedPatient);

    return savedPatient;
  }

  /**
   * 更新患者資料（含身份證ID唯一性驗證）
   * 若更換身份證ID，確保新ID在診所內唯一
   */
  async updatePatient(
    patientId: string,
    dto: UpdatePatientDto,
    clinicId: string,
  ): Promise<Patient> {
    // 查詢患者，確保屬於指定診所
    const patient = await this.patientRepository.findOne({
      where: { id: patientId, clinicId },
    });

    if (!patient) {
      throw new NotFoundException(
        `患者不存在或不屬於本診所（ID: ${patientId}）`,
      );
    }

    // 驗證自定義欄位
    if (dto.customFields) {
      await this.attributeService.validateCustomFields(
        clinicId,
        AttributeTarget.PATIENT,
        dto.customFields,
      );
    }

    // 若更換身份證ID，驗證新ID在診所內的唯一性
    if (dto.idNumber && dto.idNumber !== patient.idNumber) {
      const available =
        await this.patientSearchService.validateIdNumberAvailability(
          dto.idNumber,
          clinicId,
        );

      if (!available) {
        throw new BadRequestException(
          `新身份證ID「${dto.idNumber}」已存在於本診所`,
        );
      }
    }

    // 防止 clinicId 被竄改（多租戶安全）
    const { clinicId: _ignored, ...safeDto } = dto as any;
    void _ignored;

    Object.assign(patient, safeDto);

    const savedPatient = await this.patientRepository.save(patient);

    // 發送事件
    this.emitEvent("patient.updated", savedPatient);

    return savedPatient;
  }

  /**
   * 發送事件助手方法
   */
  private emitEvent(eventName: string, patient: Patient) {
    try {
      this.eventEmitter.emit(eventName, patient);
    } catch (error) {
      this.logger.warn(`Failed to emit ${eventName} event: ${error.message}`);
    }
  }

  // ─── 向後相容的方法（保留原有 API）──────────────────────────────────

  /**
   * @deprecated 請使用 createPatient(dto, clinicId) 以確保多租戶隔離
   */
  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepository.create(createPatientDto);
    const savedPatient = await this.patientRepository.save(patient);
    this.emitEvent("patient.created", savedPatient);
    return savedPatient;
  }

  async findAll(clinicId: string): Promise<Patient[]> {
    return await this.patientRepository.find({
      where: { clinicId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ["treatmentCourses"],
    });

    if (!patient) {
      throw new NotFoundException(`患者不存在（ID: ${id}）`);
    }

    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, updatePatientDto);
    const savedPatient = await this.patientRepository.save(patient);
    this.emitEvent("patient.updated", savedPatient);
    return savedPatient;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    // 軟刪除：標記為 inactive，保留資料可稽核
    patient.status = "inactive";
    await this.patientRepository.save(patient);
    this.emitEvent("patient.deleted", patient);
  }
}

