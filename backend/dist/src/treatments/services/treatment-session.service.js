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
exports.TreatmentSessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_2 = require("typeorm");
const treatment_session_entity_1 = require("../entities/treatment-session.entity");
const treatment_entity_1 = require("../entities/treatment.entity");
const session_completed_event_1 = require("../../events/session-completed.event");
const treatment_completed_event_1 = require("../../events/treatment-completed.event");
let TreatmentSessionService = class TreatmentSessionService {
    treatmentSessionRepository;
    treatmentRepository;
    eventEmitter;
    constructor(treatmentSessionRepository, treatmentRepository, eventEmitter) {
        this.treatmentSessionRepository = treatmentSessionRepository;
        this.treatmentRepository = treatmentRepository;
        this.eventEmitter = eventEmitter;
    }
    async create(createTreatmentSessionDto) {
        const treatment = await this.treatmentRepository.findOne({
            where: {
                id: createTreatmentSessionDto.treatmentId,
                clinicId: createTreatmentSessionDto.clinicId,
            },
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${createTreatmentSessionDto.treatmentId} not found in clinic ${createTreatmentSessionDto.clinicId}`);
        }
        const session = this.treatmentSessionRepository.create(createTreatmentSessionDto);
        return await this.treatmentSessionRepository.save(session);
    }
    async findAllByTreatment(treatmentId, clinicId) {
        return await this.treatmentSessionRepository.find({
            where: { treatmentId, clinicId },
            order: { sessionIndex: "ASC" },
            relations: ["treatment"],
        });
    }
    async findAllByClinic(clinicId) {
        return await this.treatmentSessionRepository.find({
            where: { clinicId },
            order: { createdAt: "DESC" },
            relations: ["treatment"],
        });
    }
    async findOne(id) {
        const session = await this.treatmentSessionRepository.findOne({
            where: { id },
            relations: ["treatment"],
        });
        if (!session) {
            throw new common_1.NotFoundException(`TreatmentSession with ID ${id} not found`);
        }
        return session;
    }
    async update(id, updateTreatmentSessionDto) {
        const session = await this.findOne(id);
        if (updateTreatmentSessionDto.status === "completed" &&
            !session.actualTime) {
            session.actualTime = new Date();
        }
        Object.assign(session, updateTreatmentSessionDto);
        return await this.treatmentSessionRepository.save(session);
    }
    async remove(id) {
        const session = await this.findOne(id);
        session.status = "cancelled";
        await this.treatmentSessionRepository.save(session);
    }
    async completeSession(id, notes, observations) {
        const session = await this.findOne(id);
        session.status = "completed";
        session.actualTime = new Date();
        if (notes)
            session.notes = notes;
        if (observations)
            session.observations = observations;
        const savedSession = await this.treatmentSessionRepository.save(session);
        this.eventEmitter.emit("session.completed", new session_completed_event_1.SessionCompletedEvent(savedSession.id, savedSession.treatmentId, savedSession.clinicId, savedSession.actualTime));
        await this.updateTreatmentCompletionStatus(savedSession.treatmentId, savedSession.clinicId);
        return savedSession;
    }
    async findByStatus(clinicId, status) {
        return await this.treatmentSessionRepository.find({
            where: { clinicId, status },
            order: { scheduledTime: "ASC" },
            relations: ["treatment"],
        });
    }
    async findUpcomingSessions(clinicId, days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        return await this.treatmentSessionRepository
            .createQueryBuilder("session")
            .where("session.clinicId = :clinicId", { clinicId })
            .andWhere("session.scheduledTime >= :startDate", { startDate })
            .andWhere("session.scheduledTime <= :endDate", { endDate })
            .andWhere("session.status IN (:...statuses)", {
            statuses: ["scheduled", "in_progress"],
        })
            .orderBy("session.scheduledTime", "ASC")
            .leftJoinAndSelect("session.treatment", "treatment")
            .getMany();
    }
    async updateTreatmentCompletionStatus(treatmentId, clinicId) {
        const treatment = await this.treatmentRepository.findOne({
            where: { id: treatmentId, clinicId },
            relations: ["sessions"],
        });
        if (!treatment) {
            return;
        }
        const completedSessions = treatment.sessions?.filter((s) => s.status === "completed").length || 0;
        treatment.completedSessions = completedSessions;
        const allSessionsCompleted = completedSessions >= treatment.totalSessions;
        if (allSessionsCompleted && treatment.status !== "completed") {
            treatment.status = "completed";
            treatment.actualEndDate = new Date();
            await this.treatmentRepository.save(treatment);
            this.eventEmitter.emit("treatment.completed", new treatment_completed_event_1.TreatmentCompletedEvent(treatment.id, treatment.clinicId, treatment.actualEndDate));
        }
        else {
            await this.treatmentRepository.save(treatment);
        }
    }
};
exports.TreatmentSessionService = TreatmentSessionService;
exports.TreatmentSessionService = TreatmentSessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_session_entity_1.TreatmentSession)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], TreatmentSessionService);
//# sourceMappingURL=treatment-session.service.js.map