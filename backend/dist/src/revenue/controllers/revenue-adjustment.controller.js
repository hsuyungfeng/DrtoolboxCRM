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
exports.RevenueAdjustmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const revenue_adjustment_service_1 = require("../services/revenue-adjustment.service");
const create_revenue_adjustment_dto_1 = require("../dto/create-revenue-adjustment.dto");
const update_revenue_adjustment_dto_1 = require("../dto/update-revenue-adjustment.dto");
const revenue_adjustment_entity_1 = require("../entities/revenue-adjustment.entity");
let RevenueAdjustmentController = class RevenueAdjustmentController {
    adjustmentService;
    constructor(adjustmentService) {
        this.adjustmentService = adjustmentService;
    }
    async create(createDto, clinicId) {
        return this.adjustmentService.create(createDto, clinicId);
    }
    async findAll(clinicId, revenueRecordId, createdBy, startDate, endDate) {
        const filters = {};
        if (revenueRecordId)
            filters.revenueRecordId = revenueRecordId;
        if (createdBy)
            filters.createdBy = createdBy;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        return this.adjustmentService.findAll(clinicId, filters);
    }
    async findOne(id, clinicId) {
        return this.adjustmentService.findOne(id, clinicId);
    }
    async update(id, updateDto, clinicId) {
        return this.adjustmentService.update(id, updateDto, clinicId);
    }
    async remove(id, clinicId) {
        return this.adjustmentService.remove(id, clinicId);
    }
    async review(id, clinicId, reviewData) {
        return this.adjustmentService.review(id, clinicId, reviewData);
    }
    async findByRevenueRecordId(revenueRecordId, clinicId) {
        return this.adjustmentService.findByRevenueRecordId(revenueRecordId, clinicId);
    }
    async getTotalAdjustmentAmount(revenueRecordId, clinicId) {
        const total = await this.adjustmentService.getTotalAdjustmentAmount(revenueRecordId, clinicId);
        return { total };
    }
};
exports.RevenueAdjustmentController = RevenueAdjustmentController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '創建分潤調整' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '分潤調整創建成功', type: revenue_adjustment_entity_1.RevenueAdjustment }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '請求參數錯誤' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '權限不足' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '分潤記錄不存在' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_revenue_adjustment_dto_1.CreateRevenueAdjustmentDto, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查詢所有分潤調整' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回分潤調整列表', type: [revenue_adjustment_entity_1.RevenueAdjustment] }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'revenueRecordId', required: false, description: '分潤記錄 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, description: '創建者 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: '開始日期 (ISO 格式)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: '結束日期 (ISO 格式)' }),
    __param(0, (0, common_1.Query)('clinicId')),
    __param(1, (0, common_1.Query)('revenueRecordId')),
    __param(2, (0, common_1.Query)('createdBy')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '查詢單個分潤調整' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回分潤調整詳情', type: revenue_adjustment_entity_1.RevenueAdjustment }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '分潤調整不存在' }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新分潤調整（主要用於審核）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '分潤調整更新成功', type: revenue_adjustment_entity_1.RevenueAdjustment }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '請求參數錯誤' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '分潤調整不存在' }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_revenue_adjustment_dto_1.UpdateRevenueAdjustmentDto, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '刪除分潤調整' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '分潤調整刪除成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '分潤調整已審核通過，無法刪除' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '分潤調整不存在' }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    (0, swagger_1.ApiOperation)({ summary: '審核分潤調整' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '審核成功', type: revenue_adjustment_entity_1.RevenueAdjustment }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '分潤調整已審核過' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '分潤調整不存在' }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('clinicId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "review", null);
__decorate([
    (0, common_1.Get)('revenue-record/:revenueRecordId'),
    (0, swagger_1.ApiOperation)({ summary: '查詢指定分潤記錄的所有調整' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回分潤調整列表', type: [revenue_adjustment_entity_1.RevenueAdjustment] }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('revenueRecordId')),
    __param(1, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "findByRevenueRecordId", null);
__decorate([
    (0, common_1.Get)('revenue-record/:revenueRecordId/total-adjustment'),
    (0, swagger_1.ApiOperation)({ summary: '計算分潤記錄的總調整金額' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回總調整金額' }),
    (0, swagger_1.ApiQuery)({ name: 'clinicId', required: true, description: '診所 ID' }),
    __param(0, (0, common_1.Param)('revenueRecordId')),
    __param(1, (0, common_1.Query)('clinicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RevenueAdjustmentController.prototype, "getTotalAdjustmentAmount", null);
exports.RevenueAdjustmentController = RevenueAdjustmentController = __decorate([
    (0, swagger_1.ApiTags)('分潤調整'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('revenue-adjustments'),
    __metadata("design:paramtypes", [revenue_adjustment_service_1.RevenueAdjustmentService])
], RevenueAdjustmentController);
//# sourceMappingURL=revenue-adjustment.controller.js.map