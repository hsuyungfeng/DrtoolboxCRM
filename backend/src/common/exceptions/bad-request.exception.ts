import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

/**
 * 錯誤請求異常
 * 用於客戶端發送無效請求的情況
 */
export class BadRequestException extends BaseException {
  constructor(message: string = "Bad request", details?: Record<string, any>) {
    super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST", details);
  }
}
