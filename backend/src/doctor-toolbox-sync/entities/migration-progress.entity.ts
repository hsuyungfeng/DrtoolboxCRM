import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Migration Progress 實體 — 追蹤診所初始遷移進度
 *
 * 用途：
 * - 記錄從 Doctor Toolbox 批量匯入患者的進度
 * - 支援暫停與恢復（failover recovery）
 * - 提供進度百分比和 ETA 計算
 *
 * 多診所隔離：所有查詢以 clinicId 篩選
 */
@Entity('migration_progress')
@Index(['clinicId'], { unique: true })
export class MigrationProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 診所ID — 多診所隔離
   */
  @Column({ type: 'varchar', length: 32, unique: true })
  clinicId: string;

  /**
   * Doctor Toolbox 患者總數
   */
  @Column({ type: 'int', default: 0 })
  totalPatients: number;

  /**
   * 已處理的患者數
   */
  @Column({ type: 'int', default: 0 })
  processedPatients: number;

  /**
   * 失敗數量
   */
  @Column({ type: 'int', default: 0 })
  failedCount: number;

  /**
   * 最後處理的批次ID — 用於恢復遷移
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastBatchId: string;

  /**
   * 遷移狀態
   * - pending: 尚未開始
   * - in-progress: 正在進行
   * - completed: 已完成
   * - failed: 失敗
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'pending' | 'in-progress' | 'completed' | 'failed';

  /**
   * 遷移開始時間
   */
  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  /**
   * 遷移完成時間
   */
  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

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

  /**
   * 計算進度百分比
   */
  getProgressPercentage(): number {
    if (this.totalPatients === 0) return 0;
    return Math.round((this.processedPatients / this.totalPatients) * 100);
  }

  /**
   * 計算預計剩餘時間（秒）
   * 假設每患者平均 0.5 秒處理時間
   */
  getEstimatedTimeRemaining(): number {
    if (this.processedPatients === 0) return 0;
    const processingStartTime = this.startedAt?.getTime() || Date.now();
    const elapsedSeconds = (Date.now() - processingStartTime) / 1000;
    const secondsPerPatient = elapsedSeconds / this.processedPatients;
    const remainingPatients = this.totalPatients - this.processedPatients;
    return Math.ceil(remainingPatients * secondsPerPatient);
  }
}
