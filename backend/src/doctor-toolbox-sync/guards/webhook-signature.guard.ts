import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * WebhookSignatureGuard — Doctor Toolbox Webhook 簽名驗證
 *
 * 用途：
 * - 驗證 Doctor Toolbox Webhook 請求的真實性（HMAC-SHA256）
 * - 防止重放攻擊（檢查時間戳在 5 分鐘內）
 * - 防止時序攻擊（使用 crypto.timingSafeEqual）
 *
 * 期望的請求頭：
 * - x-signature: HMAC-SHA256 簽名（十六進位編碼）
 * - x-timestamp: Unix timestamp（秒）
 *
 * 簽名生成（Doctor Toolbox 側）：
 * message = `${timestamp}.${JSON.stringify(body)}`
 * signature = HMAC-SHA256(secret, message)
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  /**
   * Webhook 時間戳有效期（秒）
   * 防止舊的重放請求被接受
   */
  private readonly TIMESTAMP_VALIDITY_WINDOW_SECONDS =
    parseInt(process.env.WEBHOOK_TIMESTAMP_WINDOW || '300', 10); // 5 分鐘

  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 讀取請求頭
    const signature = request.headers['x-signature'] as string;
    const timestamp = request.headers['x-timestamp'] as string;

    // 驗證請求頭存在
    if (!signature || !timestamp) {
      throw new UnauthorizedException(
        'Missing x-signature or x-timestamp header',
      );
    }

    // 驗證時間戳格式（必須是數字）
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      throw new UnauthorizedException('Invalid x-timestamp format');
    }

    // 驗證時間戳有效期（防重放攻擊）
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestampNum);
    if (timeDiff > this.TIMESTAMP_VALIDITY_WINDOW_SECONDS) {
      throw new UnauthorizedException(
        `Webhook timestamp is too old or in the future (${timeDiff}s > ${this.TIMESTAMP_VALIDITY_WINDOW_SECONDS}s)`,
      );
    }

    // 取得 Webhook 密鑰
    const secret = process.env.DOCTOR_TOOLBOX_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error(
        'DOCTOR_TOOLBOX_WEBHOOK_SECRET not configured in environment',
      );
    }

    // 驗證簽名
    const expectedSignature = this.computeSignature(timestamp, request.body, secret);
    const isValidSignature = this.timingSafeCompare(
      signature,
      expectedSignature,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }

  /**
   * 計算 HMAC-SHA256 簽名
   *
   * @param timestamp Unix timestamp（秒）
   * @param body 請求體
   * @param secret Webhook 密鑰
   * @returns 十六進位簽名
   */
  private computeSignature(
    timestamp: string,
    body: unknown,
    secret: string,
  ): string {
    const message = `${timestamp}.${JSON.stringify(body)}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    return signature;
  }

  /**
   * 時序安全的字串比較
   * 防止基於比較時間的時序攻擊
   *
   * @param provided 提供的簽名
   * @param expected 期望的簽名
   * @returns 是否相等
   */
  private timingSafeCompare(provided: string, expected: string): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(provided, 'utf8'),
        Buffer.from(expected, 'utf8'),
      );
    } catch {
      // timingSafeEqual 在長度不同時拋出，表示簽名無效
      return false;
    }
  }
}
