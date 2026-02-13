import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import Decimal from 'decimal.js';
import { Patient } from '../../patients/entities/patient.entity';
import { TreatmentSession } from './treatment-session.entity';

@Entity('treatment_courses')
@Index(['patientId', 'clinicId'])
@Index(['clinicId', 'status'])
export class TreatmentCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  @Column({ type: 'varchar', length: 32 })
  templateId: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'completed' | 'abandoned' = 'active';

  @Column({ type: 'date' })
  purchaseDate: Date;

  @Column({
    type: 'decimal',
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
    type: 'decimal',
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
    type: 'decimal',
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

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => Patient, { eager: false })
  patient: Patient;

  @OneToMany(() => TreatmentSession, (session) => session.treatmentCourse)
  sessions: TreatmentSession[];
}
