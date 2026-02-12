"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClinicAuthMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ClinicAuthMiddleware = ClinicAuthMiddleware_1 = class ClinicAuthMiddleware {
    logger = new common_1.Logger(ClinicAuthMiddleware_1.name);
    use(req, res, next) {
        const clinicId = this.extractClinicIdFromHeader(req) ||
            this.extractClinicIdFromQuery(req) ||
            this.extractClinicIdFromBody(req);
        if (!clinicId) {
            this.logger.warn(`No clinicId found in request to ${req.method} ${req.url}`);
            throw new common_1.UnauthorizedException({
                statusCode: 401,
                message: "診所ID（clinicId）為必填項",
                errorCode: "CLINIC_ID_REQUIRED",
                details: {
                    acceptedSources: ["X-Clinic-Id header", "clinicId query parameter", "clinicId in request body"],
                    example: "X-Clinic-Id: clinic_12345",
                },
            });
        }
        if (!this.isValidClinicId(clinicId)) {
            this.logger.warn(`Invalid clinicId format: ${clinicId}`);
            throw new common_1.UnauthorizedException({
                statusCode: 401,
                message: "診所ID格式無效",
                errorCode: "INVALID_CLINIC_ID",
                details: {
                    format: "應為非空字符串，長度為1-64字符",
                    received: clinicId,
                },
            });
        }
        req.clinicId = clinicId;
        this.logger.debug(`Clinic ID authenticated: ${clinicId} for ${req.method} ${req.url}`);
        next();
    }
    extractClinicIdFromHeader(req) {
        const headerValue = req.headers["x-clinic-id"];
        if (headerValue) {
            return Array.isArray(headerValue) ? headerValue[0] : headerValue;
        }
        return null;
    }
    extractClinicIdFromQuery(req) {
        const queryValue = req.query.clinicId;
        if (queryValue) {
            if (Array.isArray(queryValue)) {
                return queryValue[0];
            }
            else if (typeof queryValue === "string") {
                return queryValue;
            }
            else if (typeof queryValue === "object") {
                return queryValue.toString();
            }
        }
        return null;
    }
    extractClinicIdFromBody(req) {
        if (["POST", "PUT", "PATCH"].includes(req.method) &&
            req.body &&
            typeof req.body === "object" &&
            req.body.clinicId) {
            return req.body.clinicId;
        }
        return null;
    }
    isValidClinicId(clinicId) {
        if (typeof clinicId !== "string") {
            return false;
        }
        const trimmedId = clinicId.trim();
        if (trimmedId.length === 0 || trimmedId.length > 64) {
            return false;
        }
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(trimmedId)) {
            this.logger.warn(`Clinic ID contains invalid characters: ${clinicId.substring(0, 20)}...`);
            return false;
        }
        const dangerousPatterns = [
            /--/,
            /;/,
            /'/,
            /"/,
            /\\/,
            /<script/i,
            /javascript:/i,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(clinicId)) {
                this.logger.warn(`Potential injection attempt detected in clinicId: ${clinicId.substring(0, 20)}`);
                return false;
            }
        }
        return true;
    }
    static getClinicIdFromRequest(req) {
        return req.clinicId || null;
    }
};
exports.ClinicAuthMiddleware = ClinicAuthMiddleware;
exports.ClinicAuthMiddleware = ClinicAuthMiddleware = ClinicAuthMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], ClinicAuthMiddleware);
//# sourceMappingURL=clinic-auth.middleware.js.map