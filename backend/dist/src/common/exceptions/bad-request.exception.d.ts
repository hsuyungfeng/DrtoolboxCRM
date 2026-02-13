import { BaseException } from "./base.exception";
export declare class BadRequestException extends BaseException {
    constructor(message?: string, details?: Record<string, any>);
}
