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
var RevenueCalculatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
const revenue_rule_entity_1 = require("../entities/revenue-rule.entity");
const revenue_record_entity_1 = require("../entities/revenue-record.entity");
const treatment_entity_1 = require("../../treatments/entities/treatment.entity");
const treatment_session_entity_1 = require("../../treatments/entities/treatment-session.entity");
const treatment_staff_assignment_entity_1 = require("../../staff/entities/treatment-staff-assignment.entity");
const staff_entity_1 = require("../../staff/entities/staff.entity");
decimal_js_1.default.set({ precision: 8, rounding: decimal_js_1.default.ROUND_HALF_UP });
let RevenueCalculatorService = RevenueCalculatorService_1 = class RevenueCalculatorService {
    revenueRuleRepository;
    treatmentRepository;
    treatmentSessionRepository;
    staffAssignmentRepository;
    revenueRecordRepository;
    staffRepository;
    logger = new common_1.Logger(RevenueCalculatorService_1.name);
    constructor(revenueRuleRepository, treatmentRepository, treatmentSessionRepository, staffAssignmentRepository, revenueRecordRepository, staffRepository) {
        this.revenueRuleRepository = revenueRuleRepository;
        this.treatmentRepository = treatmentRepository;
        this.treatmentSessionRepository = treatmentSessionRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.revenueRecordRepository = revenueRecordRepository;
        this.staffRepository = staffRepository;
    }
    async calculateTreatmentRevenue(request) {
        this.logger.log(`Calculating revenue for treatment ${request.treatmentId}, clinic ${request.clinicId}`);
        const results = [];
        const calculationDate = request.calculationDate || new Date();
        const treatment = await this.treatmentRepository.findOne({
            where: { id: request.treatmentId, clinicId: request.clinicId },
            relations: ["staffAssignments", "staffAssignments.staff"],
        });
        if (!treatment) {
            throw new Error(`Treatment ${request.treatmentId} not found in clinic ${request.clinicId}`);
        }
        let session = null;
        if (request.sessionId) {
            session = await this.treatmentSessionRepository.findOne({
                where: {
                    id: request.sessionId,
                    treatmentId: request.treatmentId,
                    clinicId: request.clinicId,
                },
            });
            if (!session) {
                throw new Error(`TreatmentSession ${request.sessionId} not found for treatment ${request.treatmentId}`);
            }
        }
        const assignments = await this.staffAssignmentRepository.find({
            where: { treatmentId: request.treatmentId },
            relations: ["staff"],
        });
        if (assignments.length === 0) {
            this.logger.warn(`No staff assignments found for treatment ${request.treatmentId}`);
            return results;
        }
        for (const assignment of assignments) {
            const staff = assignment.staff;
            const activeRules = await this.revenueRuleRepository
                .createQueryBuilder("rule")
                .where("rule.clinicId = :clinicId", { clinicId: request.clinicId })
                .andWhere("rule.role = :role", { role: staff.role })
                .andWhere("rule.isActive = :isActive", { isActive: true })
                .andWhere("rule.effectiveFrom <= :date", { date: calculationDate })
                .andWhere("(rule.effectiveTo IS NULL OR rule.effectiveTo >= :date)", {
                date: calculationDate,
            })
                .orderBy("rule.effectiveFrom", "DESC")
                .getMany();
            if (activeRules.length === 0) {
                this.logger.warn(`No active revenue rules found for role ${staff.role} in clinic ${request.clinicId}`);
                continue;
            }
            const rule = activeRules[0];
            const amount = this.calculateAmountByRule(rule, treatment, session, staff);
            const result = {
                treatmentId: request.treatmentId,
                sessionId: request.sessionId,
                staffId: staff.id,
                role: staff.role,
                amount,
                ruleId: rule.id,
                calculationDetails: {
                    ruleType: rule.ruleType,
                    rulePayload: rule.rulePayload,
                    treatmentPrice: treatment.totalPrice,
                    sessionCount: treatment.totalSessions,
                    completedSessions: treatment.completedSessions,
                },
            };
            results.push(result);
        }
        this.logger.log(`Calculated revenue for ${results.length} staff members for treatment ${request.treatmentId}`);
        return results;
    }
    calculateAmountByRule(rule, treatment, session, _staff) {
        const { ruleType, rulePayload } = rule;
        const totalPrice = new decimal_js_1.default(treatment.totalPrice);
        const totalSessions = new decimal_js_1.default(treatment.totalSessions);
        const baseAmount = session
            ? totalPrice.div(totalSessions)
            : totalPrice;
        switch (ruleType) {
            case "percentage": {
                const percentageValue = rulePayload?.percentage || 0;
                if (percentageValue < 0 || percentageValue > 100) {
                    this.logger.warn(`Invalid percentage value: ${percentageValue}. Must be between 0 and 100.`);
                    return 0;
                }
                const percentage = new decimal_js_1.default(percentageValue);
                const result = baseAmount.mul(percentage).div(100);
                return result.toDecimalPlaces(2).toNumber();
            }
            case "fixed": {
                const fixedAmount = rulePayload?.amount || 0;
                if (fixedAmount < 0) {
                    this.logger.warn(`Invalid fixed amount: ${fixedAmount}. Must be non-negative.`);
                    return 0;
                }
                return new decimal_js_1.default(fixedAmount).toDecimalPlaces(2).toNumber();
            }
            case "tiered": {
                const tiers = rulePayload?.tiers || [];
                if (tiers.length === 0) {
                    this.logger.warn("Tiered rule has no tiers defined.");
                    return 0;
                }
                let amount = new decimal_js_1.default(0);
                let previousThreshold = new decimal_js_1.default(0);
                for (const tier of tiers) {
                    if (tier.percentage < 0 || tier.percentage > 100) {
                        this.logger.warn(`Invalid tier percentage: ${tier.percentage}. Skipping tier.`);
                        continue;
                    }
                    const threshold = new decimal_js_1.default(tier.threshold);
                    const percentage = new decimal_js_1.default(tier.percentage);
                    if (baseAmount.greaterThan(threshold)) {
                        const tierAmount = decimal_js_1.default.min(baseAmount, threshold).minus(previousThreshold);
                        amount = amount.plus(tierAmount.mul(percentage).div(100));
                        previousThreshold = threshold;
                    }
                    else {
                        const tierAmount = baseAmount.minus(previousThreshold);
                        amount = amount.plus(tierAmount.mul(percentage).div(100));
                        break;
                    }
                }
                return amount.toDecimalPlaces(2).toNumber();
            }
            default:
                this.logger.warn(`Unknown rule type: ${ruleType}`);
                return 0;
        }
    }
    async createRevenueRecords(calculationResults) {
        const records = [];
        for (const result of calculationResults) {
            const record = this.revenueRecordRepository.create({
                treatmentId: result.treatmentId,
                treatmentSessionId: result.sessionId || null,
                staffId: result.staffId,
                role: result.role,
                amount: result.amount,
                ruleId: result.ruleId,
                calculationDetails: result.calculationDetails,
                calculatedAt: new Date(),
                clinicId: await this.getClinicIdFromTreatment(result.treatmentId),
                calculationType: result.sessionId ? "session" : "treatment",
                status: "calculated",
                lockedAt: null,
                paidAt: null,
            });
            const savedRecord = await this.revenueRecordRepository.save(record);
            records.push(savedRecord);
        }
        this.logger.log(`Created ${records.length} revenue records`);
        return records;
    }
    async lockRevenueRecord(recordId) {
        const record = await this.revenueRecordRepository.findOne({
            where: { id: recordId },
        });
        if (!record) {
            throw new Error(`RevenueRecord ${recordId} not found`);
        }
        if (record.lockedAt) {
            throw new Error(`RevenueRecord ${recordId} is already locked at ${record.lockedAt.toISOString()}`);
        }
        record.lockedAt = new Date();
        return await this.revenueRecordRepository.save(record);
    }
    async calculateAndCreateRecords(request) {
        const results = await this.calculateTreatmentRevenue(request);
        return await this.createRevenueRecords(results);
    }
    async handleCompletedTreatment(treatmentId) {
        const treatment = await this.treatmentRepository.findOne({
            where: { id: treatmentId },
        });
        if (!treatment) {
            throw new Error(`Treatment ${treatmentId} not found`);
        }
        if (treatment.status !== "completed") {
            throw new Error(`Treatment ${treatmentId} is not completed (status: ${treatment.status})`);
        }
        const request = {
            treatmentId,
            clinicId: treatment.clinicId,
            calculationDate: new Date(),
        };
        return await this.calculateAndCreateRecords(request);
    }
    async handleCompletedSession(sessionId) {
        const session = await this.treatmentSessionRepository.findOne({
            where: { id: sessionId },
            relations: ["treatment"],
        });
        if (!session) {
            throw new Error(`TreatmentSession ${sessionId} not found`);
        }
        if (session.status !== "completed") {
            throw new Error(`TreatmentSession ${sessionId} is not completed (status: ${session.status})`);
        }
        const request = {
            treatmentId: session.treatmentId,
            sessionId,
            clinicId: session.clinicId,
            calculationDate: new Date(),
        };
        return await this.calculateAndCreateRecords(request);
    }
    async getClinicIdFromTreatment(treatmentId) {
        const treatment = await this.treatmentRepository.findOne({
            where: { id: treatmentId },
            select: ["clinicId"],
        });
        if (!treatment) {
            throw new Error(`Treatment ${treatmentId} not found`);
        }
        return treatment.clinicId;
    }
};
exports.RevenueCalculatorService = RevenueCalculatorService;
exports.RevenueCalculatorService = RevenueCalculatorService = RevenueCalculatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(revenue_rule_entity_1.RevenueRule)),
    __param(1, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __param(2, (0, typeorm_1.InjectRepository)(treatment_session_entity_1.TreatmentSession)),
    __param(3, (0, typeorm_1.InjectRepository)(treatment_staff_assignment_entity_1.TreatmentStaffAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(revenue_record_entity_1.RevenueRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RevenueCalculatorService);
//# sourceMappingURL=revenue-calculator.service.js.map