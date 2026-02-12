"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./base.exception");
class BadRequestException extends base_exception_1.BaseException {
    constructor(message = 'Bad request', details) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
    }
}
exports.BadRequestException = BadRequestException;
//# sourceMappingURL=bad-request.exception.js.map