import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Treatment } from "../../treatments/entities/treatment.entity";

/**
 * Payment — 患者付款記錄實體
 * 記錄每筆患者對療程的付款，支援現金、銀行轉帳、刷卡三種方式
 */
@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** 療程 ID */
  @Column({ type: "varchar", length: 36 })
  treatmentId: string;

  @ManyToOne(() => Treatment)
  @JoinColumn({ name: "treatmentId" })
  treatment?: Treatment;

  /** 患者 ID */
  @Column({ type: "varchar", length: 36 })
  patientId: string;

  /** 付款金額（精確到小數點後 2 位）*/
  @Column({ type: "decimal", precision: 20, scale: 2 })
  amount: number;

  /**
   * 支付方式
   * - cash：現金
   * - bank_transfer：銀行轉帳
   * - credit_card：刷卡
   */
  @Column({ type: "varchar", length: 30 })
  paymentMethod: "cash" | "bank_transfer" | "credit_card";

  /**
   * 付款狀態
   * - completed：已完成
   * - refunded：已退款
   * - cancelled：已取消
   */
  @Column({ type: "varchar", length: 50, default: "completed" })
  status: string;

  /** 付款日期時間 */
  @Column({ type: "datetime" })
  paidAt: Date;

  /** 備註（選填）*/
  @Column({ type: "text", nullable: true })
  notes: string | null;

  /** 診所 ID（多租戶隔離）*/
  @Column({ type: "varchar", length: 36 })
  clinicId: string;

  /** 記錄人員 staffId（選填）*/
  @Column({ type: "varchar", length: 36, nullable: true })
  recordedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 樂觀鎖版本號
   * 用於防止併發更新時的數據覆蓋
   */
  @VersionColumn()
  version: number;
}
