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
exports.PatientController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clinic_context_guard_1 = require("../../common/guards/clinic-context.guard");
const patient_service_1 = require("../services/patient.service");
const patient_search_service_1 = require("../services/patient-search.service");
const create_patient_dto_1 = require("../dto/create-patient.dto");
const update_patient_dto_1 = require("../dto/update-patient.dto");
let PatientController = class PatientController {
    patientService;
    patientSearchService;
    constructor(patientService, patientSearchService) {
        this.patientService = patientService;
        this.patientSearchService = patientSearchService;
    }
    async search(keyword, limit = 20, req) {
        const patients = await this.patientSearchService.searchPatients(keyword, req.clinicId, Number(limit));
        return {
            statusCode: 200,
            data: patients,
            count: patients.length,
        };
    }
    async identify(idNumber, name, req) {
        const patient = await this.patientSearchService.identifyPatientByIdAndName(idNumber, name, req.clinicId);
        return {
            statusCode: 200,
            data: patient,
        };
    }
    async findOne(id, req) {
        const patient = await this.patientSearchService.getPatientProfile(id, req.clinicId);
        return {
            statusCode: 200,
            data: patient,
        };
    }
    async create(dto, req) {
        const patient = await this.patientService.createPatient(dto, req.clinicId);
        return {
            statusCode: 201,
            message: '患者已建立',
            data: patient,
        };
    }
    async update(id, dto, req) {
        const patient = await this.patientService.updatePatient(id, dto, req.clinicId);
        return {
            statusCode: 200,
            message: '患者資料已更新',
            data: patient,
        };
    }
    async findAll(page = 1, pageSize = 20, req) {
        const result = await this.patientSearchService.getClinicPatients(req.clinicId, Number(page), Number(pageSize));
        return {
            statusCode: 200,
            data: result.data,
            pagination: {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
            },
        };
    }
};
exports.PatientController = PatientController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜尋患者（關鍵字匹配身份證ID或姓名）' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', description: '搜尋關鍵字' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '回傳筆數上限（預設 20）' }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('identify'),
    (0, swagger_1.ApiOperation)({ summary: '雙重驗證患者身份（身份證ID + 姓名）' }),
    (0, swagger_1.ApiQuery)({ name: 'idNumber', description: '身份證號碼' }),
    (0, swagger_1.ApiQuery)({ name: 'name', description: '患者姓名' }),
    __param(0, (0, common_1.Query)('idNumber')),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "identify", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '取得患者詳情（含療程紀錄）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '建立新患者' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_patient_dto_1.CreatePatientDto, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新患者資料' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_patient_dto_1.UpdatePatientDto, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分頁列舉診所患者' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '頁數（預設 1）' }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, description: '每頁筆數（預設 20）' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "findAll", null);
exports.PatientController = PatientController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiTags)('Patients'),
    (0, common_1.Controller)('api/patients'),
    (0, common_1.UseGuards)(clinic_context_guard_1.ClinicContextGuard),
    __metadata("design:paramtypes", [patient_service_1.PatientService,
        patient_search_service_1.PatientSearchService])
], PatientController);
//# sourceMappingURL=patient.controller.js.map