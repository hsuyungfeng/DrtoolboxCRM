import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 基礎業務異常類別
 * 擴展自 HttpException，提供統一的業務異常處理基礎
 */
export class BaseException extends HttpException {
  /**
   * 錯誤代碼，用於前端識別錯誤類型
   */
  readonly errorCode: string;

  /**
   * 額外的錯誤詳細信息
   */
  readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: string = 'INTERNAL_ERROR',
    details?: Record<string, any>,
  ) {
    super(
      {
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );

    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;
  }

  /**
   * 獲取標準化的錯誤響應
   */
  getResponse() {
    return super.getResponse();
  }
}