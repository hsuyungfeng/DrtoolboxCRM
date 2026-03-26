/**
 * 醫令模板實體（Script Template Entity）
 * 儲存診所常用醫令模板，方便醫師快速選擇預設藥物與治療方案
 * 支援啟用/停用狀態管理，確保過期模板不影響正常操作
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * 醫令模板狀態類型
 * - active：啟用中（可供選擇）
 * - inactive：已停用（不顯示於選單）
 */
export type ScriptTemplateStatus = "active" | "inactive";

@Entity("script_templates")
@Index(["clinicId"])
@Index(["clinicId", "status"])
export class ScriptTemplate {
  /** 模板唯一識別碼 */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** 診所識別碼（多租戶隔離） */
  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  /** 模板名稱，例如：「常用感冒藥」、「肌肉拉傷物理治療」 */
  @Column({ type: "varchar", length: 200 })
  name: string;

  /** 模板說明（選填） */
  @Column({ type: "text", nullable: true })
  description: string;

  /** 預設劑量，例如：「500mg x 3」 */
  @Column({ type: "varchar", length: 100 })
  defaultDosage: string;

  /** 預設使用方式，例如：「口服」、「肌肉注射」 */
  @Column({ type: "varchar", length: 100 })
  defaultUsageMethod: string;

  /** 預設療程數（預設使用次數） */
  @Column({ type: "int", default: 1 })
  defaultTotalSessions: number;

  /**
   * 模板狀態
   * - active：啟用中，可供醫師選擇
   * - inactive：已停用，不顯示於選單
   */
  @Column({ type: "varchar", length: 50, default: "active" })
  status: ScriptTemplateStatus;

  /** 創建時間（自動設定） */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新時間（自動更新） */
  @UpdateDateColumn()
  updatedAt: Date;
}
