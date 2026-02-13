"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        this.logError(exception, request);
        const status = this.getStatusCode(exception);
        const isProduction = process.env.NODE_ENV === "production";
        const errorResponse = {
            statusCode: status,
            message: this.getMessage(exception, isProduction),
            errorCode: this.getErrorCode(exception),
            timestamp: new Date().toISOString(),
            path: request.url,
            details: this.getDetails(exception, isProduction),
        };
        response.status(status).json(errorResponse);
    }
    logError(exception, request) {
        const errorMessage = `
      Unhandled Exception: ${exception.message}
      Stack: ${exception.stack}
      Method: ${request.method}
      URL: ${request.url}
      Body: ${JSON.stringify(request.body)}
      Query: ${JSON.stringify(request.query)}
      Params: ${JSON.stringify(request.params)}
      IP: ${request.ip}
      User-Agent: ${request.get("user-agent")}
    `;
        this.logger.error(errorMessage);
    }
    getStatusCode(exception) {
        if (exception?.code?.startsWith("SQLITE_") || exception?.code === "23505") {
            return common_1.HttpStatus.CONFLICT;
        }
        return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
    getMessage(exception, isProduction) {
        if (isProduction) {
            return "An internal server error occurred. Please contact support.";
        }
        return exception.message || "Internal server error";
    }
    getErrorCode(exception) {
        if (exception?.name) {
            switch (exception.name) {
                case "TypeError":
                    return "TYPE_ERROR";
                case "RangeError":
                    return "RANGE_ERROR";
                case "SyntaxError":
                    return "SYNTAX_ERROR";
                case "ReferenceError":
                    return "REFERENCE_ERROR";
                default:
                    return "UNKNOWN_ERROR";
            }
        }
        if (exception?.code?.startsWith("SQLITE_")) {
            return "DATABASE_ERROR";
        }
        return "INTERNAL_SERVER_ERROR";
    }
    getDetails(exception, isProduction) {
        if (isProduction) {
            return undefined;
        }
        const details = {};
        if (exception.name) {
            details.errorName = exception.name;
        }
        if (exception.code) {
            details.errorCode = exception.code;
        }
        if (exception.stack) {
            details.stack = exception.stack.split("\n").slice(0, 5);
        }
        return Object.keys(details).length > 0 ? details : undefined;
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map