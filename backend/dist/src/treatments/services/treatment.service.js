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
var TreatmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const treatment_entity_1 = require("../entities/treatment.entity");
let TreatmentService = TreatmentService_1 = class TreatmentService {
    treatmentRepository;
    eventEmitter;
    logger = new common_1.Logger(TreatmentService_1.name);
    constructor(treatmentRepository, eventEmitter) {
        this.treatmentRepository = treatmentRepository;
        this.eventEmitter = eventEmitter;
    }
    async create(createTreatmentDto) {
        const treatment = this.treatmentRepository.create(createTreatmentDto);
        const savedTreatment = await this.treatmentRepository.save(treatment);
        try {
            this.eventEmitter.emit("treatment.created", {
                treatmentId: savedTreatment.id,
                patientId: savedTreatment.patientId,
                clinicId: savedTreatment.clinicId,
            });
        }
        catch (error) {
            this.logger.warn(`Failed to emit treatment.created event: ${error.message}`);
        }
        return savedTreatment;
    }
    async findAll(clinicId) {
        return await this.treatmentRepository.find({
            where: { clinicId },
            order: { createdAt: "DESC" },
            relations: ["patient", "sessions", "staffAssignments"],
        });
    }
    async findOne(id) {
        const treatment = await this.treatmentRepository.findOne({
            where: { id },
            relations: ["patient", "sessions", "staffAssignments"],
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${id} not found`);
        }
        return treatment;
    }
    async update(id, updateTreatmentDto) {
        const treatment = await this.findOne(id);
        Object.assign(treatment, updateTreatmentDto);
        return await this.treatmentRepository.save(treatment);
    }
    async remove(id) {
        const treatment = await this.findOne(id);
        treatment.status = "cancelled";
        await this.treatmentRepository.save(treatment);
    }
    async findByPatientId(patientId) {
        return await this.treatmentRepository.find({
            where: { patientId },
            order: { createdAt: "DESC" },
            relations: ["sessions", "staffAssignments"],
        });
    }
    async updateCompletedSessions(id, completedSessions) {
        const treatment = await this.findOne(id);
        treatment.completedSessions = completedSessions;
        if (treatment.completedSessions >= treatment.totalSessions) {
            treatment.status = "completed";
            treatment.actualEndDate = new Date();
        }
        else if (treatment.completedSessions > 0) {
            treatment.status = "in_progress";
        }
        return await this.treatmentRepository.save(treatment);
    }
};
exports.TreatmentService = TreatmentService;
exports.TreatmentService = TreatmentService = TreatmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], TreatmentService);
//# sourceMappingURL=treatment.service.js.map