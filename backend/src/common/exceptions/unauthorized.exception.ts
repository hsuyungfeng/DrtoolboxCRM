import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

/**
 * 未授權異常
 * 用於用戶未登錄或憑證無效的情況
 */
export class UnauthorizedException extends BaseException {
  constructor(message: string = "Unauthorized", details?: Record<string, any>) {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", details);
  }
}
