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
exports.TreatmentStaffAssignment = void 0;
const typeorm_1 = require("typeorm");
const treatment_entity_1 = require("../../treatments/entities/treatment.entity");
const staff_entity_1 = require("./staff.entity");
let TreatmentStaffAssignment = class TreatmentStaffAssignment {
    id;
    treatmentId;
    treatment;
    staffId;
    staff;
    role;
    revenuePercentage;
    assignedAt;
    isActive;
};
exports.TreatmentStaffAssignment = TreatmentStaffAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TreatmentStaffAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentStaffAssignment.prototype, "treatmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_entity_1.Treatment, (treatment) => treatment.staffAssignments),
    (0, typeorm_1.JoinColumn)({ name: "treatmentId" }),
    __metadata("design:type", treatment_entity_1.Treatment)
], TreatmentStaffAssignment.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentStaffAssignment.prototype, "staffId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => staff_entity_1.Staff, (staff) => staff.assignments),
    (0, typeorm_1.JoinColumn)({ name: "staffId" }),
    __metadata("design:type", staff_entity_1.Staff)
], TreatmentStaffAssignment.prototype, "staff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], TreatmentStaffAssignment.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TreatmentStaffAssignment.prototype, "revenuePercentage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentStaffAssignment.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], TreatmentStaffAssignment.prototype, "isActive", void 0);
exports.TreatmentStaffAssignment = TreatmentStaffAssignment = __decorate([
    (0, typeorm_1.Entity)("treatment_staff_assignments"),
    (0, typeorm_1.Unique)(["treatmentId", "staffId", "role"])
], TreatmentStaffAssignment);
//# sourceMappingURL=treatment-staff-assignment.entity.js.map