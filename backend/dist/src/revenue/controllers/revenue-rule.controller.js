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
exports.RevenueRuleController = void 0;
const common_1 = require("@nestjs/common");
const revenue_rule_service_1 = require("../services/revenue-rule.service");
const create_revenue_rule_dto_1 = require("../dto/create-revenue-rule.dto");
const update_revenue_rule_dto_1 = require("../dto/update-revenue-rule.dto");
let RevenueRuleController = class RevenueRuleController {
    revenueRuleService;
    constructor(revenueRuleService) {
        this.revenueRuleService = revenueRuleService;
    }
    create(createRevenueRuleDto) {
        return this.revenueRuleService.create(createRevenueRuleDto);
    }
    findAll(clinicId) {
        return this.revenueRuleService.findAll(clinicId);
    }
    findActive(clinicId, date) {
        const queryDate = date ? new Date(date) : new Date();
        return this.revenueRuleService.findActiveRules(clinicId, queryDate);
    }
    findByRole(clinicId, role) {
        return this.revenueRuleService.findByRole(clinicId, role);
    }
    findOne(id) {
        return this.revenueRuleService.findOne(id);
    }
    update(id, updateRevenueRuleDto) {
        return this.revenueRuleService.update(id, updateRevenueRuleDto);
    }
    remove(id) {
        return this.revenueRuleService.remove(id);
    }
};
exports.RevenueRuleController = RevenueRuleController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_revenue_rule_dto_1.CreateRevenueRuleDto]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("active"),
    __param(0, (0, common_1.Query)("clinicId")),
    __param(1, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)("role/:role"),
    __param(0, (0, common_1.Query)("clinicId")),
    __param(1, (0, common_1.Param)("role")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "findByRole", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_revenue_rule_dto_1.UpdateRevenueRuleDto]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueRuleController.prototype, "remove", null);
exports.RevenueRuleController = RevenueRuleController = __decorate([
    (0, common_1.Controller)("revenue-rules"),
    __metadata("design:paramtypes", [revenue_rule_service_1.RevenueRuleService])
], RevenueRuleController);
//# sourceMappingURL=revenue-rule.controller.js.map