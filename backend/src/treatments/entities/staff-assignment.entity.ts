import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import Decimal from "decimal.js";
import { TreatmentSession } from "./treatment-session.entity";

@Entity("staff_assignments")
@Index(["sessionId", "staffId"])
export class StaffAssignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 36 })
  sessionId: string;

  @Column({ type: "varchar", length: 36 })
  staffId: string;

  @Column({ type: "varchar", length: 50 })
  staffRole: string;

  @Column({
    type: "decimal",
    precision: 5,
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
  ppfPercentage: Decimal; // 0-100

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
  ppfAmount: Decimal; // 計算後的實際 PPF

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => TreatmentSession, (session) => session.staffAssignments)
  @JoinColumn({ name: "sessionId" })
  session: TreatmentSession;
}
