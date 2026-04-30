import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Patient } from "../../patients/entities/patient.entity";
import { TreatmentSession } from "./treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";

@Entity("treatments")
export class Treatment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  patientId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  treatmentTemplateId: string;

  @Column({ type: "decimal", precision: 20, scale: 2 })
  totalPrice: number;

  @Column({ type: "int" })
  totalSessions: number;

  @Column({ type: "int", default: 0 })
  completedSessions: number;

  @Column({ type: "varchar", length: 50, default: "pending" })
  status: string; // pending, in_progress, completed, cancelled

  @Column({ type: "date", nullable: true })
  startDate: Date;

  @Column({ type: "date", nullable: true })
  expectedEndDate: Date;

  @Column({ type: "date", nullable: true })
  actualEndDate: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  pointsRedeemed: number; // 使用的點數抵扣金額

  @Column({ type: "decimal", precision: 20, scale: 2, nullable: true })
  finalPrice: number; // 最終價格 (totalPrice - pointsRedeemed)

  @Column({ type: 'simple-json', nullable: true })
  @Index({ fulltext: true })
  customFields?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TreatmentSession, (session) => session.treatment)
  sessions: TreatmentSession[];

  @OneToMany(
    () => TreatmentStaffAssignment,
    (assignment) => assignment.treatment,
  )
  staffAssignments: TreatmentStaffAssignment[];

  /**
   * 樂觀鎖版本號
   * 用於防止併發更新時的數據覆蓋
   */
  @VersionColumn()
  version: number;
}
