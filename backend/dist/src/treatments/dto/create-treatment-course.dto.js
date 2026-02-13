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
exports.CreateTreatmentCourseDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTreatmentCourseDto {
    patientId;
    templateId;
    clinicId;
    pointsToRedeem;
}
exports.CreateTreatmentCourseDto = CreateTreatmentCourseDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "patientId 不能為空" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTreatmentCourseDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "templateId 不能為空" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTreatmentCourseDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "clinicId 不能為空" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTreatmentCourseDto.prototype, "clinicId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: "pointsToRedeem 必須是有效的數字" }),
    (0, class_validator_1.Min)(0, { message: "pointsToRedeem 不能為負" }),
    __metadata("design:type", Number)
], CreateTreatmentCourseDto.prototype, "pointsToRedeem", void 0);
//# sourceMappingURL=create-treatment-course.dto.js.map