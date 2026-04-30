import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SyncStatus } from '../../common/enums/sync-status.enum';

/**
 * SyncPatientIndex — Doctor Toolbox 患者同步追蹤表
 *
 * 用途：
 * - 追蹤 Doctor Toolbox 患者與 CRM 患者的映射關係
 * - 確保 Webhook 冪等性（同一 webhookId 不重複同步）
 * - 支援患者快速查詢（透過 idNumber + name）
 * - 記錄同步狀態與錯誤訊息，供審計與監控使用
 *
 * 多診所隔離：所有查詢以 clinicId 篩選
 */
@Entity('sync_patient_index')
@Index(['clinicId', 'webhookId'], { unique: true })
@Index(['clinicId', 'idNumber', 'name'])
@Index(['clinicId'])
@Index(['syncStatus'])
export class SyncPatientIndex {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 診所ID — 多診所隔離
   */
  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  /**
   * Webhook ID — 冪等性鑰匙
   * 用於防止相同 Webhook 事件被重複處理
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  webhookId: string;

  /**
   * Doctor Toolbox 患者ID
   * 來自 Webhook payload
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  toolboxPatientId: string;

  /**
   * CRM 患者ID — 外鍵參考 Patient
   */
  @Column({ type: 'varchar', length: 36 })
  crmPatientId: string;

  /**
   * 患者身份證號 — 用於患者查詢與匹配
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  idNumber: string;

  /**
   * 患者姓名 — 用於患者查詢與匹配
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  /**
   * 同步狀態
   * - pending: 待同步
   * - synced: 已同步
   * - conflict: 衝突偵測（CRM 和 Toolbox 資料衝突）
   * - failed: 同步失敗
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: SyncStatus.PENDING,
  })
  syncStatus: SyncStatus;

  /**
   * 錯誤訊息
   * 當 syncStatus = failed 時記錄錯誤原因
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  /**
   * 最後同步時間
   */
  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date;

  /**
   * 建立時間 — 自動生成
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 更新時間 — 自動更新
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
