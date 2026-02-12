import { BaseException } from './base.exception';
export declare class ForbiddenException extends BaseException {
    constructor(message?: string, details?: Record<string, any>);
}
