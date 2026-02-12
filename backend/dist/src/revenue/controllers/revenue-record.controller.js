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
exports.RevenueRecordController = void 0;
const common_1 = require("@nestjs/common");
const revenue_record_service_1 = require("../services/revenue-record.service");
let RevenueRecordController = class RevenueRecordController {
    revenueRecordService;
    constructor(revenueRecordService) {
        this.revenueRecordService = revenueRecordService;
    }
    findAll(clinicId) {
        return this.revenueRecordService.findAll(clinicId);
    }
    findByTreatment(treatmentId, clinicId) {
        return this.revenueRecordService.findByTreatment(treatmentId, clinicId);
    }
    findByStaff(staffId, clinicId) {
        return this.revenueRecordService.findByStaff(staffId, clinicId);
    }
    getSummary(clinicId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.revenueRecordService.getSummaryByClinic(clinicId, start, end);
    }
    findOne(id) {
        return this.revenueRecordService.findOne(id);
    }
    calculateForTreatment(treatmentId, clinicId) {
        return this.revenueRecordService.calculateForTreatment(treatmentId, clinicId);
    }
    calculateForSession(sessionId, treatmentId, clinicId) {
        return this.revenueRecordService.calculateForSession(treatmentId, sessionId, clinicId);
    }
    lockRecord(id) {
        return this.revenueRecordService.lockRecord(id);
    }
    unlockRecord(id) {
        return this.revenueRecordService.unlockRecord(id);
    }
    markAsPaid(id, paidAt) {
        const paidDate = paidAt ? new Date(paidAt) : undefined;
        return this.revenueRecordService.markAsPaid(id, paidDate);
    }
};
exports.RevenueRecordController = RevenueRecordController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("treatment/:treatmentId"),
    __param(0, (0, common_1.Param)("treatmentId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "findByTreatment", null);
__decorate([
    (0, common_1.Get)("staff/:staffId"),
    __param(0, (0, common_1.Param)("staffId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "findByStaff", null);
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Query)("clinicId")),
    __param(1, (0, common_1.Query)("startDate")),
    __param(2, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)("calculate/treatment/:treatmentId"),
    __param(0, (0, common_1.Param)("treatmentId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "calculateForTreatment", null);
__decorate([
    (0, common_1.Post)("calculate/session/:sessionId"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Query)("treatmentId")),
    __param(2, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "calculateForSession", null);
__decorate([
    (0, common_1.Patch)(":id/lock"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "lockRecord", null);
__decorate([
    (0, common_1.Patch)(":id/unlock"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "unlockRecord", null);
__decorate([
    (0, common_1.Patch)(":id/paid"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("paidAt")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRecordController.prototype, "markAsPaid", null);
exports.RevenueRecordController = RevenueRecordController = __decorate([
    (0, common_1.Controller)("revenue-records"),
    __metadata("design:paramtypes", [revenue_record_service_1.RevenueRecordService])
], RevenueRecordController);
//# sourceMappingURL=revenue-record.controller.js.map