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
const treatment_staff_assignment_entity_1 = require("../../staff/entities/treatment-staff-assignment.entity");
let TreatmentService = TreatmentService_1 = class TreatmentService {
    treatmentRepository;
    staffAssignmentRepository;
    eventEmitter;
    logger = new common_1.Logger(TreatmentService_1.name);
    constructor(treatmentRepository, staffAssignmentRepository, eventEmitter) {
        this.treatmentRepository = treatmentRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.eventEmitter = eventEmitter;
    }
    async create(createTreatmentDto) {
        const { staffAssignments, ...treatmentData } = createTreatmentDto;
        const treatment = this.treatmentRepository.create(treatmentData);
        const savedTreatment = await this.treatmentRepository.save(treatment);
        if (staffAssignments && staffAssignments.length > 0) {
            for (const assignment of staffAssignments) {
                const staffAssignment = this.staffAssignmentRepository.create({
                    treatmentId: savedTreatment.id,
                    staffId: assignment.staffId,
                    role: assignment.role,
                    revenuePercentage: assignment.revenuePercentage || 0,
                    isActive: true,
                });
                await this.staffAssignmentRepository.save(staffAssignment);
            }
        }
        try {
            this.eventEmitter.emit("treatment.created", {
                treatmentId: savedTreatment.id,
                patientId: savedTreatment.patientId,
                clinicId: savedTreatment.clinicId,
                staffAssignments: staffAssignments?.length || 0,
            });
        }
        catch (error) {
            this.logger.warn(`Failed to emit treatment.created event: ${error.message}`);
        }
        return await this.findOne(savedTreatment.id);
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
    async addStaffAssignment(treatmentId, assignmentData) {
        await this.findOne(treatmentId);
        const assignment = this.staffAssignmentRepository.create({
            treatmentId,
            staffId: assignmentData.staffId,
            role: assignmentData.role,
            revenuePercentage: assignmentData.revenuePercentage || 0,
            isActive: true,
        });
        return await this.staffAssignmentRepository.save(assignment);
    }
    async getStaffAssignments(treatmentId) {
        return await this.staffAssignmentRepository.find({
            where: { treatmentId, isActive: true },
            relations: ["staff"],
        });
    }
    async removeStaffAssignment(treatmentId, assignmentId) {
        const assignment = await this.staffAssignmentRepository.findOne({
            where: { id: assignmentId, treatmentId },
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Staff assignment ${assignmentId} not found`);
        }
        assignment.isActive = false;
        await this.staffAssignmentRepository.save(assignment);
    }
    async updateStaffAssignment(treatmentId, assignmentId, updateData) {
        const assignment = await this.staffAssignmentRepository.findOne({
            where: { id: assignmentId, treatmentId },
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Staff assignment ${assignmentId} not found`);
        }
        Object.assign(assignment, updateData);
        return await this.staffAssignmentRepository.save(assignment);
    }
};
exports.TreatmentService = TreatmentService;
exports.TreatmentService = TreatmentService = TreatmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_staff_assignment_entity_1.TreatmentStaffAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], TreatmentService);
//# sourceMappingURL=treatment.service.js.map