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
exports.PatientService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const patient_entity_1 = require("../entities/patient.entity");
const patient_search_service_1 = require("./patient-search.service");
let PatientService = class PatientService {
    patientRepository;
    patientSearchService;
    constructor(patientRepository, patientSearchService) {
        this.patientRepository = patientRepository;
        this.patientSearchService = patientSearchService;
    }
    async createPatient(dto, clinicId) {
        const available = await this.patientSearchService.validateIdNumberAvailability(dto.idNumber, clinicId);
        if (!available) {
            throw new common_1.BadRequestException(`身份證ID「${dto.idNumber}」已存在於本診所，請確認是否重複建檔`);
        }
        const patient = this.patientRepository.create({
            ...dto,
            clinicId,
            status: "active",
        });
        return this.patientRepository.save(patient);
    }
    async updatePatient(patientId, dto, clinicId) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId, clinicId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`患者不存在或不屬於本診所（ID: ${patientId}）`);
        }
        if (dto.idNumber && dto.idNumber !== patient.idNumber) {
            const available = await this.patientSearchService.validateIdNumberAvailability(dto.idNumber, clinicId);
            if (!available) {
                throw new common_1.BadRequestException(`新身份證ID「${dto.idNumber}」已存在於本診所`);
            }
        }
        const { clinicId: _ignored, ...safeDto } = dto;
        void _ignored;
        Object.assign(patient, safeDto);
        return this.patientRepository.save(patient);
    }
    async create(createPatientDto) {
        const patient = this.patientRepository.create(createPatientDto);
        return await this.patientRepository.save(patient);
    }
    async findAll(clinicId) {
        return await this.patientRepository.find({
            where: { clinicId },
            order: { createdAt: "DESC" },
        });
    }
    async findOne(id) {
        const patient = await this.patientRepository.findOne({
            where: { id },
            relations: ["treatmentCourses"],
        });
        if (!patient) {
            throw new common_1.NotFoundException(`患者不存在（ID: ${id}）`);
        }
        return patient;
    }
    async update(id, updatePatientDto) {
        const patient = await this.findOne(id);
        Object.assign(patient, updatePatientDto);
        return await this.patientRepository.save(patient);
    }
    async remove(id) {
        const patient = await this.findOne(id);
        patient.status = "inactive";
        await this.patientRepository.save(patient);
    }
};
exports.PatientService = PatientService;
exports.PatientService = PatientService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        patient_search_service_1.PatientSearchService])
], PatientService);
//# sourceMappingURL=patient.service.js.map