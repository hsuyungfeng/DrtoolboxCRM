import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * ReconciliationReport - 每日財務對帳報告實體
 */
@Entity("reconciliation_reports")
@Index(["clinicId", "reportDate"])
export class ReconciliationReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  /** 對帳日期 (YYYY-MM-DD) */
  @Column({ type: "date" })
  reportDate: string;

  /** CRM 內部的收款總額 */
  @Column({ type: "decimal", precision: 20, scale: 2 })
  crmTotalAmount: number;

  /** Doctor Toolbox 回傳的外部總額 */
  @Column({ type: "decimal", precision: 20, scale: 2 })
  externalTotalAmount: number;

  /** 差異金額 (crmTotalAmount - externalTotalAmount) */
  @Column({ type: "decimal", precision: 20, scale: 2 })
  discrepancyAmount: number;

  /**
   * 對帳狀態
   * - matched: 完全吻合
   * - discrepancy: 存在差異
   * - failed: 對帳失敗 (例如 API 連線問題)
   */
  @Column({ type: "varchar", length: 20 })
  status: "matched" | "discrepancy" | "failed";

  /** 詳細資訊或錯誤訊息 (JSONB) */
  @Column({ type: "simple-json", nullable: true })
  details: any;

  @CreateDateColumn()
  createdAt: Date;
}
