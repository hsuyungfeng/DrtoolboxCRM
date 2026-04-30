import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SyncOutboundStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * SyncOutboundLog — CRM -> Doctor Toolbox 出站同步日誌
 * 
 * 用途：
 * - 追蹤從 CRM 發送到 Doctor Toolbox 的同步事件
 * - 記錄同步狀態、重試次數與錯誤訊息
 * - 確保數據同步的可追蹤性與重試機制
 */
@Entity('sync_outbound_log')
@Index(['clinicId', 'entityType', 'entityId'])
@Index(['status'])
export class SyncOutboundLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 診所 ID
   */
  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  /**
   * 實體類型：Patient, Treatment
   */
  @Column({ type: 'varchar', length: 32 })
  entityType: string;

  /**
   * 實體 ID
   */
  @Column({ type: 'varchar', length: 36 })
  entityId: string;

  /**
   * 動作：Create, Update, Delete
   */
  @Column({ type: 'varchar', length: 32 })
  action: string;

  /**
   * 同步 Payload
   */
  @Column({ type: 'simple-json' })
  payload: any;

  /**
   * 同步狀態
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: SyncOutboundStatus.PENDING,
  })
  status: SyncOutboundStatus;

  /**
   * 重試嘗試次數
   */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  /**
   * 最後錯誤訊息
   */
  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  /**
   * 最後嘗試時間
   */
  @Column({ type: 'datetime', nullable: true })
  lastAttemptAt: Date;

  /**
   * 建立時間
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 更新時間
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
