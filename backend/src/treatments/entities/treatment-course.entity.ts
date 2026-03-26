import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import Decimal from "decimal.js";
import { Patient } from "../../patients/entities/patient.entity";
import { TreatmentSession } from "./treatment-session.entity";

@Entity("treatment_courses")
@Index(["clinicId", "patientId"])
@Index(["clinicId", "status"])
export class TreatmentCourse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  patientId: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  templateId: string;

  /**
   * 療程名稱
   * Treatment course name
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  /**
   * 療程類型（如：物理治療、針灸等）
   * Treatment type
   */
  @Column({ type: "varchar", length: 100, nullable: true })
  type: string;

  /**
   * 療程描述
   * Treatment course description
   */
  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * 每次課程費用
   * Cost per session
   */
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
  costPerSession: Decimal | number;

  @Column({ type: "varchar", length: 50, default: "active" })
  status: "active" | "completed" | "abandoned" = "active";

  @Column({ type: "date" })
  purchaseDate: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
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
  purchaseAmount: Decimal;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
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
  pointsRedeemed: Decimal;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
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
  actualPayment: Decimal;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "datetime", nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => Patient, { eager: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  @OneToMany(() => TreatmentSession, (session) => session.treatmentCourse)
  sessions: TreatmentSession[];
}
