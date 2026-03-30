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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentSessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_2 = require("typeorm");
const course_completed_event_1 = require("../../events/course-completed.event");
const treatment_session_entity_1 = require("../entities/treatment-session.entity");
const treatment_course_entity_1 = require("../entities/treatment-course.entity");
const staff_assignment_entity_1 = require("../entities/staff-assignment.entity");
const ppf_calculation_service_1 = require("./ppf-calculation.service");
const decimal_js_1 = __importDefault(require("decimal.js"));
let TreatmentSessionService = class TreatmentSessionService {
    sessionRepository;
    courseRepository;
    assignmentRepository;
    ppfCalculationService;
    eventEmitter;
    dataSource;
    constructor(sessionRepository, courseRepository, assignmentRepository, ppfCalculationService, eventEmitter, dataSource) {
        this.sessionRepository = sessionRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.ppfCalculationService = ppfCalculationService;
        this.eventEmitter = eventEmitter;
        this.dataSource = dataSource;
    }
    async updateSession(sessionId, updateDto, clinicId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, clinicId },
        });
        if (!session) {
            throw new common_1.NotFoundException(`療程次數不存在或診所 ID 不匹配 - sessionId: ${sessionId}`);
        }
        if (updateDto.scheduledDate !== undefined) {
            session.scheduledDate = updateDto.scheduledDate;
        }
        if (updateDto.therapistNotes !== undefined) {
            session.therapistNotes = updateDto.therapistNotes;
        }
        if (updateDto.patientFeedback !== undefined) {
            session.patientFeedback = updateDto.patientFeedback;
        }
        return await this.sessionRepository.save(session);
    }
    async completeSession(sessionId, updateDto, clinicId) {
        return await this.dataSource.transaction(async (manager) => {
            const session = await manager.findOne(treatment_session_entity_1.TreatmentSession, {
                where: { id: sessionId, clinicId },
                relations: ["treatmentCourse", "staffAssignments"],
            });
            if (!session) {
                throw new common_1.NotFoundException(`療程次數不存在或診所 ID 不匹配 - sessionId: ${sessionId}`);
            }
            if (session.completionStatus !== "pending") {
                throw new common_1.BadRequestException(`療程次數無法完成 - 當前狀態為 ${session.completionStatus}，只有 pending 狀態可以完成`);
            }
            if (updateDto.actualStartTime !== undefined) {
                session.actualStartTime = updateDto.actualStartTime;
            }
            if (updateDto.actualEndTime !== undefined) {
                session.actualEndTime = updateDto.actualEndTime;
            }
            if (updateDto.therapistNotes !== undefined) {
                session.therapistNotes = updateDto.therapistNotes;
            }
            if (updateDto.patientFeedback !== undefined) {
                session.patientFeedback = updateDto.patientFeedback;
            }
            session.completionStatus = "completed";
            if (updateDto.staffAssignments && updateDto.staffAssignments.length > 0) {
                this.ppfCalculationService.validateStaffAssignments(updateDto.staffAssignments);
                await manager.delete(staff_assignment_entity_1.StaffAssignment, { sessionId });
                const newAssignments = [];
                for (const assignmentDto of updateDto.staffAssignments) {
                    const assignment = new staff_assignment_entity_1.StaffAssignment();
                    assignment.sessionId = sessionId;
                    assignment.staffId = assignmentDto.staffId;
                    assignment.staffRole = assignmentDto.staffRole;
                    assignment.ppfPercentage = new decimal_js_1.default(assignmentDto.ppfPercentage);
                    newAssignments.push(assignment);
                }
                const courseWithSessions = await manager.findOne(treatment_course_entity_1.TreatmentCourse, {
                    where: { id: session.treatmentCourseId },
                    relations: ["sessions"],
                });
                if (!courseWithSessions) {
                    throw new common_1.NotFoundException(`療程套餐不存在 - courseId: ${session.treatmentCourseId}`);
                }
                const totalSessions = courseWithSessions.sessions?.length || 1;
                const paymentPerSession = courseWithSessions.actualPayment.dividedBy(totalSessions);
                const assignmentsWithPPF = await this.ppfCalculationService.distributeToStaff(sessionId, paymentPerSession, newAssignments);
                session.staffAssignments = assignmentsWithPPF;
            }
            const savedSession = await manager.save(treatment_session_entity_1.TreatmentSession, session);
            this.eventEmitter.emit("session.completed", {
                sessionId: savedSession.id,
                treatmentCourseId: savedSession.treatmentCourseId,
                patientId: session.treatmentCourse.patientId,
                completedAt: new Date(),
                staffAssignments: session.staffAssignments,
            });
            const allSessions = await manager.find(treatment_session_entity_1.TreatmentSession, {
                where: { treatmentCourseId: session.treatmentCourseId },
            });
            const completedCount = allSessions.filter((s) => s.completionStatus === "completed").length;
            if (completedCount === allSessions.length) {
                const course = await manager.findOne(treatment_course_entity_1.TreatmentCourse, {
                    where: { id: session.treatmentCourseId },
                });
                if (course) {
                    course.status = "completed";
                    course.completedAt = new Date();
                    await manager.save(treatment_course_entity_1.TreatmentCourse, course);
                    this.eventEmitter.emit('course.completed', new course_completed_event_1.CourseCompletedEvent(course.id, session.treatmentCourse.patientId, session.clinicId));
                }
            }
            return savedSession;
        });
    }
    async getStaffSessions(staffId, clinicId, filter) {
        const assignments = await this.assignmentRepository.find({
            where: { staffId },
            relations: ["session", "session.treatmentCourse"],
        });
        const sessions = assignments
            .map((a) => a.session)
            .filter((s) => s &&
            s.clinicId === clinicId &&
            (!filter?.status || s.completionStatus === filter.status) &&
            (!filter?.startDate || s.scheduledDate >= filter.startDate) &&
            (!filter?.endDate || s.scheduledDate <= filter.endDate));
        sessions.sort((a, b) => {
            const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
            const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
            return dateB - dateA;
        });
        return sessions;
    }
    async create(createTreatmentSessionDto) {
        const treatment = await this.courseRepository.findOne({
            where: {
                id: createTreatmentSessionDto.treatmentId,
                clinicId: createTreatmentSessionDto.clinicId,
            },
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${createTreatmentSessionDto.treatmentId} not found in clinic ${createTreatmentSessionDto.clinicId}`);
        }
        const session = this.sessionRepository.create(createTreatmentSessionDto);
        return await this.sessionRepository.save(session);
    }
    async findAllByTreatment(treatmentId, clinicId) {
        return await this.sessionRepository.find({
            where: { treatmentCourseId: treatmentId, clinicId },
            order: { sessionNumber: "ASC" },
            relations: ["treatmentCourse"],
        });
    }
    async findAllByClinic(clinicId) {
        return await this.sessionRepository.find({
            where: { clinicId },
            order: { createdAt: "DESC" },
            relations: ["treatmentCourse"],
        });
    }
    async findOne(id) {
        const session = await this.sessionRepository.findOne({
            where: { id },
            relations: ["treatmentCourse"],
        });
        if (!session) {
            throw new common_1.NotFoundException(`TreatmentSession with ID ${id} not found`);
        }
        return session;
    }
    async update(id, updateTreatmentSessionDto) {
        const session = await this.findOne(id);
        if (updateTreatmentSessionDto.status === "completed" &&
            !session.actualStartTime) {
            session.actualStartTime = new Date();
        }
        Object.assign(session, updateTreatmentSessionDto);
        return await this.sessionRepository.save(session);
    }
    async remove(id) {
        const session = await this.findOne(id);
        session.completionStatus = "cancelled";
        await this.sessionRepository.save(session);
    }
    async findByStatus(clinicId, status) {
        return await this.sessionRepository.find({
            where: { clinicId, completionStatus: status },
            order: { scheduledDate: "ASC" },
            relations: ["treatmentCourse"],
        });
    }
    async findUpcomingSessions(clinicId, days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        return await this.sessionRepository
            .createQueryBuilder("session")
            .where("session.clinicId = :clinicId", { clinicId })
            .andWhere("session.scheduledDate >= :startDate", { startDate })
            .andWhere("session.scheduledDate <= :endDate", { endDate })
            .andWhere("session.completionStatus IN (:...statuses)", {
            statuses: ["pending", "in_progress"],
        })
            .orderBy("session.scheduledDate", "ASC")
            .leftJoinAndSelect("session.treatmentCourse", "treatmentCourse")
            .getMany();
    }
    async completeSessionLegacy(id, notes, observations) {
        const session = await this.sessionRepository.findOne({
            where: { id },
            relations: ["treatmentCourse"],
        });
        if (!session) {
            throw new common_1.NotFoundException(`TreatmentSession with ID ${id} not found`);
        }
        session.completionStatus = "completed";
        session.actualStartTime = new Date();
        if (notes)
            session.therapistNotes = notes;
        if (observations)
            session.patientFeedback = observations;
        return await this.sessionRepository.save(session);
    }
};
exports.TreatmentSessionService = TreatmentSessionService;
exports.TreatmentSessionService = TreatmentSessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_session_entity_1.TreatmentSession)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_course_entity_1.TreatmentCourse)),
    __param(2, (0, typeorm_1.InjectRepository)(staff_assignment_entity_1.StaffAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ppf_calculation_service_1.PPFCalculationService,
        event_emitter_1.EventEmitter2,
        typeorm_2.DataSource])
], TreatmentSessionService);
//# sourceMappingURL=treatment-session.service.js.map