import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_records')
@Index(['clinicId', 'patientId'])
@Index(['clinicId', 'isRead'])
export class NotificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  @Column({ type: 'varchar', length: 20 })
  channel: 'email' | 'sms' | 'in_app';

  @Column({ type: 'varchar', length: 30 })
  eventType: 'course_started' | 'session_completed' | 'course_completed' | 'appointment_reminder';

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  relatedEntityId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;
}
