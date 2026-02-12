import { BaseException } from './base.exception';
export declare class ValidationException extends BaseException {
    constructor(errors: Array<{
        field: string;
        message: string;
        constraint?: string;
    }>, message?: string, details?: Record<string, any>);
    static fromValidationErrors(validationErrors: any[]): ValidationException;
}
