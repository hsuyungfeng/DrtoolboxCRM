import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BulkExportService } from '../services/bulk-export.service';
import { MigrationProgressService } from '../services/migration-progress.service';
import { MigrationProgress } from '../entities/migration-progress.entity';

/**
 * MigrationController — 初始診所遷移端點
 *
 * 端點：
 * - POST /migrate/:clinicId — 開始新遷移
 * - POST /migrate/:clinicId/resume — 恢復中斷的遷移
 * - GET /migrate/:clinicId/progress — 查詢進度
 * - DELETE /migrate/:clinicId — 中止遷移
 *
 * 認證：JwtAuthGuard（所有端點）
 */
@Controller('migrate')
@UseGuards(JwtAuthGuard)
export class MigrationController {
  constructor(
    private readonly bulkExportService: BulkExportService,
    private readonly migrationProgressService: MigrationProgressService,
  ) {}

  /**
   * 開始新的診所遷移
   *
   * POST /migrate/clinic-1
   *
   * @param clinicId 診所ID
   * @returns 遷移進度
   */
  @Post(':clinicId')
  @HttpCode(HttpStatus.OK)
  async startMigration(
    @Param('clinicId') clinicId: string,
    @Req() req: any,
  ): Promise<MigrationProgressDto> {
    if (req.user.clinicId !== clinicId) {
      throw new ForbiddenException('無法存取其他診所的遷移資料');
    }
    const progress = await this.bulkExportService.startMigration(clinicId);
    return this.toDto(progress);
  }

  /**
   * 恢復中斷的遷移
   *
   * POST /migrate/clinic-1/resume
   *
   * @param clinicId 診所ID
   * @returns 遷移進度
   */
  @Post(':clinicId/resume')
  @HttpCode(HttpStatus.OK)
  async resumeMigration(
    @Param('clinicId') clinicId: string,
    @Req() req: any,
  ): Promise<MigrationProgressDto> {
    if (req.user.clinicId !== clinicId) {
      throw new ForbiddenException('無法存取其他診所的遷移資料');
    }
    const progress = await this.bulkExportService.resumeMigration(clinicId);
    return this.toDto(progress);
  }

  /**
   * 查詢遷移進度
   *
   * GET /migrate/clinic-1/progress
   *
   * @param clinicId 診所ID
   * @returns 遷移進度
   */
  @Get(':clinicId/progress')
  @HttpCode(HttpStatus.OK)
  async getProgress(
    @Param('clinicId') clinicId: string,
    @Req() req: any,
  ): Promise<MigrationProgressDto | null> {
    if (req.user.clinicId !== clinicId) {
      throw new ForbiddenException('無法存取其他診所的遷移資料');
    }
    const progress = await this.migrationProgressService.getProgress(clinicId);
    return progress ? this.toDto(progress) : null;
  }

  /**
   * 中止遷移
   *
   * DELETE /migrate/clinic-1
   *
   * @param clinicId 診所ID
   */
  @Delete(':clinicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async abortMigration(
    @Param('clinicId') clinicId: string,
    @Req() req: any,
  ): Promise<void> {
    if (req.user.clinicId !== clinicId) {
      throw new ForbiddenException('無法存取其他診所的遷移資料');
    }
    await this.bulkExportService.abortMigration(clinicId);
  }

  /**
   * 轉換為 DTO
   */
  private toDto(progress: MigrationProgress): MigrationProgressDto {
    return {
      clinicId: progress.clinicId,
      totalPatients: progress.totalPatients,
      processedPatients: progress.processedPatients,
      failedCount: progress.failedCount,
      status: progress.status,
      percentage: progress.getProgressPercentage(),
      estimatedSecondsRemaining: progress.getEstimatedTimeRemaining(),
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
    };
  }
}

/**
 * 遷移進度 DTO
 */
export class MigrationProgressDto {
  clinicId: string;
  totalPatients: number;
  processedPatients: number;
  failedCount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  percentage: number;
  estimatedSecondsRemaining: number;
  startedAt?: Date;
  completedAt?: Date;
}
