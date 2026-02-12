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
exports.RevenueRuleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const revenue_rule_entity_1 = require("../entities/revenue-rule.entity");
let RevenueRuleService = class RevenueRuleService {
    revenueRuleRepository;
    constructor(revenueRuleRepository) {
        this.revenueRuleRepository = revenueRuleRepository;
    }
    async create(createRevenueRuleDto) {
        const rule = this.revenueRuleRepository.create(createRevenueRuleDto);
        return await this.revenueRuleRepository.save(rule);
    }
    async findAll(clinicId) {
        return await this.revenueRuleRepository.find({
            where: { clinicId },
            order: { effectiveFrom: "DESC" },
        });
    }
    async findActiveRules(clinicId, date) {
        const queryDate = date || new Date();
        return await this.revenueRuleRepository
            .createQueryBuilder("rule")
            .where("rule.clinicId = :clinicId", { clinicId })
            .andWhere("rule.isActive = :isActive", { isActive: true })
            .andWhere("rule.effectiveFrom <= :queryDate", { queryDate })
            .andWhere("(rule.effectiveTo IS NULL OR rule.effectiveTo >= :queryDate)", { queryDate })
            .orderBy("rule.effectiveFrom", "DESC")
            .getMany();
    }
    async findOne(id) {
        const rule = await this.revenueRuleRepository.findOne({
            where: { id },
        });
        if (!rule) {
            throw new common_1.NotFoundException(`RevenueRule with ID ${id} not found`);
        }
        return rule;
    }
    async update(id, updateRevenueRuleDto) {
        const rule = await this.findOne(id);
        Object.assign(rule, updateRevenueRuleDto);
        return await this.revenueRuleRepository.save(rule);
    }
    async remove(id) {
        const rule = await this.findOne(id);
        rule.isActive = false;
        await this.revenueRuleRepository.save(rule);
    }
    async findByRole(clinicId, role) {
        return await this.revenueRuleRepository.find({
            where: { clinicId, role },
            order: { effectiveFrom: "DESC" },
        });
    }
};
exports.RevenueRuleService = RevenueRuleService;
exports.RevenueRuleService = RevenueRuleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(revenue_rule_entity_1.RevenueRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RevenueRuleService);
//# sourceMappingURL=revenue-rule.service.js.map