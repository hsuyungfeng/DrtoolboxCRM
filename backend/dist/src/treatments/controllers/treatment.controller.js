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
exports.TreatmentController = void 0;
const common_1 = require("@nestjs/common");
const treatment_service_1 = require("../services/treatment.service");
const create_treatment_dto_1 = require("../dto/create-treatment.dto");
const update_treatment_dto_1 = require("../dto/update-treatment.dto");
let TreatmentController = class TreatmentController {
    treatmentService;
    constructor(treatmentService) {
        this.treatmentService = treatmentService;
    }
    create(createTreatmentDto) {
        return this.treatmentService.create(createTreatmentDto);
    }
    findAll(clinicId) {
        return this.treatmentService.findAll(clinicId);
    }
    findByPatientId(patientId) {
        return this.treatmentService.findByPatientId(patientId);
    }
    findOne(id) {
        return this.treatmentService.findOne(id);
    }
    update(id, updateTreatmentDto) {
        return this.treatmentService.update(id, updateTreatmentDto);
    }
    updateCompletedSessions(id, completedSessions) {
        return this.treatmentService.updateCompletedSessions(id, completedSessions);
    }
    remove(id) {
        return this.treatmentService.remove(id);
    }
};
exports.TreatmentController = TreatmentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_treatment_dto_1.CreateTreatmentDto]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("patient/:patientId"),
    __param(0, (0, common_1.Param)("patientId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "findByPatientId", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_treatment_dto_1.UpdateTreatmentDto]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/complete-sessions"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("completedSessions")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "updateCompletedSessions", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "remove", null);
exports.TreatmentController = TreatmentController = __decorate([
    (0, common_1.Controller)("treatments"),
    __metadata("design:paramtypes", [treatment_service_1.TreatmentService])
], TreatmentController);
//# sourceMappingURL=treatment.controller.js.map