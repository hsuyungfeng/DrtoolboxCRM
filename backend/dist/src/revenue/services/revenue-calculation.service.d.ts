import { Repository } from "typeorm";
import { RevenueRuleEngine } from "./revenue-rule-engine.service";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { RevenueRule } from "../entities/revenue-rule.entity";
export declare class RevenueCalculationService {
    private revenueRecordRepository;
    private treatmentRepository;
    private treatmentSessionRepository;
    private treatmentStaffAssignmentRepository;
    private revenueRuleRepository;
    private revenueRuleEngine;
    private readonly logger;
    constructor(revenueRecordRepository: Repository<RevenueRecord>, treatmentRepository: Repository<Treatment>, treatmentSessionRepository: Repository<TreatmentSession>, treatmentStaffAssignmentRepository: Repository<TreatmentStaffAssignment>, revenueRuleRepository: Repository<RevenueRule>, revenueRuleEngine: RevenueRuleEngine);
    calculateSessionRevenue(clinicId: string, treatmentId: string, sessionId: string): Promise<RevenueRecord[]>;
}
