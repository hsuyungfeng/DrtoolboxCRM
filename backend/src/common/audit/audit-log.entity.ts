import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOCK = 'lock',
  UNLOCK = 'unlock',
}

@Entity('audit_logs')
@Index(['clinicId', 'createdAt'])
@Index(['userId', 'action'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  userId: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  userName: string | null;

  @Column({
    type: 'varchar',
    length: 20,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  entityId: string | null;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 36 })
  clinicId: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
