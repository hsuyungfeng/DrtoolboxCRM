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
exports.RevenueAdjustment = void 0;
const typeorm_1 = require("typeorm");
const revenue_record_entity_1 = require("./revenue-record.entity");
let RevenueAdjustment = class RevenueAdjustment {
    id;
    revenueRecordId;
    revenueRecord;
    adjustmentAmount;
    reason;
    createdBy;
    createdAt;
    clinicId;
    metadata;
    reviewStatus;
    reviewNotes;
    reviewedBy;
    reviewedAt;
    version;
};
exports.RevenueAdjustment = RevenueAdjustment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "revenueRecordId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => revenue_record_entity_1.RevenueRecord),
    (0, typeorm_1.JoinColumn)({ name: "revenueRecordId" }),
    __metadata("design:type", revenue_record_entity_1.RevenueRecord)
], RevenueAdjustment.prototype, "revenueRecord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 20, scale: 2 }),
    __metadata("design:type", Number)
], RevenueAdjustment.prototype, "adjustmentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RevenueAdjustment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "clinicId", void 0);
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
], RevenueAdjustment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 20,
        nullable: true,
        default: "pending",
    }),
    __metadata("design:type", String)
], RevenueAdjustment.prototype, "reviewStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], RevenueAdjustment.prototype, "reviewNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", Object)
], RevenueAdjustment.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RevenueAdjustment.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)(),
    __metadata("design:type", Number)
], RevenueAdjustment.prototype, "version", void 0);
exports.RevenueAdjustment = RevenueAdjustment = __decorate([
    (0, typeorm_1.Entity)("revenue_adjustments")
], RevenueAdjustment);
//# sourceMappingURL=revenue-adjustment.entity.js.map