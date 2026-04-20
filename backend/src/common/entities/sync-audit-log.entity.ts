import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sync_audit_logs')
@Index(['clinicId', 'patientId'])
@Index(['clinicId', 'status', 'timestamp'])
@Index(['clinicId', 'action'])
export class SyncAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  clinicId: string;

  @Column({ nullable: true })
  @Index()
  patientId?: string;

  @Column()
  @Index()
  action: string;

  @Column()
  source: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'simple-json', nullable: true })
  eventData?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
