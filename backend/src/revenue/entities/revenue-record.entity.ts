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
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { Staff } from "../../staff/entities/staff.entity";

@Entity("revenue_records")
export class RevenueRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  treatmentId: string;

  @ManyToOne(() => Treatment)
  @JoinColumn({ name: "treatmentId" })
  treatment?: Treatment;

  @Column({ type: "varchar", length: 32, nullable: true })
  treatmentSessionId: string | null;

  @ManyToOne(() => TreatmentSession, { nullable: true })
  @JoinColumn({ name: "treatmentSessionId" })
  treatmentSession?: TreatmentSession | null;

  @Column({ type: "varchar", length: 32 })
  staffId: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: "staffId" })
  staff?: Staff;

  @Column({ type: "varchar", length: 50 })
  role: string;

  @Column({ type: "decimal", precision: 20, scale: 2 })
  amount: number;

  @Column({ type: "varchar", length: 50 })
  calculationType: string; // treatment, session

  @Column({ type: "varchar", length: 50 })
  status: string; // pending, calculated, locked, adjusted

  @CreateDateColumn()
  calculatedAt: Date;

  @Column({ type: "datetime", nullable: true })
  lockedAt: Date | null; // 财务锁定时间，锁定后不可修改

  @Column({ type: "datetime", nullable: true })
  paidAt: Date | null;

  @Column({ type: "json", nullable: true })
  calculationDetails: Record<string, unknown> | null; // 计算明细

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  ruleId: string | null;

  /**
   * 樂觀鎖版本號
   * 用於防止併發更新時的數據覆蓋
   */
  @VersionColumn()
  version: number;
}
