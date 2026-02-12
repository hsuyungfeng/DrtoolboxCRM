"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./base.exception");
class UnauthorizedException extends base_exception_1.BaseException {
    constructor(message = 'Unauthorized', details) {
        super(message, common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedException = UnauthorizedException;
//# sourceMappingURL=unauthorized.exception.js.map