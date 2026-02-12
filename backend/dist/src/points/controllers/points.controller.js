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
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const points_service_1 = require("../services/points.service");
const create_points_transaction_dto_1 = require("../dto/create-points-transaction.dto");
const redeem_points_dto_1 = require("../dto/redeem-points.dto");
let PointsController = class PointsController {
    pointsService;
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    async awardPoints(createDto) {
        return await this.pointsService.awardPoints(createDto.customerId, createDto.amount, createDto.source, createDto.clinicId, createDto.referralId);
    }
    async redeemPoints(redeemDto) {
        return await this.pointsService.redeemPoints(redeemDto.customerId, redeemDto.amount, redeemDto.clinicId, redeemDto.treatmentId);
    }
    async getBalance(customerId, customerType, clinicId) {
        return await this.pointsService.getBalance(customerId, customerType, clinicId);
    }
    async getTransactionHistory(customerId, customerType, clinicId, limit) {
        return await this.pointsService.getTransactionHistory(customerId, customerType, clinicId, limit || 20);
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Post)('award'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_points_transaction_dto_1.CreatePointsTransactionDto]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "awardPoints", null);
__decorate([
    (0, common_1.Post)('redeem'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [redeem_points_dto_1.RedeemPointsDto]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "redeemPoints", null);
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('customerId')),
    __param(1, (0, common_1.Query)('customerType')),
    __param(2, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('customerId')),
    __param(1, (0, common_1.Query)('customerType')),
    __param(2, (0, common_1.Query)('clinicId')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getTransactionHistory", null);
exports.PointsController = PointsController = __decorate([
    (0, common_1.Controller)('points'),
    __metadata("design:paramtypes", [points_service_1.PointsService])
], PointsController);
//# sourceMappingURL=points.controller.js.map