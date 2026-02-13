"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const referral_service_1 = require("../services/referral.service");
const create_referral_dto_1 = require("../dto/create-referral.dto");
const convert_referral_dto_1 = require("../dto/convert-referral.dto");
let ReferralController = class ReferralController {
    referralService;
    constructor(referralService) {
        this.referralService = referralService;
    }
    async create(createReferralDto, req) {
        const clinicId = req.user?.clinicId || req.body?.clinicId;
        this.validateClinicId(createReferralDto.clinicId, clinicId);
        return await this.referralService.createReferral(createReferralDto);
    }
    async getReferralsByReferrer(referrerId, referrerType, req) {
        const clinicId = req.user?.clinicId;
        return await this.referralService.getReferralsByReferrer(referrerId, referrerType, clinicId);
    }
    async getReferralByPatient(patientId, req) {
        const clinicId = req.user?.clinicId;
        return await this.referralService.getReferralByPatient(patientId, clinicId);
    }
    async convert(id, convertReferralDto, req) {
        const clinicId = req.user?.clinicId;
        this.validateClinicId(convertReferralDto.clinicId, clinicId);
        return await this.referralService.convertReferral(id, convertReferralDto.treatmentId, clinicId);
    }
    async delete(id, req) {
        const clinicId = req.user?.clinicId;
        return await this.referralService.deleteReferral(id, clinicId);
    }
    async getStats(req) {
        const clinicId = req.user?.clinicId;
        return await this.referralService.getReferralStats(clinicId);
    }
    validateClinicId(dtoClinicId, userClinicId) {
        if (dtoClinicId !== userClinicId) {
            throw new common_1.BadRequestException("診所 ID 不匹配，無權限操作其他診所的數據");
        }
    }
};
exports.ReferralController = ReferralController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_referral_dto_1.CreateReferralDto, Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("by-referrer/:referrerId/:referrerType"),
    __param(0, (0, common_1.Param)("referrerId")),
    __param(1, (0, common_1.Param)("referrerType")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralsByReferrer", null);
__decorate([
    (0, common_1.Get)("by-patient/:patientId"),
    __param(0, (0, common_1.Param)("patientId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralByPatient", null);
__decorate([
    (0, common_1.Put)(":id/convert"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, convert_referral_dto_1.ConvertReferralDto, Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "convert", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getStats", null);
exports.ReferralController = ReferralController = __decorate([
    (0, common_1.Controller)("referrals"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [referral_service_1.ReferralService])
], ReferralController);
//# sourceMappingURL=referral.controller.js.map