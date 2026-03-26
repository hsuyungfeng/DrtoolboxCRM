import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Patient } from "../entities/patient.entity";

/**
 * 患者搜尋倉庫
 *
 * 設計重點：
 * - 使用資料庫級別的索引查詢，避免應用層過濾
 * - 支持精確查詢（身份證ID）和模糊搜尋（姓名）
 * - 所有查詢都過濾 clinicId 確保多租戶隔離
 * - 支持分頁以提高大量患者時的性能
 */
@Injectable()
export class PatientSearchRepository extends Repository<Patient> {
  constructor(private readonly dataSource: DataSource) {
    super(Patient, dataSource.createEntityManager());
  }

  /**
   * 按身份證ID和診所查詢患者（精確查詢）
   * 使用複合唯一索引 (clinicId, idNumber) 快速定位
   */
  async findByIdNumberAndClinic(
    idNumber: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { idNumber, clinicId, status: "active" },
      relations: ["treatmentCourses"],
    });
  }

  /**
   * 按身份證ID、姓名和診所查詢（驗證身份）
   * 用於高安全性場景（患者自助查詢）
   */
  async findByIdNumberNameAndClinic(
    idNumber: string,
    name: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { idNumber, name, clinicId, status: "active" },
      relations: ["treatmentCourses"],
    });
  }

  /**
   * 按姓名模糊搜尋（診所內）
   * 使用複合索引 (clinicId, name) 提升效能
   */
  async searchByName(
    name: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder("p")
      .where("p.clinicId = :clinicId", { clinicId })
      .andWhere("p.status = :status", { status: "active" })
      .andWhere("p.name LIKE :name", { name: `%${name}%` })
      .orderBy("p.name", "ASC")
      .limit(limit)
      .getMany();
  }

  /**
   * 按身份證ID模糊搜尋
   * 支持部分匹配，方便前端自動完成
   */
  async queryByIdNumber(
    idNumber: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder("p")
      .where("p.clinicId = :clinicId", { clinicId })
      .andWhere("p.status = :status", { status: "active" })
      .andWhere("p.idNumber LIKE :idNumber", { idNumber: `%${idNumber}%` })
      .orderBy("p.idNumber", "ASC")
      .limit(limit)
      .getMany();
  }

  /**
   * 綜合搜尋（身份證ID 或 姓名）
   * 一個關鍵字同時搜尋兩個欄位
   */
  async searchPatients(
    keyword: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder("p")
      .where("p.clinicId = :clinicId", { clinicId })
      .andWhere("p.status = :status", { status: "active" })
      .andWhere("(p.idNumber LIKE :keyword OR p.name LIKE :keyword)", {
        keyword: `%${keyword}%`,
      })
      .orderBy("p.name", "ASC")
      .limit(limit)
      .getMany();
  }

  /**
   * 取得診所所有患者（分頁）
   * 支持大量患者的高效列表
   */
  async findByClinic(
    clinicId: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<[Patient[], number]> {
    return this.findAndCount({
      where: { clinicId, status: "active" },
      order: { name: "ASC" },
      skip,
      take,
    });
  }

  /**
   * 檢查身份證ID是否已存在（在診所內）
   * 用於建立新患者時的唯一性驗證
   */
  async existsByIdNumber(idNumber: string, clinicId: string): Promise<boolean> {
    const count = await this.count({
      where: { idNumber, clinicId },
    });
    return count > 0;
  }

  /**
   * 取得患者含治療紀錄
   * 一次性載入患者及其完整療程資料
   */
  async getPatientWithTreatments(
    patientId: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { id: patientId, clinicId },
      relations: ["treatmentCourses", "treatmentCourses.sessions"],
    });
  }
}
