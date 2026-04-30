import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('distribution')
  @ApiOperation({ summary: '獲取屬性分佈分析' })
  getAttributeDistribution(
    @Request() req,
    @Query('key') key: string,
  ) {
    return this.analyticsService.getAttributeDistribution(req.user.clinicId, key);
  }

  @Get('forecast')
  @ApiOperation({ summary: '獲取營收預測' })
  getRevenueForecast(@Request() req) {
    return this.analyticsService.getRevenueForecast(req.user.clinicId);
  }
}
