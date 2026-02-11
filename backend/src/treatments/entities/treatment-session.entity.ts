import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Treatment } from "./treatment.entity";

@Entity("treatment_sessions")
export class TreatmentSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  treatmentId: string;

  @ManyToOne(() => Treatment, (treatment) => treatment.sessions)
  @JoinColumn({ name: "treatmentId" })
  treatment: Treatment;

  @Column({ type: "int" })
  sessionIndex: number;

  @Column({ type: "datetime", nullable: true })
  scheduledTime: Date;

  @Column({ type: "datetime", nullable: true })
  actualTime: Date;

  @Column({ type: "varchar", length: 50, default: "scheduled" })
  status: string; // scheduled, in_progress, completed, cancelled

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "text", nullable: true })
  observations: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  durationMinutes: number;

  @Column({ type: "boolean", default: false })
  revenueCalculated: boolean;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
