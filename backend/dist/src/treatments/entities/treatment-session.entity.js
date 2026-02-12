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
exports.TreatmentSession = void 0;
const typeorm_1 = require("typeorm");
const treatment_entity_1 = require("./treatment.entity");
let TreatmentSession = class TreatmentSession {
    id;
    treatmentId;
    treatment;
    sessionIndex;
    scheduledTime;
    actualTime;
    status;
    notes;
    observations;
    durationMinutes;
    revenueCalculated;
    clinicId;
    createdAt;
    updatedAt;
};
exports.TreatmentSession = TreatmentSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TreatmentSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "treatmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_entity_1.Treatment, (treatment) => treatment.sessions),
    (0, typeorm_1.JoinColumn)({ name: "treatmentId" }),
    __metadata("design:type", treatment_entity_1.Treatment)
], TreatmentSession.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], TreatmentSession.prototype, "sessionIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "scheduledTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "actualTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "scheduled" }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TreatmentSession.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], TreatmentSession.prototype, "revenueCalculated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "updatedAt", void 0);
exports.TreatmentSession = TreatmentSession = __decorate([
    (0, typeorm_1.Entity)("treatment_sessions")
], TreatmentSession);
//# sourceMappingURL=treatment-session.entity.js.map