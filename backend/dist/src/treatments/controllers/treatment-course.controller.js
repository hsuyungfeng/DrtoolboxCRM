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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffSessionController = exports.TreatmentCourseController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const treatment_course_service_1 = require("../services/treatment-course.service");
const treatment_session_service_1 = require("../services/treatment-session.service");
const treatment_course_template_service_1 = require("../services/treatment-course-template.service");
const create_treatment_course_dto_1 = require("../dto/create-treatment-course.dto");
const update_treatment_session_dto_1 = require("../dto/update-treatment-session.dto");
let TreatmentCourseController = class TreatmentCourseController {
    courseService;
    sessionService;
    templateService;
    constructor(courseService, sessionService, templateService) {
        this.courseService = courseService;
        this.sessionService = sessionService;
        this.templateService = templateService;
    }
    async createCourse(createDto) {
        return await this.courseService.createCourse(createDto);
    }
    async getPatientCourses(patientId, clinicId) {
        if (!patientId || patientId.trim() === "") {
            throw new common_1.BadRequestException("patientId 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        return await this.courseService.getPatientCourses(patientId, clinicId);
    }
    async getCourseById(courseId, clinicId) {
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        return await this.courseService.getCourseById(courseId, clinicId);
    }
    async getActiveTemplates(clinicId) {
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        return await this.templateService.getActiveTemplates(clinicId);
    }
    async completeSession(sessionId, updateDto, clinicId) {
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        return await this.sessionService.completeSession(sessionId, updateDto, clinicId);
    }
};
exports.TreatmentCourseController = TreatmentCourseController;
__decorate([
    (0, common_1.Post)("courses"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_treatment_course_dto_1.CreateTreatmentCourseDto]),
    __metadata("design:returntype", Promise)
], TreatmentCourseController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("patientId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreatmentCourseController.prototype, "getPatientCourses", null);
__decorate([
    (0, common_1.Get)("courses/:courseId"),
    __param(0, (0, common_1.Param)("courseId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreatmentCourseController.prototype, "getCourseById", null);
__decorate([
    (0, common_1.Get)("templates"),
    __param(0, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentCourseController.prototype, "getActiveTemplates", null);
__decorate([
    (0, common_1.Put)("sessions/:sessionId"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_treatment_session_dto_1.UpdateTreatmentSessionDto, String]),
    __metadata("design:returntype", Promise)
], TreatmentCourseController.prototype, "completeSession", null);
exports.TreatmentCourseController = TreatmentCourseController = __decorate([
    (0, common_1.Controller)("treatments"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [treatment_course_service_1.TreatmentCourseService,
        treatment_session_service_1.TreatmentSessionService,
        treatment_course_template_service_1.TreatmentCourseTemplateService])
], TreatmentCourseController);
let StaffSessionController = class StaffSessionController {
    sessionService;
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async getStaffSessions(staffId, clinicId, status, startDate, endDate) {
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (startDate) {
            filter.startDate = new Date(startDate);
        }
        if (endDate) {
            filter.endDate = new Date(endDate);
        }
        return await this.sessionService.getStaffSessions(staffId, clinicId, Object.keys(filter).length > 0 ? filter : undefined);
    }
};
exports.StaffSessionController = StaffSessionController;
__decorate([
    (0, common_1.Get)(":staffId/sessions"),
    __param(0, (0, common_1.Param)("staffId")),
    __param(1, (0, common_1.Query)("clinicId")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("startDate")),
    __param(4, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], StaffSessionController.prototype, "getStaffSessions", null);
exports.StaffSessionController = StaffSessionController = __decorate([
    (0, common_1.Controller)("staff"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [treatment_session_service_1.TreatmentSessionService])
], StaffSessionController);
//# sourceMappingURL=treatment-course.controller.js.map