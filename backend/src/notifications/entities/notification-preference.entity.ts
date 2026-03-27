import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_preferences')
@Index(['clinicId', 'patientId'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  smsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  inAppEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnCourseStart: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnSessionComplete: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnCourseComplete: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnAppointmentReminder: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
