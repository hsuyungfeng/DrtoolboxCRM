import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChurnPredictionService } from './churn-prediction.service';
import { NotificationService } from './services/notification.service';
import type { SendNotificationDto } from './services/notification.service';
import type { ChurnRisk } from './churn-prediction.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly churnPredictionService: ChurnPredictionService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('churn-analysis')
  @ApiOperation({ summary: '取得診所的患者流失風險分析' })
  @ApiResponse({ status: 200, description: '分析成功' })
  async getChurnAnalysis(@Query('clinicId') clinicId: string) {
    return this.churnPredictionService.getChurnSummary(clinicId);
  }

  @Post('churn-prediction')
  @ApiOperation({ summary: '執行流失風險預測' })
  @ApiResponse({ status: 200, description: '預測成功' })
  async predictChurn(
    @Body()
    body: {
      clinicId: string;
      noSessionDaysThreshold?: number;
      unusedPointsThreshold?: number;
      minRiskScore?: number;
    },
  ): Promise<ChurnRisk[]> {
    return this.churnPredictionService.analyzeChurnRisk({
      clinicId: body.clinicId,
      noSessionDaysThreshold: body.noSessionDaysThreshold || 30,
      unusedPointsThreshold: body.unusedPointsThreshold || 100,
      minRiskScore: body.minRiskScore || 1,
    });
  }

  @Post('send')
  @ApiOperation({ summary: '發送通知' })
  @ApiResponse({ status: 200, description: '發送成功' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  @Post('churn-alerts')
  @ApiOperation({ summary: '發送流失風險預警' })
  @ApiResponse({ status: 200, description: '發送成功' })
  async sendChurnAlerts(
    @Body()
    body: {
      clinicId: string;
      minRiskLevel?: 'high' | 'medium' | 'low';
    },
  ) {
    const risks = await this.churnPredictionService.analyzeChurnRisk({
      clinicId: body.clinicId,
      noSessionDaysThreshold: 30,
      unusedPointsThreshold: 100,
      minRiskScore: body.minRiskLevel === 'high' ? 70 : body.minRiskLevel === 'medium' ? 40 : 1,
    });

    const filteredRisks = body.minRiskLevel
      ? risks.filter((r) => {
          const levels = ['low', 'medium', 'high'];
          return levels.indexOf(r.riskLevel) >= levels.indexOf(body.minRiskLevel!);
        })
      : risks;

    return this.notificationService.sendBulkChurnAlerts(filteredRisks, body.clinicId);
  }

  @Get('list')
  @ApiOperation({ summary: '取得通知列表' })
  async getNotifications(
    @Query('clinicId') clinicId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    return this.notificationService.getNotifications(clinicId, {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      status,
    });
  }
}
