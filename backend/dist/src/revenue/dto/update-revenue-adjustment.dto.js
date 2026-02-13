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
exports.UpdateRevenueAdjustmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_revenue_adjustment_dto_1 = require("./create-revenue-adjustment.dto");
const class_validator_1 = require("class-validator");
class UpdateRevenueAdjustmentDto extends (0, swagger_1.PartialType)(create_revenue_adjustment_dto_1.CreateRevenueAdjustmentDto) {
    reviewStatus;
    reviewNotes;
    reviewedBy;
    reviewedAt;
}
exports.UpdateRevenueAdjustmentDto = UpdateRevenueAdjustmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "審核狀態",
        example: "approved",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRevenueAdjustmentDto.prototype, "reviewStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "審核備註",
        example: "調整金額合理，同意",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRevenueAdjustmentDto.prototype, "reviewNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "審核者 ID",
        example: "123e4567-e89b-12d3-a456-426614174002",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRevenueAdjustmentDto.prototype, "reviewedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "審核時間",
        example: "2025-02-09T10:30:00Z",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRevenueAdjustmentDto.prototype, "reviewedAt", void 0);
//# sourceMappingURL=update-revenue-adjustment.dto.js.map