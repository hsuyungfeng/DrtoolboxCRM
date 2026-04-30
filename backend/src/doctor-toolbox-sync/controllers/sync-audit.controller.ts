import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SyncAuditService } from '../services/sync-audit.service';
import { SyncMonitoringService } from '../services/sync-monitoring.service';
import { SyncAuditLog } from '../../common/entities/sync-audit-log.entity';

/**
 * 同步稽核控制器
 *
 * 端點：
 * - GET /sync/audit/logs/:patientId — 患者同步日誌
 * - GET /sync/audit/clinic — 診所同步日誌
 * - GET /sync/audit/stats — 診所統計與失敗警告
 * - GET /sync/audit/retry-patterns — 重試成功率分析
 *
 * 認證：JwtAuthGuard（所有端點）
 * 多租戶隔離：clinicId 從 JWT 解析（req.user.clinicId）
 */
@ApiBearerAuth()
@ApiTags('Sync Audit')
@Controller('sync/audit')
@UseGuards(JwtAuthGuard)
export class SyncAuditController {
  constructor(
    private readonly auditService: SyncAuditService,
    private readonly monitoringService: SyncMonitoringService,
  ) {}

  /**
   * 查詢患者同步日誌
   *
   * GET /sync/audit/logs/:patientId
   *
   * @param patientId 患者 ID
   * @param limit 回傳筆數（預設 100）
   * @returns 患者同步事件列表
   */
  @Get('logs/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查詢患者同步日誌' })
  @ApiQuery({ name: 'limit', required: false, description: '回傳筆數（預設 100）' })
  async getPatientLogs(
    @Param('patientId') patientId: string,
    @Req() req: any,
    @Query('limit') limit: number = 100,
  ): Promise<{
    statusCode: number;
    data: SyncAuditLog[];
    count: number;
  }> {
    const logs = await this.auditService.queryByPatient(
      req.user.clinicId,
      patientId,
      Number(limit),
    );

    return {
      statusCode: 200,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * 查詢診所同步日誌
   *
   * GET /sync/audit/clinic
   *
   * @param limit 回傳筆數（預設 1000）
   * @param startDate 開始日期（ISO 格式）
   * @param endDate 結束日期（ISO 格式）
   * @returns 診所同步事件列表
   */
  @Get('clinic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查詢診所同步日誌' })
  @ApiQuery({ name: 'limit', required: false, description: '回傳筆數（預設 1000）' })
  @ApiQuery({ name: 'startDate', required: false, description: '開始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '結束日期' })
  async getClinicLogs(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 1000,
  ): Promise<{
    statusCode: number;
    data: SyncAuditLog[];
    count: number;
  }> {
    let logs: SyncAuditLog[];

    if (startDate && endDate) {
      logs = await this.auditService.queryByDateRange(
        req.user.clinicId,
        new Date(startDate),
        new Date(endDate),
      );
    } else {
      logs = await this.auditService.queryByClinic(
        req.user.clinicId,
        Number(limit),
      );
    }

    return {
      statusCode: 200,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * 查詢診所統計與失敗警告
   *
   * GET /sync/audit/stats
   *
   * @param days 統計天數（預設 7）
   * @returns 診所統計與失敗模式警告
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查詢診所同步統計與失敗警告' })
  @ApiQuery({ name: 'days', required: false, description: '統計天數（預設 7）' })
  async getStats(
    @Query('days') days: number = 7,
    @Req() req: any,
  ): Promise<{
    statusCode: number;
    data: {
      stats: {
        totalSyncs: number;
        successful: number;
        failed: number;
        avgSyncTime: number;
      };
      failureAlert: {
        hasAlert: boolean;
        failureCount: number;
        lastFailureTime?: Date;
      };
    };
  }> {
    const stats = await this.monitoringService.getClinicSyncStats(
      req.user.clinicId,
      Number(days),
    );

    const failureAlert = await this.monitoringService.checkFailurePattern(
      req.user.clinicId,
    );

    return {
      statusCode: 200,
      data: {
        stats,
        failureAlert,
      },
    };
  }

  /**
   * 查詢重試模式
   *
   * GET /sync/audit/retry-patterns
   *
   * @returns 重試統計與成功率
   */
  @Get('retry-patterns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查詢重試模式與成功率' })
  async getRetryPatterns(
    @Req() req: any,
  ): Promise<{
    statusCode: number;
    data: {
      avgRetriesPerSync: number;
      successRateAfterRetry: number;
    };
  }> {
    const patterns = await this.monitoringService.getRetryPatterns(
      req.user.clinicId,
    );

    return {
      statusCode: 200,
      data: patterns,
    };
  }

  /**
   * 手動觸發數據對帳
   *
   * POST /sync/audit/reconcile
   */
  @Post('reconcile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '手動觸發數據對帳' })
  async triggerReconciliation(@Req() req: any) {
    const report = await this.monitoringService.reconcileClinicData(req.user.clinicId);
    return {
      statusCode: 201,
      message: '對帳任務執行完成',
      data: report,
    };
  }

  /**
   * 取得對帳報告列表
   *
   * GET /sync/audit/reconciliation-reports
   */
  @Get('reconciliation-reports')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取得對帳報告列表' })
  async getReconciliationReports(
    @Req() req: any,
    @Query('limit') limit: number = 10,
  ) {
    const reports = await this.monitoringService.getReconciliationReports(
      req.user.clinicId,
      Number(limit),
    );
    return {
      statusCode: 200,
      data: reports,
      count: reports.length,
    };
  }

  /**
   * 取得對帳報告詳情
   *
   * GET /sync/audit/reconciliation-reports/:id
   */
  @Get('reconciliation-reports/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取得對帳報告詳情' })
  async getReconciliationReport(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const report = await this.monitoringService.getReconciliationReport(
      req.user.clinicId,
      id,
    );
    return {
      statusCode: 200,
      data: report,
    };
  }
}
