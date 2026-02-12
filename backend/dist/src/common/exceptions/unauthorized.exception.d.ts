import { BaseException } from './base.exception';
export declare class UnauthorizedException extends BaseException {
    constructor(message?: string, details?: Record<string, any>);
}
