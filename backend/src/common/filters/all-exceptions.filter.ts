import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 記錄錯誤日誌
    this.logError(exception, request);

    // 構建錯誤響應
    const status = this.getStatusCode(exception);
    const isProduction = process.env.NODE_ENV === 'production';

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message: this.getMessage(exception, isProduction),
      errorCode: this.getErrorCode(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
      details: this.getDetails(exception, isProduction),
    };

    // 設置響應頭和狀態碼
    response
      .status(status)
      .json(errorResponse);
  }

  /**
   * 記錄錯誤日誌
   */
  private logError(exception: any, request: Request): void {
    const errorMessage = `
      Unhandled Exception: ${exception.message}
      Stack: ${exception.stack}
      Method: ${request.method}
      URL: ${request.url}
      Body: ${JSON.stringify(request.body)}
      Query: ${JSON.stringify(request.query)}
      Params: ${JSON.stringify(request.params)}
      IP: ${request.ip}
      User-Agent: ${request.get('user-agent')}
    `;

    this.logger.error(errorMessage);
  }

  /**
   * 獲取 HTTP 狀態碼
   */
  private getStatusCode(exception: any): number {
    // 如果是 TypeORM 或其他數據庫錯誤
    if (exception?.code?.startsWith('SQLITE_') || exception?.code === '23505') {
      return HttpStatus.CONFLICT; // 數據衝突
    }

    // 默認為 500 內部服務器錯誤
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * 獲取錯誤信息
   */
  private getMessage(exception: any, isProduction: boolean): string {
    // 在生產環境中隱藏詳細錯誤信息
    if (isProduction) {
      return 'An internal server error occurred. Please contact support.';
    }

    // 在開發環境中提供詳細錯誤信息
    return exception.message || 'Internal server error';
  }

  /**
   * 獲取錯誤代碼
   */
  private getErrorCode(exception: any): string {
    // 根據錯誤類型返回對應的錯誤代碼
    if (exception?.name) {
      switch (exception.name) {
        case 'TypeError':
          return 'TYPE_ERROR';
        case 'RangeError':
          return 'RANGE_ERROR';
        case 'SyntaxError':
          return 'SYNTAX_ERROR';
        case 'ReferenceError':
          return 'REFERENCE_ERROR';
        default:
          return 'UNKNOWN_ERROR';
      }
    }

    // 如果是數據庫錯誤
    if (exception?.code?.startsWith('SQLITE_')) {
      return 'DATABASE_ERROR';
    }

    return 'INTERNAL_SERVER_ERROR';
  }

  /**
   * 獲取錯誤詳細信息
   */
  private getDetails(exception: any, isProduction: boolean): Record<string, any> | undefined {
    // 在生產環境中不返回堆棧信息
    if (isProduction) {
      return undefined;
    }

    // 在開發環境中返回詳細信息
    const details: Record<string, any> = {};

    if (exception.name) {
      details.errorName = exception.name;
    }

    if (exception.code) {
      details.errorCode = exception.code;
    }

    if (exception.stack) {
      details.stack = exception.stack.split('\n').slice(0, 5); // 只返回前5行堆棧
    }

    return Object.keys(details).length > 0 ? details : undefined;
  }
}