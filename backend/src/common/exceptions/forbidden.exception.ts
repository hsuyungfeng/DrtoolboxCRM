import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * 禁止訪問異常
 * 用於用戶沒有足夠權限訪問資源的情況
 */
export class ForbiddenException extends BaseException {
  constructor(
    message: string = 'Forbidden',
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      'FORBIDDEN',
      details,
    );
  }
}