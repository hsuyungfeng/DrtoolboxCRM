import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Treatment } from "../../treatments/entities/treatment.entity";

@Entity("patients")
export class Patient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 20, nullable: true, unique: true })
  idNumber: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone: string;

  @Column({ type: "date", nullable: true })
  dateOfBirth: Date;

  @Column({ type: "varchar", length: 10, nullable: true })
  gender: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  medicalNotes: string;

  @Column({ type: "text", nullable: true })
  allergies: string;

  @Column({ type: "text", nullable: true })
  currentMedications: string;

  @Column({ type: "varchar", length: 50, default: "active" })
  status: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  emergencyContact: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  emergencyPhone: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  assignedDoctorId: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  referredBy: string; // 推薦人 ID (可以是 Staff 或另一個 Patient)

  @Column({ type: "varchar", length: 10, nullable: true })
  referrerType: string; // 推薦人類型 ('staff' | 'patient')

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  pointsBalance: number; // 當前點數餘額

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Treatment, (treatment) => treatment.patient)
  treatments: Treatment[];
}
