import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

/**
 * 資源未找到異常
 * 用於請求的資源不存在的情況
 */
export class NotFoundException extends BaseException {
  constructor(
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
  ) {
    const message = resourceId
      ? `${resource} with ID ${resourceId} not found`
      : `${resource} not found`;

    super(message, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", {
      resource,
      resourceId,
      ...details,
    });
  }
}
