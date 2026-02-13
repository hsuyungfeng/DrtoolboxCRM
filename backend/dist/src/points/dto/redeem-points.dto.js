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
exports.RedeemPointsDto = void 0;
const class_validator_1 = require("class-validator");
class RedeemPointsDto {
    customerId;
    customerType;
    amount;
    clinicId;
    treatmentId;
    notes;
}
exports.RedeemPointsDto = RedeemPointsDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "customerId 不能為空" }),
    (0, class_validator_1.IsString)({ message: "customerId 必須是字符串" }),
    __metadata("design:type", String)
], RedeemPointsDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "customerType 不能為空" }),
    (0, class_validator_1.IsString)({ message: "customerType 必須是字符串" }),
    __metadata("design:type", String)
], RedeemPointsDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "amount 不能為空" }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: "amount 必須是數字，最多 2 位小數" }),
    (0, class_validator_1.Min)(0.01, { message: "amount 必須大於 0" }),
    __metadata("design:type", Number)
], RedeemPointsDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "clinicId 不能為空" }),
    (0, class_validator_1.IsString)({ message: "clinicId 必須是字符串" }),
    __metadata("design:type", String)
], RedeemPointsDto.prototype, "clinicId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "treatmentId 必須是字符串" }),
    __metadata("design:type", String)
], RedeemPointsDto.prototype, "treatmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "notes 必須是字符串" }),
    __metadata("design:type", String)
], RedeemPointsDto.prototype, "notes", void 0);
//# sourceMappingURL=redeem-points.dto.js.map