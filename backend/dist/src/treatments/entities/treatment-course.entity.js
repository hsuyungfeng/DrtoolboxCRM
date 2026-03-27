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
exports.TreatmentCourse = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
const patient_entity_1 = require("../../patients/entities/patient.entity");
const treatment_session_entity_1 = require("./treatment-session.entity");
let TreatmentCourse = class TreatmentCourse {
    id;
    patientId;
    templateId;
    name;
    type;
    description;
    costPerSession;
    status = "active";
    purchaseDate;
    purchaseAmount;
    pointsRedeemed;
    actualPayment;
    clinicId;
    completedAt;
    createdAt;
    updatedAt;
    patient;
    sessions;
};
exports.TreatmentCourse = TreatmentCourse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 10,
        scale: 2,
        nullable: true,
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
    __metadata("design:type", Object)
], TreatmentCourse.prototype, "costPerSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "active" }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], TreatmentCourse.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 10,
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
], TreatmentCourse.prototype, "purchaseAmount", void 0);
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
], TreatmentCourse.prototype, "pointsRedeemed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 10,
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
], TreatmentCourse.prototype, "actualPayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentCourse.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Date)
], TreatmentCourse.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentCourse.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentCourse.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => patient_entity_1.Patient, { eager: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "patientId" }),
    __metadata("design:type", patient_entity_1.Patient)
], TreatmentCourse.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => treatment_session_entity_1.TreatmentSession, (session) => session.treatmentCourse),
    __metadata("design:type", Array)
], TreatmentCourse.prototype, "sessions", void 0);
exports.TreatmentCourse = TreatmentCourse = __decorate([
    (0, typeorm_1.Entity)("treatment_courses"),
    (0, typeorm_1.Index)(["clinicId", "patientId"]),
    (0, typeorm_1.Index)(["clinicId", "status"])
], TreatmentCourse);
//# sourceMappingURL=treatment-course.entity.js.map