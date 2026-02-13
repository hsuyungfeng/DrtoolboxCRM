import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiErrorResponse } from "../interfaces/api-error-response.interface";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 獲取異常的響應數據
    const exceptionResponse = exception.getResponse() as any;

    // 構建標準錯誤響應
    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message: this.extractMessage(exceptionResponse),
      errorCode: this.extractErrorCode(exception, exceptionResponse),
      timestamp: new Date().toISOString(),
      path: request.url,
      details: this.extractDetails(exceptionResponse),
      errors: this.extractValidationErrors(exceptionResponse),
    };

    // 設置響應頭和狀態碼
    response.status(status).json(errorResponse);
  }

  /**
   * 從異常響應中提取錯誤信息
   */
  private extractMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }

    if (exceptionResponse?.message) {
      return Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message[0]
        : exceptionResponse.message;
    }

    return "Internal server error";
  }

  /**
   * 從異常響應中提取錯誤代碼
   */
  private extractErrorCode(
    exception: HttpException,
    exceptionResponse: any,
  ): string {
    // 如果是我們的 BaseException，它有 errorCode 屬性
    if (exceptionResponse?.errorCode) {
      return exceptionResponse.errorCode;
    }

    // 根據 HTTP 狀態碼返回對應的錯誤代碼
    const status = exception.getStatus();
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "VALIDATION_ERROR";
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return "INTERNAL_SERVER_ERROR";
      default:
        return `HTTP_${status}`;
    }
  }

  /**
   * 從異常響應中提取詳細信息
   */
  private extractDetails(
    exceptionResponse: any,
  ): Record<string, any> | undefined {
    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const { message, errorCode, errors, ...details } = exceptionResponse;
      return Object.keys(details).length > 0 ? details : undefined;
    }
    return undefined;
  }

  /**
   * 從異常響應中提取驗證錯誤
   */
  private extractValidationErrors(
    exceptionResponse: any,
  ): ApiErrorResponse["errors"] {
    if (exceptionResponse?.errors && Array.isArray(exceptionResponse.errors)) {
      return exceptionResponse.errors.map((error: any) => ({
        field: error.field || error.property || "unknown",
        message: error.message || "Validation error",
        constraint: error.constraint,
      }));
    }
    return undefined;
  }
}
