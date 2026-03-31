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
exports.TreatmentCourseTemplate = void 0;
const typeorm_1 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
let TreatmentCourseTemplate = class TreatmentCourseTemplate {
    id;
    name;
    description;
    totalSessions;
    totalPrice;
    stageConfig;
    clinicId;
    isActive = true;
    createdAt;
    updatedAt;
};
exports.TreatmentCourseTemplate = TreatmentCourseTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TreatmentCourseTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], TreatmentCourseTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TreatmentCourseTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], TreatmentCourseTemplate.prototype, "totalSessions", void 0);
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
], TreatmentCourseTemplate.prototype, "totalPrice", void 0);
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
                    return [];
                }
            },
        },
    }),
    __metadata("design:type", Array)
], TreatmentCourseTemplate.prototype, "stageConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], TreatmentCourseTemplate.prototype, "clinicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], TreatmentCourseTemplate.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentCourseTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TreatmentCourseTemplate.prototype, "updatedAt", void 0);
exports.TreatmentCourseTemplate = TreatmentCourseTemplate = __decorate([
    (0, typeorm_1.Entity)("treatment_course_templates"),
    (0, typeorm_1.Index)(["clinicId", "isActive"])
], TreatmentCourseTemplate);
//# sourceMappingURL=treatment-course-template.entity.js.map