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
var RevenueCalculationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueCalculationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const revenue_rule_engine_service_1 = require("./revenue-rule-engine.service");
const revenue_record_entity_1 = require("../entities/revenue-record.entity");
const treatment_entity_1 = require("../../treatments/entities/treatment.entity");
const treatment_session_entity_1 = require("../../treatments/entities/treatment-session.entity");
const treatment_staff_assignment_entity_1 = require("../../staff/entities/treatment-staff-assignment.entity");
const revenue_rule_entity_1 = require("../entities/revenue-rule.entity");
let RevenueCalculationService = RevenueCalculationService_1 = class RevenueCalculationService {
    revenueRecordRepository;
    treatmentRepository;
    treatmentSessionRepository;
    treatmentStaffAssignmentRepository;
    revenueRuleRepository;
    revenueRuleEngine;
    logger = new common_1.Logger(RevenueCalculationService_1.name);
    constructor(revenueRecordRepository, treatmentRepository, treatmentSessionRepository, treatmentStaffAssignmentRepository, revenueRuleRepository, revenueRuleEngine) {
        this.revenueRecordRepository = revenueRecordRepository;
        this.treatmentRepository = treatmentRepository;
        this.treatmentSessionRepository = treatmentSessionRepository;
        this.treatmentStaffAssignmentRepository = treatmentStaffAssignmentRepository;
        this.revenueRuleRepository = revenueRuleRepository;
        this.revenueRuleEngine = revenueRuleEngine;
    }
    async calculateSessionRevenue(clinicId, treatmentId, sessionId) {
        this.logger.log(`開始計算營收：clinicId=${clinicId}, treatmentId=${treatmentId}, sessionId=${sessionId}`);
        const treatment = await this.treatmentRepository.findOne({
            where: { id: treatmentId },
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${treatmentId} not found`);
        }
        const session = await this.treatmentSessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Treatment session with ID ${sessionId} not found`);
        }
        const staffAssignments = await this.treatmentStaffAssignmentRepository.find({
            where: {
                treatmentId,
                isActive: true,
            },
        });
        if (staffAssignments.length === 0) {
            this.logger.warn(`沒有找到治療 ${treatmentId} 的活躍員工分配`);
            return [];
        }
        const roles = [...new Set(staffAssignments.map(assignment => assignment.role))];
        this.logger.debug(`收集到 ${roles.length} 個唯一角色：${roles.join(', ')}`);
        const allRules = await this.revenueRuleRepository.find({
            where: {
                role: (0, typeorm_2.In)(roles),
                clinicId: treatment.clinicId,
                isActive: true,
            },
            order: { effectiveFrom: 'DESC' },
        });
        if (allRules.length === 0) {
            this.logger.warn(`診所 ${treatment.clinicId} 的角色 [${roles.join(', ')}] 未找到營收規則`);
            return [];
        }
        const roleRulesMap = new Map();
        allRules.forEach(rule => {
            if (!roleRulesMap.has(rule.role)) {
                roleRulesMap.set(rule.role, rule);
            }
        });
        this.logger.debug(`建立了 ${roleRulesMap.size} 個角色的規則映射`);
        const createdRecords = [];
        for (const assignment of staffAssignments) {
            try {
                const role = assignment.role;
                const rule = roleRulesMap.get(role);
                if (!rule) {
                    this.logger.warn(`診所 ${treatment.clinicId} 的角色 ${role} 沒有找到營收規則，跳過員工 ${assignment.staffId}`);
                    continue;
                }
                const staffAllocationAmount = (treatment.totalPrice * (assignment.revenuePercentage || 100)) / 100;
                const rulePayload = {
                    rule_type: rule.ruleType,
                    rule_payload: rule.rulePayload,
                };
                const calculatedAmount = this.revenueRuleEngine.calculateAmount(staffAllocationAmount, rulePayload);
                const record = new revenue_record_entity_1.RevenueRecord();
                record.treatmentId = treatmentId;
                record.treatmentSessionId = sessionId;
                record.staffId = assignment.staffId;
                record.role = role;
                record.amount = calculatedAmount;
                record.calculationType = 'session';
                record.status = 'calculated';
                record.clinicId = treatment.clinicId;
                record.ruleId = rule.id;
                record.calculationDetails = {
                    staffAllocationAmount,
                    revenuePercentage: assignment.revenuePercentage,
                    ruleType: rule.ruleType,
                    rulePayload: rule.rulePayload,
                };
                const savedRecord = await this.revenueRecordRepository.save(record);
                createdRecords.push(savedRecord);
                this.logger.log(`營收計算完成：staffId=${assignment.staffId}, role=${role}, amount=${calculatedAmount}`);
            }
            catch (error) {
                this.logger.error(`計算營收時出錯：staffId=${assignment.staffId}, role=${assignment.role}，錯誤：${error.message}`, error.stack);
                continue;
            }
        }
        this.logger.log(`課程營收計算完成：生成了 ${createdRecords.length} 條記錄`);
        return createdRecords;
    }
};
exports.RevenueCalculationService = RevenueCalculationService;
exports.RevenueCalculationService = RevenueCalculationService = RevenueCalculationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(revenue_record_entity_1.RevenueRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __param(2, (0, typeorm_1.InjectRepository)(treatment_session_entity_1.TreatmentSession)),
    __param(3, (0, typeorm_1.InjectRepository)(treatment_staff_assignment_entity_1.TreatmentStaffAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(revenue_rule_entity_1.RevenueRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        revenue_rule_engine_service_1.RevenueRuleEngine])
], RevenueCalculationService);
//# sourceMappingURL=revenue-calculation.service.js.map