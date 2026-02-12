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
exports.CreatePointsTransactionDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePointsTransactionDto {
    customerId;
    customerType;
    type;
    amount;
    source;
    clinicId;
    referralId;
    treatmentId;
    notes;
}
exports.CreatePointsTransactionDto = CreatePointsTransactionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'customerId 不能為空' }),
    (0, class_validator_1.IsString)({ message: 'customerId 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'customerType 不能為空' }),
    (0, class_validator_1.IsString)({ message: 'customerType 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'type 不能為空' }),
    (0, class_validator_1.IsString)({ message: 'type 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'amount 不能為空' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'amount 必須是數字，最多 2 位小數' }),
    __metadata("design:type", Number)
], CreatePointsTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'source 不能為空' }),
    (0, class_validator_1.IsString)({ message: 'source 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'clinicId 不能為空' }),
    (0, class_validator_1.IsString)({ message: 'clinicId 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "clinicId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'referralId 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "referralId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'treatmentId 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "treatmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'notes 必須是字符串' }),
    __metadata("design:type", String)
], CreatePointsTransactionDto.prototype, "notes", void 0);
//# sourceMappingURL=create-points-transaction.dto.js.map