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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffAssignment = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
const treatment_session_entity_1 = require("./treatment-session.entity");
let StaffAssignment = class StaffAssignment {
    id;
    sessionId;
    staffId;
    staffRole;
    ppfPercentage;
    ppfAmount;
    createdAt;
    updatedAt;
    session;
};
exports.StaffAssignment = StaffAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StaffAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], StaffAssignment.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], StaffAssignment.prototype, "staffId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], StaffAssignment.prototype, "staffRole", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 5,
        scale: 2,
        transformer: {
            to: (value) => {
                if (value === null || value === undefined)
                    return null;
                return value instanceof decimal_js_1.default ? value.toString() : String(value);
            },
            from: (value) => {
                if (value === null || value === undefined)
                    return null;
                return new decimal_js_1.default(value);
            },
        },
    }),
    __metadata("design:type", decimal_js_1.default)
], StaffAssignment.prototype, "ppfPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value) => {
                if (value === null || value === undefined)
                    return null;
                return value instanceof decimal_js_1.default ? value.toString() : String(value);
            },
            from: (value) => {
                if (value === null || value === undefined)
                    return null;
                return new decimal_js_1.default(value);
            },
        },
    }),
    __metadata("design:type", decimal_js_1.default)
], StaffAssignment.prototype, "ppfAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StaffAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StaffAssignment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_session_entity_1.TreatmentSession, (session) => session.staffAssignments),
    (0, typeorm_1.JoinColumn)({ name: "sessionId" }),
    __metadata("design:type", treatment_session_entity_1.TreatmentSession)
], StaffAssignment.prototype, "session", void 0);
exports.StaffAssignment = StaffAssignment = __decorate([
    (0, typeorm_1.Entity)("staff_assignments"),
    (0, typeorm_1.Index)(["sessionId", "staffId"])
], StaffAssignment);
//# sourceMappingURL=staff-assignment.entity.js.map