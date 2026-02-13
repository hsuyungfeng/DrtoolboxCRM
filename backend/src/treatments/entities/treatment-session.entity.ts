import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import Decimal from "decimal.js";
import { Treatment } from "./treatment.entity";
import { TreatmentCourse } from "./treatment-course.entity";

@Entity("treatment_sessions")
@Index(['treatmentCourseId', 'sessionNumber'])
@Index(['clinicId', 'completionStatus'])
@Index(['clinicId', 'scheduledDate'])
export class TreatmentSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  treatmentId: string;

  @ManyToOne(() => Treatment, (treatment) => treatment.sessions)
  @JoinColumn({ name: "treatmentId" })
  treatment: Treatment;

  @Column({ type: "varchar", length: 32, nullable: true })
  treatmentCourseId: string;

  @ManyToOne(() => TreatmentCourse, (course) => course.sessions)
  @JoinColumn({ name: "treatmentCourseId" })
  treatmentCourse: TreatmentCourse;

  @Column({ type: "int", nullable: true })
  sessionIndex: number;

  @Column({ type: "int", nullable: true })
  sessionNumber: number; // 1-10 for TreatmentCourse sessions

  @Column({ type: "date", nullable: true })
  scheduledDate: Date;

  @Column({ type: "datetime", nullable: true })
  scheduledTime: Date;

  @Column({ type: "datetime", nullable: true })
  actualTime: Date;

  @Column({ type: "varchar", length: 50, default: "scheduled" })
  status: string; // scheduled, in_progress, completed, cancelled

  @Column({ type: "varchar", length: 50, nullable: true })
  completionStatus: 'pending' | 'completed' | 'cancelled'; // For TreatmentCourse sessions

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "text", nullable: true })
  observations: string;

  @Column({ type: "text", nullable: true })
  therapistNotes: string; // 治療師備註

  @Column({ type: "text", nullable: true })
  patientFeedback: string; // 患者反饋

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  durationMinutes: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: Decimal | number | null): string | null => {
        if (value === null || value === undefined) return null;
        return value instanceof Decimal ? value.toString() : String(value);
      },
      from: (value: string | null): Decimal | null => {
        if (value === null || value === undefined) return null;
        return new Decimal(value);
      },
    },
  })
  sessionPrice: Decimal; // 療程單次價格

  @Column({ type: "boolean", default: false })
  revenueCalculated: boolean;

  @Column({ type: "timestamp", nullable: true })
  actualStartTime: Date; // 實際開始時間

  @Column({ type: "timestamp", nullable: true })
  actualEndTime: Date; // 實際結束時間

  @Column({ type: "varchar", length: 32, nullable: true })
  executedBy: string; // 執行人員 ID

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
