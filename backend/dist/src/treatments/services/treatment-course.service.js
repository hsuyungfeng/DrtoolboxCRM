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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TreatmentCourseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentCourseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const treatment_course_entity_1 = require("../entities/treatment-course.entity");
const treatment_session_entity_1 = require("../entities/treatment-session.entity");
const treatment_course_template_service_1 = require("./treatment-course-template.service");
const points_service_1 = require("../../points/services/points.service");
const decimal_js_1 = __importDefault(require("decimal.js"));
let TreatmentCourseService = TreatmentCourseService_1 = class TreatmentCourseService {
    courseRepository;
    sessionRepository;
    templateService;
    pointsService;
    dataSource;
    logger = new common_1.Logger(TreatmentCourseService_1.name);
    constructor(courseRepository, sessionRepository, templateService, pointsService, dataSource) {
        this.courseRepository = courseRepository;
        this.sessionRepository = sessionRepository;
        this.templateService = templateService;
        this.pointsService = pointsService;
        this.dataSource = dataSource;
    }
    async createCourse(dto) {
        this.validateCreateCourseInput(dto);
        const template = await this.templateService.getTemplateById(dto.templateId, dto.clinicId);
        if (!template) {
            this.logger.warn(`模板不存在 - templateId: ${dto.templateId}, clinicId: ${dto.clinicId}`);
            throw new common_1.NotFoundException("課程模板不存在");
        }
        const pointsRedeemed = new decimal_js_1.default(dto.pointsToRedeem || 0);
        const totalPrice = new decimal_js_1.default(template.totalPrice);
        if (pointsRedeemed.greaterThan(totalPrice)) {
            throw new common_1.BadRequestException("點數抵扣金額不能超過套餐價格");
        }
        const actualPayment = totalPrice.minus(pointsRedeemed);
        const course = await this.dataSource.transaction(async (manager) => {
            const newCourse = new treatment_course_entity_1.TreatmentCourse();
            newCourse.patientId = dto.patientId;
            newCourse.templateId = dto.templateId;
            newCourse.status = "active";
            newCourse.purchaseDate = new Date();
            newCourse.purchaseAmount = totalPrice;
            newCourse.pointsRedeemed = pointsRedeemed;
            newCourse.actualPayment = actualPayment;
            newCourse.clinicId = dto.clinicId;
            const savedCourse = await manager.save(newCourse);
            const sessionPrice = actualPayment.dividedBy(template.totalSessions);
            for (let i = 1; i <= template.totalSessions; i++) {
                const session = new treatment_session_entity_1.TreatmentSession();
                session.treatmentCourseId = savedCourse.id;
                session.sessionNumber = i;
                session.completionStatus = "pending";
                session.sessionPrice = sessionPrice;
                session.clinicId = dto.clinicId;
                await manager.save(session);
            }
            this.logger.log(`成功建立療程套餐 - courseId: ${savedCourse.id}, patientId: ${dto.patientId}, 生成 ${template.totalSessions} 個 sessions`);
            return savedCourse;
        });
        if (pointsRedeemed.greaterThan(0)) {
            try {
                await this.pointsService.redeemPoints(dto.patientId, pointsRedeemed.toNumber(), dto.clinicId, course.id);
                this.logger.log(`成功兌換點數 - courseId: ${course.id}, patientId: ${dto.patientId}, points: ${pointsRedeemed.toString()}`);
            }
            catch (error) {
                this.logger.error(`點數兌換失敗 - courseId: ${course.id}, patientId: ${dto.patientId}, error: ${error instanceof Error ? error.message : "unknown"}`);
                throw error;
            }
        }
        return course;
    }
    async getCourseById(courseId, clinicId) {
        if (!courseId || courseId.trim() === "") {
            throw new common_1.BadRequestException("courseId 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        const course = await this.courseRepository.findOne({
            where: { id: courseId, clinicId },
            relations: ["sessions", "sessions.staffAssignments"],
        });
        if (!course) {
            this.logger.warn(`療程不存在 - courseId: ${courseId}, clinicId: ${clinicId}`);
            throw new common_1.NotFoundException("療程不存在");
        }
        return course;
    }
    async getPatientCourses(patientId, clinicId) {
        if (!patientId || patientId.trim() === "") {
            throw new common_1.BadRequestException("patientId 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        const courses = await this.courseRepository.find({
            where: { patientId, clinicId },
            relations: ["sessions", "sessions.staffAssignments"],
            order: { createdAt: "DESC" },
        });
        this.logger.log(`查詢患者療程 - patientId: ${patientId}, clinicId: ${clinicId}, count: ${courses.length}`);
        return courses;
    }
    async updateCourseStatus(courseId, clinicId, status) {
        if (!courseId || courseId.trim() === "") {
            throw new common_1.BadRequestException("courseId 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
        const validStatuses = ["active", "completed", "abandoned"];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException("無效的課程狀態");
        }
        const course = await this.getCourseById(courseId, clinicId);
        course.status = status;
        if (status === "completed") {
            course.completedAt = new Date();
        }
        const result = await this.courseRepository.save(course);
        if (!result) {
            this.logger.error(`更新課程狀態失敗 - courseId: ${courseId}, status: ${status}`);
            throw new common_1.BadRequestException("更新課程狀態失敗");
        }
        this.logger.log(`成功更新課程狀態 - courseId: ${courseId}, status: ${status}`);
        return result;
    }
    validateCreateCourseInput(dto) {
        if (!dto.patientId || dto.patientId.trim() === "") {
            throw new common_1.BadRequestException("patientId 不能為空");
        }
        if (!dto.templateId || dto.templateId.trim() === "") {
            throw new common_1.BadRequestException("templateId 不能為空");
        }
        if (!dto.clinicId || dto.clinicId.trim() === "") {
            throw new common_1.BadRequestException("clinicId 不能為空");
        }
    }
};
exports.TreatmentCourseService = TreatmentCourseService;
exports.TreatmentCourseService = TreatmentCourseService = TreatmentCourseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_course_entity_1.TreatmentCourse)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_session_entity_1.TreatmentSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        treatment_course_template_service_1.TreatmentCourseTemplateService,
        points_service_1.PointsService,
        typeorm_2.DataSource])
], TreatmentCourseService);
//# sourceMappingURL=treatment-course.service.js.map