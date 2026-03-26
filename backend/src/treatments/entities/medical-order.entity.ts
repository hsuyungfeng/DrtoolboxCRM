/**
 * 醫令實體（Medical Order Entity）
 * 用於記錄醫師開立的醫令，支援狀態機管理療程進度
 * 每個醫令與患者及開立醫師關聯，並支援多租戶隔離
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from "typeorm";
import { Patient } from "../../patients/entities/patient.entity";
import { Staff } from "../../staff/entities/staff.entity";

/**
 * 醫令狀態類型
 * - pending：未開始（初始狀態）
 * - in_progress：進行中
 * - completed：已完成
 * - cancelled：已取消
 */
export type MedicalOrderStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

@Entity("medical_orders")
@Index(["clinicId", "patientId"])
@Index(["clinicId", "prescribedBy"])
@Index(["status"])
export class MedicalOrder {
  /** 醫令唯一識別碼 */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** 診所識別碼（多租戶隔離） */
  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  /** 患者識別碼 */
  @Column({ type: "varchar", length: 36 })
  patientId: string;

  /** 開立醫師/醫護人員識別碼 */
  @Column({ type: "varchar", length: 36 })
  prescribedBy: string;

  /** 藥物或治療名稱，例如：「阿莫西林」、「物理治療」 */
  @Column({ type: "varchar", length: 200 })
  drugOrTreatmentName: string;

  /** 詳細說明（選填） */
  @Column({ type: "text", nullable: true })
  description: string;

  /** 劑量說明，例如：「500mg x 3」、「每週 2 次」 */
  @Column({ type: "varchar", length: 100 })
  dosage: string;

  /** 使用方式，例如：「口服」、「肌肉注射」、「每日 2 次」 */
  @Column({ type: "varchar", length: 100 })
  usageMethod: string;

  /** 總療程數（總使用次數或療程數量） */
  @Column({ type: "int", default: 1 })
  totalSessions: number;

  /** 已使用數（已完成的使用次數，用於計算療程進度） */
  @Column({ type: "int", default: 0 })
  completedSessions: number;

  /**
   * 醫令狀態機
   * 狀態流程：pending → in_progress → completed | cancelled
   */
  @Column({
    type: "varchar",
    length: 50,
    default: "pending",
  })
  status: MedicalOrderStatus;

  /** 開始日期（首次使用時記錄） */
  @Column({ type: "datetime", nullable: true })
  startedAt: Date;

  /** 完成/取消日期 */
  @Column({ type: "datetime", nullable: true })
  completedAt: Date;

  /** 創建時間（自動設定） */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新時間（自動更新） */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 關聯患者
   * 使用 eager: false 避免 N+1 查詢問題
   */
  @ManyToOne(() => Patient, { eager: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  /**
   * 關聯開立醫師
   * 使用 eager: false 避免 N+1 查詢問題
   */
  @ManyToOne(() => Staff, { eager: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "prescribedBy" })
  prescriber: Staff;
}
