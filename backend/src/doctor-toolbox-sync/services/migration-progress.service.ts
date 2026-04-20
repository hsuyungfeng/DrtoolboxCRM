import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MigrationProgress } from '../entities/migration-progress.entity';

/**
 * MigrationProgressService — 遷移進度追蹤
 *
 * 用途：
 * - 記錄批量匯入進度
 * - 支援暫停與恢復
 * - 計算進度百分比和 ETA
 *
 * 多診所隔離：所有查詢以 clinicId 篩選
 */
@Injectable()
export class MigrationProgressService {
  private readonly logger = new Logger(MigrationProgressService.name);

  constructor(
    @InjectRepository(MigrationProgress)
    private readonly progressRepository: Repository<MigrationProgress>,
  ) {}

  /**
   * 開始新遷移進度追蹤
   *
   * @param clinicId 診所ID
   * @param totalPatients 從 Toolbox 取得的總患者數
   * @returns 新建的 MigrationProgress 記錄
   */
  async startProgress(
    clinicId: string,
    totalPatients: number,
  ): Promise<MigrationProgress> {
    const existing = await this.getProgress(clinicId);
    if (existing && existing.status === 'in-progress') {
      throw new ConflictException(`診所 ${clinicId} 已有進行中的遷移`);
    }
    if (existing) {
      await this.progressRepository.delete({ clinicId });
    }

    const progress = this.progressRepository.create({
      clinicId,
      totalPatients,
      processedPatients: 0,
      failedCount: 0,
      status: 'in-progress',
      startedAt: new Date(),
    });

    const saved = await this.progressRepository.save(progress);
    this.logger.log(
      `開始遷移：clinicId=${clinicId}, totalPatients=${totalPatients}`,
    );
    return saved;
  }

  /**
   * 更新進度
   *
   * @param clinicId 診所ID
   * @param processedCount 新處理的患者數
   * @param failedCount 新失敗的患者數（可選，累加）
   * @param lastBatchId 最後處理的批次ID
   * @returns 更新後的 MigrationProgress
   */
  async updateProgress(
    clinicId: string,
    processedCount: number,
    failedCount: number = 0,
    lastBatchId?: string,
  ): Promise<MigrationProgress> {
    const progress = await this.getProgress(clinicId);
    if (!progress) {
      throw new Error(`Migration progress not found for clinicId: ${clinicId}`);
    }

    progress.processedPatients = processedCount;
    progress.failedCount += failedCount;
    if (lastBatchId) {
      progress.lastBatchId = lastBatchId;
    }

    const updated = await this.progressRepository.save(progress);

    const percentage = updated.getProgressPercentage();
    this.logger.debug(
      `進度更新：clinicId=${clinicId}, %=${percentage}, processed=${processedCount}/${progress.totalPatients}`,
    );

    return updated;
  }

  /**
   * 標記遷移完成
   *
   * @param clinicId 診所ID
   * @returns 更新後的 MigrationProgress
   */
  async markComplete(clinicId: string): Promise<MigrationProgress> {
    const progress = await this.getProgress(clinicId);
    if (!progress) {
      throw new Error(`Migration progress not found for clinicId: ${clinicId}`);
    }

    progress.status = 'completed';
    progress.completedAt = new Date();

    const updated = await this.progressRepository.save(progress);
    this.logger.log(
      `遷移完成：clinicId=${clinicId}, 總耗時=${(updated.completedAt.getTime() - updated.startedAt.getTime()) / 1000}秒`,
    );

    return updated;
  }

  /**
   * 標記遷移失敗
   *
   * @param clinicId 診所ID
   * @param errorMessage 失敗原因
   * @returns 更新後的 MigrationProgress
   */
  async markFailed(clinicId: string): Promise<MigrationProgress> {
    const progress = await this.getProgress(clinicId);
    if (!progress) {
      throw new Error(`Migration progress not found for clinicId: ${clinicId}`);
    }

    progress.status = 'failed';
    progress.completedAt = new Date();

    const updated = await this.progressRepository.save(progress);
    this.logger.error(
      `遷移失敗：clinicId=${clinicId}, 已處理=${updated.processedPatients}/${updated.totalPatients}`,
    );

    return updated;
  }

  /**
   * 取得遷移進度
   *
   * @param clinicId 診所ID
   * @returns MigrationProgress 或 null
   */
  async getProgress(clinicId: string): Promise<MigrationProgress | null> {
    return this.progressRepository.findOne({
      where: { clinicId },
    });
  }

  /**
   * 取得進度百分比
   *
   * @param clinicId 診所ID
   * @returns 進度百分比（0-100）
   */
  async getProgressPercentage(clinicId: string): Promise<number> {
    const progress = await this.getProgress(clinicId);
    return progress ? progress.getProgressPercentage() : 0;
  }

  /**
   * 取得預計剩餘時間（秒）
   *
   * @param clinicId 診所ID
   * @returns 預計剩餘秒數
   */
  async getEstimatedTimeRemaining(clinicId: string): Promise<number> {
    const progress = await this.getProgress(clinicId);
    return progress ? progress.getEstimatedTimeRemaining() : 0;
  }
}
