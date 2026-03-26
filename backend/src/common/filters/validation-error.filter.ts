/**
 * 驗證錯誤過濾器（Validation Error Filter）
 * 統一處理 BadRequestException，格式化驗證錯誤訊息
 *
 * 用於將 class-validator 產生的驗證錯誤轉換為清晰的中文回應格式
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** 驗證錯誤回應格式 */
export interface ValidationErrorResponse {
  statusCode: number;
  /** 錯誤摘要訊息（多個錯誤以「; 」分隔） */
  message: string;
  /** 詳細錯誤欄位清單（每個欄位的具體驗證錯誤） */
  errors?: string[];
  /** 錯誤發生時間戳（ISO 8601 格式） */
  timestamp: string;
  /** 發生錯誤的 API 路徑 */
  path?: string;
}

@Catch(BadRequestException)
export class ValidationErrorFilter implements ExceptionFilter {
  /**
   * 攔截 BadRequestException 並格式化為標準驗證錯誤回應
   *
   * @param exception - NestJS BadRequestException 實例
   * @param host - ArgumentsHost，用於存取 HTTP 請求和回應
   */
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as
      | string
      | { message: string | string[]; error?: string };

    let messages: string[];

    if (typeof exceptionResponse === 'string') {
      messages = [exceptionResponse];
    } else if (Array.isArray(exceptionResponse.message)) {
      messages = exceptionResponse.message;
    } else if (typeof exceptionResponse.message === 'string') {
      messages = [exceptionResponse.message];
    } else {
      messages = ['Bad Request'];
    }

    const body: ValidationErrorResponse = {
      statusCode: status,
      message: messages.join('; '),
      errors: messages.length > 1 ? messages : undefined,
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    response.status(status).json(body);
  }
}
