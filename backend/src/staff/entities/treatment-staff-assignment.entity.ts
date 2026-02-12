import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { Staff } from "./staff.entity";

@Entity("treatment_staff_assignments")
@Unique(["treatmentId", "staffId", "role"]) // 同一治疗中同一员工不能有重复角色
export class TreatmentStaffAssignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  treatmentId: string;

  @ManyToOne(() => Treatment, (treatment) => treatment.staffAssignments)
  @JoinColumn({ name: "treatmentId" })
  treatment: Treatment;

  @Column({ type: "varchar", length: 32 })
  staffId: string;

  @ManyToOne(() => Staff, (staff) => staff.assignments)
  @JoinColumn({ name: "staffId" })
  staff: Staff;

  @Column({ type: "varchar", length: 50 })
  role: string; // primary, assistant, consultant, etc.

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  revenuePercentage: number; // 该角色在治疗中的分润比例

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}
