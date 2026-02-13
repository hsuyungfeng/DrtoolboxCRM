import { HttpException, HttpStatus } from "@nestjs/common";
export declare class BaseException extends HttpException {
    readonly errorCode: string;
    readonly details?: Record<string, any>;
    constructor(message: string, statusCode?: HttpStatus, errorCode?: string, details?: Record<string, any>);
    getResponse(): string | object;
}
