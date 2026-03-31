import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import Decimal from "decimal.js";

interface StageConfig {
  stageName: string;
  sessionStart: number;
  sessionEnd: number;
}

@Entity("treatment_course_templates")
@Index(["clinicId", "isActive"])
export class TreatmentCourseTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "int" })
  totalSessions: number;

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
  totalPrice: Decimal;

  @Column({
    type: "text",
    transformer: {
      to: (value: StageConfig[] | null): string | null => {
        if (!value) return null;
        return JSON.stringify(value);
      },
      from: (value: string | null): StageConfig[] | null => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
    },
  })
  stageConfig: StageConfig[];

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean = true;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
