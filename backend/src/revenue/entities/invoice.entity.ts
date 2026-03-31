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
import { Patient } from "../../patients/entities/patient.entity";

/**
 * InvoiceLineItem — 發票費用明細項目
 * 對應單筆付款記錄
 */
export interface InvoiceLineItem {
  /** 對應付款記錄 ID */
  paymentId: string;
  /** 付款金額 */
  amount: number;
  /** 支付方式：現金、銀行轉帳、刷卡 */
  paymentMethod: "cash" | "bank_transfer" | "credit_card";
  /** 付款時間（ISO 8601 格式）*/
  paidAt: string;
  /** 費用說明，例如：「療程費用（現金）」*/
  description: string;
}

/**
 * Invoice — 發票實體（FIN-04）
 *
 * 台灣稅務需求的發票記錄，含費用明細、狀態管理與唯一流水號。
 * 狀態流轉：draft（草稿）→ issued（已開立）→ cancelled（已取消）
 * 防止重複開立：同一 treatmentId 不得有兩張 issued 發票。
 */
@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 唯一發票號碼
   * 格式：INV-{YYYYMM}-{6位序號}，例如 INV-202603-000001
   */
  @Column({ type: "varchar", length: 30, unique: true })
  invoiceNumber: string;

  /** 療程 ID */
  @Column({ type: "varchar", length: 36 })
  treatmentId: string;

  @ManyToOne(() => Treatment)
  @JoinColumn({ name: "treatmentId" })
  treatment?: Treatment;

  /** 患者 ID */
  @Column({ type: "varchar", length: 36 })
  patientId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patientId" })
  patient?: Patient;

  /**
   * 費用明細（JSON 陣列）
   * 格式：[{ paymentId, amount, paymentMethod, paidAt, description }]
   */
  @Column({
    type: "text",
    transformer: {
      to: (value: InvoiceLineItem[] | null): string | null => {
        if (!value) return null;
        return JSON.stringify(value);
      },
      from: (value: string | null): InvoiceLineItem[] | null => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
    },
  })
  lineItems: InvoiceLineItem[];

  /** 發票總金額（已付總額）*/
  @Column({ type: "decimal", precision: 20, scale: 2 })
  totalAmount: number;

  /**
   * 發票狀態
   * - draft：草稿（剛建立）
   * - issued：已開立（正式發票）
   * - cancelled：已取消
   */
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: "draft" | "issued" | "cancelled";

  /** 開立日期時間（issued 時設定）*/
  @Column({ type: "datetime", nullable: true })
  issuedAt: Date | null;

  /** 取消日期時間（cancelled 時設定）*/
  @Column({ type: "datetime", nullable: true })
  cancelledAt: Date | null;

  /** 取消原因（選填）*/
  @Column({ type: "varchar", length: 255, nullable: true })
  cancelReason: string | null;

  /** 診所 ID（多租戶隔離）*/
  @Column({ type: "varchar", length: 36 })
  clinicId: string;

  /** 建立人員 staffId（選填）*/
  @Column({ type: "varchar", length: 36, nullable: true })
  createdBy: string | null;

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
