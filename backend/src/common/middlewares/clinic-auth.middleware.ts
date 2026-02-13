import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * 診所隔離中間件
 *
 * 此中間件用於驗證請求中的診所ID（clinicId）並將其注入請求上下文
 * 確保所有數據操作都限制在特定的診所範圍內
 *
 * 使用方式：
 * 1. 通過 Header: `X-Clinic-Id: <clinicId>`
 * 2. 通過 Query Parameter: `?clinicId=<clinicId>`
 * 3. 通過 Body（僅限 POST/PUT/PATCH）: `{ clinicId: <clinicId> }`
 *
 * 優先級：Header > Query > Body
 */
@Injectable()
export class ClinicAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ClinicAuthMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // 從 Header、Query 或 Body 中提取 clinicId
    const clinicId =
      this.extractClinicIdFromHeader(req) ||
      this.extractClinicIdFromQuery(req) ||
      this.extractClinicIdFromBody(req);

    if (!clinicId) {
      this.logger.warn(
        `No clinicId found in request to ${req.method} ${req.url}`,
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: "診所ID（clinicId）為必填項",
        errorCode: "CLINIC_ID_REQUIRED",
        details: {
          acceptedSources: [
            "X-Clinic-Id header",
            "clinicId query parameter",
            "clinicId in request body",
          ],
          example: "X-Clinic-Id: clinic_12345",
        },
      });
    }

    // 驗證 clinicId 格式
    if (!this.isValidClinicId(clinicId)) {
      this.logger.warn(`Invalid clinicId format: ${clinicId}`);
      throw new UnauthorizedException({
        statusCode: 401,
        message: "診所ID格式無效",
        errorCode: "INVALID_CLINIC_ID",
        details: {
          format: "應為非空字符串，長度為1-64字符",
          received: clinicId,
        },
      });
    }

    // 將 clinicId 注入請求對象，供後續使用
    (req as any).clinicId = clinicId;

    this.logger.debug(
      `Clinic ID authenticated: ${clinicId} for ${req.method} ${req.url}`,
    );
    next();
  }

  /**
   * 從 Header 中提取 clinicId
   */
  private extractClinicIdFromHeader(req: Request): string | null {
    const headerValue = req.headers["x-clinic-id"];
    if (headerValue) {
      return Array.isArray(headerValue) ? headerValue[0] : headerValue;
    }
    return null;
  }

  /**
   * 從 Query 參數中提取 clinicId
   */
  private extractClinicIdFromQuery(req: Request): string | null {
    const queryValue = req.query.clinicId;
    if (queryValue) {
      if (Array.isArray(queryValue)) {
        return queryValue[0] as string;
      } else if (typeof queryValue === "string") {
        return queryValue;
      } else if (typeof queryValue === "object") {
        // 處理 ParsedQs 類型
        return queryValue.toString();
      }
    }
    return null;
  }

  /**
   * 從 Body 中提取 clinicId（僅限有 Body 的請求）
   */
  private extractClinicIdFromBody(req: Request): string | null {
    if (
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      req.body &&
      typeof req.body === "object" &&
      req.body.clinicId
    ) {
      return req.body.clinicId;
    }
    return null;
  }

  /**
   * 驗證 clinicId 格式
   *
   * 驗證規則：
   * 1. 必須為字符串類型
   * 2. 長度在 1-64 字符之間
   * 3. 只允許字母、數字、下劃線和連字符
   * 4. 不允許包含特殊字符（防止注入攻擊）
   */
  private isValidClinicId(clinicId: string): boolean {
    if (typeof clinicId !== "string") {
      return false;
    }

    // 基本驗證：非空，長度合理
    const trimmedId = clinicId.trim();
    if (trimmedId.length === 0 || trimmedId.length > 64) {
      return false;
    }

    // 格式驗證：只允許字母、數字、下劃線和連字符
    // 防止 SQL 注入和其他攻擊
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(trimmedId)) {
      this.logger.warn(
        `Clinic ID contains invalid characters: ${clinicId.substring(0, 20)}...`,
      );
      return false;
    }

    // 防止常見的注入模式
    const dangerousPatterns = [
      /--/, // SQL 註釋
      /;/, // SQL 分隔符
      /'/, // SQL 字符串
      /"/, // SQL 字符串
      /\\/, // 轉義字符
      /<script/i, // XSS
      /javascript:/i, // XSS
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(clinicId)) {
        this.logger.warn(
          `Potential injection attempt detected in clinicId: ${clinicId.substring(0, 20)}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * 從請求中獲取診所 ID（供其他服務使用）
   */
  static getClinicIdFromRequest(req: Request): string | null {
    return (req as any).clinicId || null;
  }
}
