import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * 數據驗證異常
 * 用於輸入數據驗證失敗的情況
 */
export class ValidationException extends BaseException {
  constructor(
    errors: Array<{
      field: string;
      message: string;
      constraint?: string;
    }>,
    message: string = 'Validation failed',
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      {
        errors,
        ...details,
      },
    );
  }

  /**
   * 從 class-validator 的驗證錯誤創建 ValidationException
   */
  static fromValidationErrors(validationErrors: any[]): ValidationException {
    const errors = validationErrors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      constraint: Object.keys(error.constraints || {})[0],
    }));

    return new ValidationException(errors);
  }
}