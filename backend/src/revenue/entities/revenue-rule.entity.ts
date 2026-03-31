import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("revenue_rules")
export class RevenueRule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  role: string; // 角色：doctor, therapist, assistant, consultant

  @Column({ type: "varchar", length: 50 })
  ruleType: string; // percentage, fixed, tiered

  @Column({
    type: "text",
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
  rulePayload: any; // 规则参数，如百分比、金额、阶梯条件

  @Column({ type: "date" })
  effectiveFrom: Date;

  @Column({ type: "date", nullable: true })
  effectiveTo: Date;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;
}
