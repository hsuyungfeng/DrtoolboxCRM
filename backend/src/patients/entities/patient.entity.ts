import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { TreatmentCourse } from "../../treatments/entities/treatment-course.entity";

/**
 * 患者實體 - 核心資料模型
 *
 * 設計重點：
 * - (clinicId, idNumber) 複合唯一索引：確保診所內身份證ID唯一，支持快速識別
 * - (clinicId, name) 複合索引：支持按診所 + 名字搜尋
 * - 包含聯絡資訊、醫療背景、狀態管理
 * - 多租戶隔離：所有查詢都過濾 clinicId
 */
@Entity("patients")
@Index(["clinicId", "idNumber"], { unique: true }) // 複合唯一索引：診所內身份證ID唯一
@Index(["clinicId", "name"]) // 複合索引：按診所 + 姓名搜尋
@Index(["clinicId"]) // 單一索引：按診所過濾
export class Patient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  // 基本身份識別
  @Column({ type: "varchar", length: 50 })
  idNumber: string; // 身份證號碼／護照號／員工ID（取決於地區）

  @Column({ type: "varchar", length: 100 })
  name: string; // 患者姓名

  @Column({ type: "varchar", length: 50, nullable: true })
  gender: string; // 性別：male | female | other

  @Column({ type: "date", nullable: true })
  dateOfBirth: Date; // 出生日期

  // 聯絡資訊
  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber: string; // 電話號碼

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string; // 信箱

  @Column({ type: "varchar", length: 200, nullable: true })
  address: string; // 住址

  // 緊急聯絡人
  @Column({ type: "varchar", length: 100, nullable: true })
  emergencyContact: string; // 緊急聯絡人姓名

  @Column({ type: "varchar", length: 30, nullable: true })
  emergencyPhone: string; // 緊急聯絡人電話

  // 醫療背景
  @Column({ type: "text", nullable: true })
  medicalHistory: string; // 病史（多行文本）

  @Column({ type: "text", nullable: true })
  allergies: string; // 過敏史（多行文本）

  @Column({ type: "text", nullable: true })
  currentMedications: string; // 目前用藥

  @Column({ type: "text", nullable: true })
  notes: string; // 醫護備註

  // 指派醫師
  @Column({ type: "varchar", length: 32, nullable: true })
  assignedDoctorId: string;

  // 推薦來源
  @Column({ type: "varchar", length: 32, nullable: true })
  referredBy: string; // 推薦人 ID（可以是 Staff 或另一個 Patient）

  @Column({ type: "varchar", length: 10, nullable: true })
  referrerType: string; // 推薦人類型：'staff' | 'patient'

  // 點數餘額
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  pointsBalance: number; // 當前點數餘額

  // 狀態管理
  @Column({ type: "varchar", length: 50, default: "active" })
  status: string; // active | inactive | blocked

  // 時間戳
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關係
  @OneToMany(() => TreatmentCourse, (course) => course.patient, { eager: false })
  treatmentCourses: TreatmentCourse[];
}
