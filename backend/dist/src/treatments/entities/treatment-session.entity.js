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
exports.TreatmentSession = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
const treatment_entity_1 = require("./treatment.entity");
const treatment_course_entity_1 = require("./treatment-course.entity");
const staff_assignment_entity_1 = require("./staff-assignment.entity");
let TreatmentSession = class TreatmentSession {
    id;
    treatmentId;
    treatment;
    treatmentCourseId;
    treatmentCourse;
    sessionIndex;
    sessionNumber;
    scheduledDate;
    scheduledTime;
    actualTime;
    status;
    completionStatus;
    notes;
    observations;
    therapistNotes;
    patientFeedback;
    durationMinutes;
    sessionPrice;
    revenueCalculated;
    actualStartTime;
    actualEndTime;
    executedBy;
    clinicId;
    createdAt;
    updatedAt;
    staffAssignments;
};
exports.TreatmentSession = TreatmentSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TreatmentSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "treatmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_entity_1.Treatment, (treatment) => treatment.sessions),
    (0, typeorm_1.JoinColumn)({ name: "treatmentId" }),
    __metadata("design:type", treatment_entity_1.Treatment)
], TreatmentSession.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "treatmentCourseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => treatment_course_entity_1.TreatmentCourse, (course) => course.sessions),
    (0, typeorm_1.JoinColumn)({ name: "treatmentCourseId" }),
    __metadata("design:type", treatment_course_entity_1.TreatmentCourse)
], TreatmentSession.prototype, "treatmentCourse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], TreatmentSession.prototype, "sessionIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], TreatmentSession.prototype, "sessionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "scheduledDate", void 0);
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
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "completionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "therapistNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "patientFeedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TreatmentSession.prototype, "durationMinutes", void 0);
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
    __metadata("design:type", decimal_js_1.default)
], TreatmentSession.prototype, "sessionPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], TreatmentSession.prototype, "revenueCalculated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "actualStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], TreatmentSession.prototype, "actualEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", String)
], TreatmentSession.prototype, "executedBy", void 0);
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
__decorate([
    (0, typeorm_1.OneToMany)(() => staff_assignment_entity_1.StaffAssignment, (assignment) => assignment.session),
    __metadata("design:type", Array)
], TreatmentSession.prototype, "staffAssignments", void 0);
exports.TreatmentSession = TreatmentSession = __decorate([
    (0, typeorm_1.Entity)("treatment_sessions"),
    (0, typeorm_1.Index)(["treatmentCourseId", "sessionNumber"]),
    (0, typeorm_1.Index)(["clinicId", "completionStatus"]),
    (0, typeorm_1.Index)(["clinicId", "scheduledDate"])
], TreatmentSession);
//# sourceMappingURL=treatment-session.entity.js.map