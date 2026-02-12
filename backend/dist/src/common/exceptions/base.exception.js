"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseException = void 0;
const common_1 = require("@nestjs/common");
class BaseException extends common_1.HttpException {
    errorCode;
    details;
    constructor(message, statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR, errorCode = 'INTERNAL_ERROR', details) {
        super({
            message,
            errorCode,
            details,
            timestamp: new Date().toISOString(),
        }, statusCode);
        this.errorCode = errorCode;
        this.details = details;
        this.name = this.constructor.name;
    }
    getResponse() {
        return super.getResponse();
    }
}
exports.BaseException = BaseException;
//# sourceMappingURL=base.exception.js.map