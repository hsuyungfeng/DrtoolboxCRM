import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { TreatmentStaffAssignment } from "./treatment-staff-assignment.entity";

@Entity("staff")
@Index(["clinicId", "username"])
export class Staff {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  username: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  passwordHash: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 50 })
  role: string; // doctor, therapist, assistant, consultant, admin, nurse, beautician, referrer

  @Column({ type: "varchar", length: 100, nullable: true })
  specialty: string;

  @Column({ type: "varchar", length: 50, default: "active" })
  status: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  baseSalary: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  pointsBalance: number; // 當前點數餘額（作為推薦人時使用）

  @Column({ type: "boolean", default: false })
  canBeReferrer: boolean; // 是否可以作為推薦人

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TreatmentStaffAssignment, (assignment) => assignment.staff)
  assignments: TreatmentStaffAssignment[];
}
