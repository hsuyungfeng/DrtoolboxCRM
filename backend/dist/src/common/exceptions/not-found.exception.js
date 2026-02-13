"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundException = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./base.exception");
class NotFoundException extends base_exception_1.BaseException {
    constructor(resource, resourceId, details) {
        const message = resourceId
            ? `${resource} with ID ${resourceId} not found`
            : `${resource} not found`;
        super(message, common_1.HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", {
            resource,
            resourceId,
            ...details,
        });
    }
}
exports.NotFoundException = NotFoundException;
//# sourceMappingURL=not-found.exception.js.map