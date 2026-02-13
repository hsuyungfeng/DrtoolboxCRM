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
exports.CreateReferralDto = void 0;
const class_validator_1 = require("class-validator");
class CreateReferralDto {
    referrerId;
    referrerType;
    patientId;
    clinicId;
    notes;
}
exports.CreateReferralDto = CreateReferralDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "推薦人 ID 不能為空" }),
    (0, class_validator_1.IsString)({ message: "推薦人 ID 必須是字符串" }),
    (0, class_validator_1.MinLength)(1, { message: "推薦人 ID 不能為空" }),
    (0, class_validator_1.MaxLength)(32, { message: "推薦人 ID 最多 32 個字符" }),
    __metadata("design:type", String)
], CreateReferralDto.prototype, "referrerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "推薦人類型不能為空" }),
    (0, class_validator_1.IsEnum)(["staff", "patient"], {
        message: '推薦人類型必須是 "staff" 或 "patient"',
    }),
    __metadata("design:type", String)
], CreateReferralDto.prototype, "referrerType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "患者 ID 不能為空" }),
    (0, class_validator_1.IsString)({ message: "患者 ID 必須是字符串" }),
    (0, class_validator_1.MinLength)(1, { message: "患者 ID 不能為空" }),
    (0, class_validator_1.MaxLength)(32, { message: "患者 ID 最多 32 個字符" }),
    __metadata("design:type", String)
], CreateReferralDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "診所 ID 不能為空" }),
    (0, class_validator_1.IsString)({ message: "診所 ID 必須是字符串" }),
    (0, class_validator_1.MinLength)(1, { message: "診所 ID 不能為空" }),
    (0, class_validator_1.MaxLength)(32, { message: "診所 ID 最多 32 個字符" }),
    __metadata("design:type", String)
], CreateReferralDto.prototype, "clinicId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "備註必須是字符串" }),
    __metadata("design:type", String)
], CreateReferralDto.prototype, "notes", void 0);
//# sourceMappingURL=create-referral.dto.js.map