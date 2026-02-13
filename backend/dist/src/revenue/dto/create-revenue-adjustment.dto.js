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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRevenueAdjustmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateRevenueAdjustmentDto {
    revenueRecordId;
    adjustmentAmount;
    reason;
    createdBy;
    clinicId;
    metadata;
}
exports.CreateRevenueAdjustmentDto = CreateRevenueAdjustmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "分潤記錄 ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRevenueAdjustmentDto.prototype, "revenueRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "調整金額（正數表示增加，負數表示減少）",
        example: -100.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRevenueAdjustmentDto.prototype, "adjustmentAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "調整原因",
        example: "客戶退款，需扣減分潤",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRevenueAdjustmentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "創建者 ID（員工 ID）",
        example: "123e4567-e89b-12d3-a456-426614174001",
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRevenueAdjustmentDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "診所 ID",
        example: "clinic_001",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRevenueAdjustmentDto.prototype, "clinicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "附加元數據",
        example: { refundId: "REF-20250209-001", approvedBy: "manager_001" },
        required: false,
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRevenueAdjustmentDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-revenue-adjustment.dto.js.map