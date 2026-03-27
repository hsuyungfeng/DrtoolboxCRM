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
exports.Treatment = void 0;
const typeorm_1 = require("typeorm");
const patient_entity_1 = require("../../patients/entities/patient.entity");
const treatment_session_entity_1 = require("./treatment-session.entity");
const treatment_staff_assignment_entity_1 = require("../../staff/entities/treatment-staff-assignment.entity");
let Treatment = class Treatment {
    id;
    patientId;
    patient;
    name;
    treatmentTemplateId;
    totalPrice;
    totalSessions;
    completedSessions;
    status;
    startDate;
    expectedEndDate;
    actualEndDate;
    notes;
    clinicId;
    pointsRedeemed;
    finalPrice;
    createdAt;
    updatedAt;
    sessions;
    staffAssignments;
    version;
};
exports.Treatment = Treatment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Treatment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Treatment.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => patient_entity_1.Patient),
    (0, typeorm_1.JoinColumn)({ name: "patientId" }),
    __metadata("design:type", patient_entity_1.Patient)
], Treatment.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Treatment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "treatmentTemplateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 20, scale: 2 }),
    __metadata("design:type", Number)
], Treatment.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Treatment.prototype, "totalSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], Treatment.prototype, "completedSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "pending" }),
    __metadata("design:type", String)
], Treatment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], Treatment.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], Treatment.prototype, "expectedEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], Treatment.prototype, "actualEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Treatment.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Treatment.prototype, "pointsRedeemed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 20, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "finalPrice", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Treatment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Treatment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => treatment_session_entity_1.TreatmentSession, (session) => session.treatment),
    __metadata("design:type", Array)
], Treatment.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => treatment_staff_assignment_entity_1.TreatmentStaffAssignment, (assignment) => assignment.treatment),
    __metadata("design:type", Array)
], Treatment.prototype, "staffAssignments", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)(),
    __metadata("design:type", Number)
], Treatment.prototype, "version", void 0);
exports.Treatment = Treatment = __decorate([
    (0, typeorm_1.Entity)("treatments")
], Treatment);
//# sourceMappingURL=treatment.entity.js.map