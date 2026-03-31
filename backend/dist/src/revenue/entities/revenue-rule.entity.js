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
exports.RevenueRule = void 0;
const typeorm_1 = require("typeorm");
let RevenueRule = class RevenueRule {
    id;
    role;
    ruleType;
    rulePayload;
    effectiveFrom;
    effectiveTo;
    clinicId;
    isActive;
    createdAt;
    updatedAt;
    description;
};
exports.RevenueRule = RevenueRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RevenueRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], RevenueRule.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], RevenueRule.prototype, "ruleType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "text",
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
], RevenueRule.prototype, "rulePayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], RevenueRule.prototype, "effectiveFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], RevenueRule.prototype, "effectiveTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], RevenueRule.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], RevenueRule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RevenueRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RevenueRule.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], RevenueRule.prototype, "description", void 0);
exports.RevenueRule = RevenueRule = __decorate([
    (0, typeorm_1.Entity)("revenue_rules")
], RevenueRule);
//# sourceMappingURL=revenue-rule.entity.js.map