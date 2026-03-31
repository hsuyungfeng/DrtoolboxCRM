import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  VersionColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RevenueRecord } from "./revenue-record.entity";

@Entity("revenue_adjustments")
export class RevenueAdjustment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  revenueRecordId: string;

  @ManyToOne(() => RevenueRecord)
  @JoinColumn({ name: "revenueRecordId" })
  revenueRecord: RevenueRecord;

  @Column({ type: "decimal", precision: 20, scale: 2 })
  adjustmentAmount: number;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "varchar", length: 32 })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (value: any): string | null => {
        if (!value) return null;
        return JSON.stringify(value);
      },
      from: (value: string | null): any => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
    },
  })
  metadata: any;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    default: "pending",
  })
  reviewStatus: "pending" | "approved" | "rejected";

  @Column({ type: "text", nullable: true })
  reviewNotes: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  reviewedBy: string | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt: Date | null;

  /**
   * 樂觀鎖版本號
   * 用於防止併發更新時的數據覆蓋
   */
  @VersionColumn()
  version: number;
}
