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
exports.Referral = void 0;
const typeorm_1 = require("typeorm");
const patient_entity_1 = require("../../patients/entities/patient.entity");
let Referral = class Referral {
    id;
    referrerId;
    referrerType;
    patientId;
    patient;
    referralDate;
    status;
    firstTreatmentId;
    firstTreatmentDate;
    pointsAwarded;
    clinicId;
    notes;
    createdAt;
    updatedAt;
};
exports.Referral = Referral;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Referral.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Referral.prototype, "referrerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], Referral.prototype, "referrerType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Referral.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => patient_entity_1.Patient, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "patientId" }),
    __metadata("design:type", patient_entity_1.Patient)
], Referral.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], Referral.prototype, "referralDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "pending" }),
    __metadata("design:type", String)
], Referral.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], Referral.prototype, "firstTreatmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Date)
], Referral.prototype, "firstTreatmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "pointsAwarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Referral.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Referral.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Referral.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Referral.prototype, "updatedAt", void 0);
exports.Referral = Referral = __decorate([
    (0, typeorm_1.Entity)("referrals"),
    (0, typeorm_1.Index)("idx_referrer_clinic", ["referrerId", "referrerType", "clinicId"]),
    (0, typeorm_1.Index)("idx_patient_clinic", ["patientId", "clinicId"]),
    (0, typeorm_1.Index)("idx_clinic_status", ["clinicId", "status"]),
    (0, typeorm_1.Index)("idx_status_created", ["status", "createdAt"]),
    (0, typeorm_1.Unique)("uq_referral_per_patient_pending", ["patientId", "clinicId"])
], Referral);
//# sourceMappingURL=referral.entity.js.map