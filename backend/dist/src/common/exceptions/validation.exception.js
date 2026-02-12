"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationException = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./base.exception");
class ValidationException extends base_exception_1.BaseException {
    constructor(errors, message = 'Validation failed', details) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', {
            errors,
            ...details,
        });
    }
    static fromValidationErrors(validationErrors) {
        const errors = validationErrors.map(error => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
            constraint: Object.keys(error.constraints || {})[0],
        }));
        return new ValidationException(errors);
    }
}
exports.ValidationException = ValidationException;
//# sourceMappingURL=validation.exception.js.map