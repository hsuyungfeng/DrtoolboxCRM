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
exports.RevenueRecord = void 0;
const typeorm_1 = require("typeorm");
const treatment_entity_1 = require("../../treatments/entities/treatment.entity");
const treatment_session_entity_1 = require("../../treatments/entities/treatment-session.entity");
const staff_entity_1 = require("../../staff/entities/staff.entity");
let RevenueRecord = class RevenueRecord {
    id;
    treatmentId;
    treatment;
    treatmentSessionId;
    treatmentSession;
    staffId;
    staff;
    role;
    amount;
    calculationType;
    status;
    calculatedAt;
    lockedAt;
    paidAt;
    calculationDetails;
    updatedAt;
    clinicId;
    ruleId;
    version;
};
exports.RevenueRecord = RevenueRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RevenueRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "treatmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_entity_1.Treatment),
    (0, typeorm_1.JoinColumn)({ name: "treatmentId" }),
    __metadata("design:type", treatment_entity_1.Treatment)
], RevenueRecord.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "treatmentSessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_session_entity_1.TreatmentSession, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "treatmentSessionId" }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "treatmentSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "staffId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => staff_entity_1.Staff),
    (0, typeorm_1.JoinColumn)({ name: "staffId" }),
    __metadata("design:type", staff_entity_1.Staff)
], RevenueRecord.prototype, "staff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 20, scale: 2 }),
    __metadata("design:type", Number)
], RevenueRecord.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "calculationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RevenueRecord.prototype, "calculatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "lockedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "text",
        nullable: true,
        transformer: {
            to: (value) => {
                if (!value)
                    return null;
                return JSON.stringify(value);
            },
            from: (value) => {
                if (!value)
                    return null;
                try {
                    return JSON.parse(value);
                }
                catch {
                    return null;
                }
            },
        },
    }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "calculationDetails", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RevenueRecord.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueRecord.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", Object)
], RevenueRecord.prototype, "ruleId", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)(),
    __metadata("design:type", Number)
], RevenueRecord.prototype, "version", void 0);
exports.RevenueRecord = RevenueRecord = __decorate([
    (0, typeorm_1.Entity)("revenue_records")
], RevenueRecord);
//# sourceMappingURL=revenue-record.entity.js.map