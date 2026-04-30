import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Lead - 潛在客戶實體
 * 用於 Kanban 漏斗追蹤，管理從初次諮詢到轉化為正式病患的流程
 */
@Entity("leads")
@Index(["clinicId", "status"])
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string;

  /** 來源：例如 Facebook, Google, 朋友推薦 */
  @Column({ type: "varchar", length: 50, nullable: true })
  source: string;

  /** 預估價值 */
  @Column({ type: "decimal", precision: 20, scale: 2, default: 0 })
  estimatedValue: number;

  /**
   * 階段狀態
   * - new: 新線索
   * - contacted: 已聯繫
   * - consulted: 已諮詢
   * - converted: 已轉化 (變為正式 Patient)
   * - lost: 已流失
   */
  @Column({
    type: "varchar",
    length: 30,
    default: "new",
  })
  status: "new" | "contacted" | "consulted" | "converted" | "lost";

  @Column({ type: "text", nullable: true })
  notes: string;

  /** 轉化後的 Patient ID (僅在 converted 狀態時有值) */
  @Column({ type: "varchar", length: 36, nullable: true })
  convertedPatientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
