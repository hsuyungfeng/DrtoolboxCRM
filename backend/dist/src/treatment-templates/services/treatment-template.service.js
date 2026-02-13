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
var TreatmentTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const treatment_template_entity_1 = require("../entities/treatment-template.entity");
let TreatmentTemplateService = TreatmentTemplateService_1 = class TreatmentTemplateService {
    templateRepository;
    logger = new common_1.Logger(TreatmentTemplateService_1.name);
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async create(dto) {
        const template = this.templateRepository.create(dto);
        return this.templateRepository.save(template);
    }
    async findAll(clinicId) {
        return this.templateRepository.find({
            where: { clinicId, isActive: true },
            order: { createdAt: "DESC" },
        });
    }
    async findById(id, clinicId) {
        const template = await this.templateRepository.findOne({
            where: { id, clinicId },
        });
        if (!template) {
            throw new common_1.NotFoundException(`療法模板 ${id} 不存在`);
        }
        return template;
    }
    async update(id, clinicId, dto) {
        const template = await this.findById(id, clinicId);
        Object.assign(template, dto);
        return this.templateRepository.save(template);
    }
    async delete(id, clinicId) {
        const template = await this.findById(id, clinicId);
        template.isActive = false;
        await this.templateRepository.save(template);
    }
};
exports.TreatmentTemplateService = TreatmentTemplateService;
exports.TreatmentTemplateService = TreatmentTemplateService = TreatmentTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_template_entity_1.TreatmentTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TreatmentTemplateService);
//# sourceMappingURL=treatment-template.service.js.map