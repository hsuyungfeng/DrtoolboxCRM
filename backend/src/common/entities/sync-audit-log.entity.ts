import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 同步稽核日誌 Entity
 *
 * 用途：
 * - 記錄所有 Doctor Toolbox 同步事件（不可修改）
 * - 支援按患者、診所、日期範圍查詢
 * - 提供合規性稽核證跡
 *
 * 特性：
 * - 唯讀（僅插入，不刪除或更新）
 * - 複合索引加速查詢
 * - 多診所隔離
 */
@Entity('sync_audit_logs')
@Index(['clinicId', 'timestamp'], { name: 'idx_audit_clinic_timestamp' })
@Index(['patientId', 'timestamp'], { name: 'idx_audit_patient_timestamp' })
@Index(['action', 'timestamp'], { name: 'idx_audit_action_timestamp' })
export class SyncAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clinicId: string;

  @Column({ nullable: true })
  patientId?: string;

  @Column()
  action: string;

  @Column()
  source: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  eventData?: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
