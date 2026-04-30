import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SyncPatientService } from '../services/sync-patient.service';
import { WebhookPayloadDto } from '../dto/webhook-payload.dto';
import { WebhookSignatureGuard } from '../guards/webhook-signature.guard';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * SyncWebhookController — Doctor Toolbox Webhook 接收端
 *
 * 用途：
 * - 接收來自 Doctor Toolbox 的實時患者異動事件
 * - 透過 WebhookSignatureGuard 驗證 HMAC 簽名，確保請求真實性
 * - 調用 SyncPatientService 執行數據同步與衝突解決
 *
 * 安全性：
 * - 此端點為公開 (Public)，由 HMAC 簽名保護而非 JWT
 */
@ApiTags('Sync')
@Controller('sync/webhook')
export class SyncWebhookController {
  constructor(private readonly syncPatientService: SyncPatientService) {}

  /**
   * 接收 Doctor Toolbox Webhook 事件
   * POST /api/sync/webhook
   */
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收 Doctor Toolbox Webhook 事件', description: '接收實時患者數據同步事件' })
  @ApiHeader({ name: 'x-toolbox-signature', description: 'HMAC-SHA256 簽名' })
  @ApiHeader({ name: 'x-toolbox-timestamp', description: 'Webhook 發送時間戳' })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Req() req: any,
  ) {
    // 註：Clinic ID 通常包含在 Webhook payload 中或由 Guard 根據密鑰識別
    // 這裡我們假設 payload 中包含 clinicId
    const clinicId = payload.clinicId;

    const result = await this.syncPatientService.syncFromToolbox(payload, clinicId);

    return {
      statusCode: 200,
      message: 'Webhook processed successfully',
      data: result,
    };
  }
}
