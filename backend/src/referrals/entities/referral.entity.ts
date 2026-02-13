import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { Patient } from "../../patients/entities/patient.entity";

/**
 * Referral Entity - 推薦記錄
 * 記錄員工或患者推薦的新患者
 * 當被推薦患者完成首次療程時，推薦人獲得點數獎勵
 */
@Entity("referrals")
@Index("idx_referrer_clinic", ["referrerId", "referrerType", "clinicId"])
@Index("idx_patient_clinic", ["patientId", "clinicId"])
@Index("idx_clinic_status", ["clinicId", "status"])
@Index("idx_status_created", ["status", "createdAt"])
@Unique("uq_referral_per_patient_pending", ["patientId", "clinicId"])
export class Referral {
  /**
   * 主鍵：推薦記錄 ID (UUID)
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 推薦人 ID (Staff 或 Patient 的 ID)
   */
  @Column({ type: "varchar", length: 32 })
  referrerId: string;

  /**
   * 推薦人類型：'staff' | 'patient'
   */
  @Column({ type: "varchar", length: 20 })
  referrerType: string;

  /**
   * 被推薦的患者 ID
   */
  @Column({ type: "varchar", length: 32 })
  patientId: string;

  /**
   * 被推薦患者的關聯
   */
  @ManyToOne(() => Patient, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  /**
   * 推薦日期
   */
  @Column({ type: "datetime" })
  referralDate: Date;

  /**
   * 推薦狀態：pending | converted | cancelled
   * - pending: 等待患者完成首次療程
   * - converted: 患者已完成首次療程，推薦人已獲得點數
   * - cancelled: 推薦已取消
   */
  @Column({ type: "varchar", length: 50, default: "pending" })
  status: string;

  /**
   * 首次療程 ID (當狀態為 converted 時設置)
   */
  @Column({ type: "varchar", length: 32, nullable: true })
  firstTreatmentId: string;

  /**
   * 首次療程日期 (當狀態為 converted 時設置)
   */
  @Column({ type: "datetime", nullable: true })
  firstTreatmentDate: Date;

  /**
   * 已獎勵的點數金額
   */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  pointsAwarded: number;

  /**
   * 所屬診所 ID
   */
  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  /**
   * 推薦備註
   */
  @Column({ type: "text", nullable: true })
  notes: string;

  /**
   * 記錄創建時間
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 記錄最後更新時間
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
