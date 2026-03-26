import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PatientSearchRepository } from "../repositories/patient-search.repository";
import { Patient } from "../entities/patient.entity";

/**
 * 患者搜尋服務 - 業務邏輯層
 *
 * 設計重點：
 * - identifyPatientByIdNumber：主要識別方式，使用複合唯一索引
 * - identifyPatientByIdAndName：雙重驗證，提高安全性
 * - searchPatients：關鍵字搜尋，用於 UI 自動完成
 * - validateIdNumberAvailability：建立患者時驗證身份證ID唯一性
 * - getPublicPatientInfo：返回公開資訊，隱藏敏感欄位
 */
@Injectable()
export class PatientSearchService {
  constructor(private readonly patientRepository: PatientSearchRepository) {}

  /**
   * 按身份證ID標識患者（主要識別方式）
   * 使用複合唯一索引 (clinicId, idNumber) 快速查詢
   */
  async identifyPatientByIdNumber(
    idNumber: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findByIdNumberAndClinic(
      idNumber,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException(
        `身份證ID ${idNumber} 在診所 ${clinicId} 中不存在`,
      );
    }

    return patient;
  }

  /**
   * 雙重驗證：身份證ID + 姓名
   * 用於高安全性場景（患者自助查詢）
   */
  async identifyPatientByIdAndName(
    idNumber: string,
    name: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findByIdNumberNameAndClinic(
      idNumber,
      name,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException("身份證ID 或 姓名不匹配");
    }

    return patient;
  }

  /**
   * 搜尋患者（可用於自動完成或患者列表）
   * 同時搜尋身份證ID 和 姓名
   */
  async searchPatients(
    keyword: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException("搜尋關鍵字不能為空");
    }

    if (keyword.length > 100) {
      throw new BadRequestException("搜尋關鍵字過長");
    }

    return this.patientRepository.searchPatients(
      keyword.trim(),
      clinicId,
      limit,
    );
  }

  /**
   * 取得診所患者列表（含分頁）
   * 支持大量患者的高效分頁查詢
   */
  async getClinicPatients(
    clinicId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: Patient[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const skip = (page - 1) * pageSize;
    const [patients, total] = await this.patientRepository.findByClinic(
      clinicId,
      skip,
      pageSize,
    );

    return {
      data: patients,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 驗證身份證ID是否可用（建立新患者時）
   * 返回 true 表示可用（尚未被使用）
   */
  async validateIdNumberAvailability(
    idNumber: string,
    clinicId: string,
  ): Promise<boolean> {
    const exists = await this.patientRepository.existsByIdNumber(
      idNumber,
      clinicId,
    );
    return !exists; // 返回 true 表示可用
  }

  /**
   * 取得患者含治療紀錄
   * 載入完整患者資料及療程關聯
   */
  async getPatientProfile(
    patientId: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.getPatientWithTreatments(
      patientId,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException("患者不存在");
    }

    return patient;
  }

  /**
   * 取得患者基本資訊（隱藏敏感欄位）
   * 用於公開 API 或低權限場景
   */
  getPublicPatientInfo(patient: Patient): Partial<Patient> {
    return {
      id: patient.id,
      name: patient.name,
      idNumber: patient.idNumber,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      status: patient.status,
    };
  }

  /**
   * 按身份證ID查詢患者（用於重複檢查，含停用患者）
   * 搜尋所有狀態的患者
   */
  async findByIdNumberAndName(
    idNumber: string,
    name: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.patientRepository.findByIdNumberNameAndClinic(
      idNumber,
      name,
      clinicId,
    );
  }
}
