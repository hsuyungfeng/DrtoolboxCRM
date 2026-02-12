"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const errorResponse = {
            statusCode: status,
            message: this.extractMessage(exceptionResponse),
            errorCode: this.extractErrorCode(exception, exceptionResponse),
            timestamp: new Date().toISOString(),
            path: request.url,
            details: this.extractDetails(exceptionResponse),
            errors: this.extractValidationErrors(exceptionResponse),
        };
        response
            .status(status)
            .json(errorResponse);
    }
    extractMessage(exceptionResponse) {
        if (typeof exceptionResponse === 'string') {
            return exceptionResponse;
        }
        if (exceptionResponse?.message) {
            return Array.isArray(exceptionResponse.message)
                ? exceptionResponse.message[0]
                : exceptionResponse.message;
        }
        return 'Internal server error';
    }
    extractErrorCode(exception, exceptionResponse) {
        if (exceptionResponse?.errorCode) {
            return exceptionResponse.errorCode;
        }
        const status = exception.getStatus();
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            case common_1.HttpStatus.UNPROCESSABLE_ENTITY:
                return 'VALIDATION_ERROR';
            case common_1.HttpStatus.INTERNAL_SERVER_ERROR:
                return 'INTERNAL_SERVER_ERROR';
            default:
                return `HTTP_${status}`;
        }
    }
    extractDetails(exceptionResponse) {
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const { message, errorCode, errors, ...details } = exceptionResponse;
            return Object.keys(details).length > 0 ? details : undefined;
        }
        return undefined;
    }
    extractValidationErrors(exceptionResponse) {
        if (exceptionResponse?.errors && Array.isArray(exceptionResponse.errors)) {
            return exceptionResponse.errors.map((error) => ({
                field: error.field || error.property || 'unknown',
                message: error.message || 'Validation error',
                constraint: error.constraint,
            }));
        }
        return undefined;
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map