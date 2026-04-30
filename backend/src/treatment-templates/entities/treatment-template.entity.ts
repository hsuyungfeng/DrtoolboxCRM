import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("treatment_templates")
@Index(["clinicId", "name"])
export class TreatmentTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  defaultPrice: number;

  @Column({ type: "int", default: 1 })
  defaultSessions: number;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "simple-json", nullable: true })
  customMedicalOrders: Array<{
    code: string;
    nameEn: string;
    nameZh: string;
    points: number;
    paymentType: "self-pay" | "nhi";
  }>;

  @Column({ type: "simple-json", nullable: true })
  customRevenueRules: Array<{
    staffIdOrRole: string;
    ruleType: "percentage" | "fixed";
    value: number;
  }>;

  @Column({ type: "int", nullable: true })
  followUpIntervalDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
