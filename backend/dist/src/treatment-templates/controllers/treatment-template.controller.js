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
exports.TreatmentTemplateController = void 0;
const common_1 = require("@nestjs/common");
const treatment_template_service_1 = require("../services/treatment-template.service");
const create_treatment_template_dto_1 = require("../dto/create-treatment-template.dto");
const update_treatment_template_dto_1 = require("../dto/update-treatment-template.dto");
let TreatmentTemplateController = class TreatmentTemplateController {
    templateService;
    constructor(templateService) {
        this.templateService = templateService;
    }
    async create(dto) {
        return this.templateService.create(dto);
    }
    async findAll(clinicId) {
        return this.templateService.findAll(clinicId);
    }
    async findById(id, clinicId) {
        return this.templateService.findById(id, clinicId);
    }
    async update(id, clinicId, dto) {
        return this.templateService.update(id, clinicId, dto);
    }
    async delete(id, clinicId) {
        return this.templateService.delete(id, clinicId);
    }
};
exports.TreatmentTemplateController = TreatmentTemplateController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_treatment_template_dto_1.CreateTreatmentTemplateDto]),
    __metadata("design:returntype", Promise)
], TreatmentTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentTemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreatmentTemplateController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("clinicId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_treatment_template_dto_1.UpdateTreatmentTemplateDto]),
    __metadata("design:returntype", Promise)
], TreatmentTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("clinicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreatmentTemplateController.prototype, "delete", null);
exports.TreatmentTemplateController = TreatmentTemplateController = __decorate([
    (0, common_1.Controller)("treatment-templates"),
    __metadata("design:paramtypes", [treatment_template_service_1.TreatmentTemplateService])
], TreatmentTemplateController);
//# sourceMappingURL=treatment-template.controller.js.map