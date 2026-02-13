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
exports.TreatmentCourseTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const treatment_course_template_entity_1 = require("../entities/treatment-course-template.entity");
const decimal_js_1 = __importDefault(require("decimal.js"));
let TreatmentCourseTemplateService = class TreatmentCourseTemplateService {
    templateRepository;
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async getActiveTemplates(clinicId) {
        return this.templateRepository.find({
            where: { clinicId, isActive: true },
            order: { createdAt: "DESC" },
        });
    }
    async getTemplateById(templateId, clinicId) {
        return this.templateRepository.findOne({
            where: { id: templateId, clinicId },
        });
    }
    async createTemplate(data) {
        if (!data.clinicId || data.clinicId.trim() === "") {
            throw new common_1.BadRequestException("診所 ID (clinicId) 不能為空");
        }
        if (!data.name || data.name.trim() === "") {
            throw new common_1.BadRequestException("模板名稱 (name) 不能為空");
        }
        if (!data.totalSessions || data.totalSessions <= 0) {
            throw new common_1.BadRequestException("總療程次數 (totalSessions) 必須大於 0");
        }
        if (!data.totalPrice ||
            (data.totalPrice instanceof decimal_js_1.default
                ? data.totalPrice.isZero() || data.totalPrice.isNegative()
                : Number(data.totalPrice) <= 0)) {
            throw new common_1.BadRequestException("套餐價格 (totalPrice) 必須大於 0");
        }
        if (!data.stageConfig ||
            !Array.isArray(data.stageConfig) ||
            data.stageConfig.length === 0) {
            throw new common_1.BadRequestException("階段配置 (stageConfig) 不能為空");
        }
        try {
            return await this.templateRepository.save(data);
        }
        catch (error) {
            throw new common_1.BadRequestException(`創建模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`);
        }
    }
    async updateTemplate(templateId, clinicId, data) {
        if (!templateId || templateId.trim() === "") {
            throw new common_1.BadRequestException("模板 ID (templateId) 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("診所 ID (clinicId) 不能為空");
        }
        const existingTemplate = await this.getTemplateById(templateId, clinicId);
        if (!existingTemplate) {
            throw new common_1.NotFoundException(`模板不存在 (ID: ${templateId}, 診所: ${clinicId})`);
        }
        try {
            const result = await this.templateRepository.update({ id: templateId, clinicId }, data);
            if (result.affected === 0) {
                throw new common_1.NotFoundException("模板更新失敗或不存在");
            }
            const updated = await this.getTemplateById(templateId, clinicId);
            if (!updated) {
                throw new common_1.NotFoundException("更新後的模板無法檢索");
            }
            return updated;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`更新模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`);
        }
    }
    async deleteTemplate(templateId, clinicId) {
        if (!templateId || templateId.trim() === "") {
            throw new common_1.BadRequestException("模板 ID (templateId) 不能為空");
        }
        if (!clinicId || clinicId.trim() === "") {
            throw new common_1.BadRequestException("診所 ID (clinicId) 不能為空");
        }
        const existingTemplate = await this.getTemplateById(templateId, clinicId);
        if (!existingTemplate) {
            throw new common_1.NotFoundException(`模板不存在 (ID: ${templateId}, 診所: ${clinicId})`);
        }
        try {
            const result = await this.templateRepository.update({ id: templateId, clinicId }, { isActive: false });
            if (result.affected === 0) {
                throw new common_1.NotFoundException("模板刪除失敗或不存在");
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`刪除模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`);
        }
    }
};
exports.TreatmentCourseTemplateService = TreatmentCourseTemplateService;
exports.TreatmentCourseTemplateService = TreatmentCourseTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_course_template_entity_1.TreatmentCourseTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TreatmentCourseTemplateService);
//# sourceMappingURL=treatment-course-template.service.js.map