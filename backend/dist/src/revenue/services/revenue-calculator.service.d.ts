import { Repository } from "typeorm";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../../staff/entities/staff.entity";
export interface RevenueCalculationResult {
    treatmentId: string;
    sessionId?: string;
    staffId: string;
    role: string;
    amount: number;
    ruleId: string;
    calculationDetails: Record<string, unknown>;
}
export interface RevenueCalculationRequest {
    treatmentId: string;
    sessionId?: string;
    clinicId: string;
    calculationDate?: Date;
}
export declare class RevenueCalculatorService {
    private revenueRuleRepository;
    private treatmentRepository;
    private treatmentSessionRepository;
    private staffAssignmentRepository;
    private revenueRecordRepository;
    private staffRepository;
    private readonly logger;
    constructor(revenueRuleRepository: Repository<RevenueRule>, treatmentRepository: Repository<Treatment>, treatmentSessionRepository: Repository<TreatmentSession>, staffAssignmentRepository: Repository<TreatmentStaffAssignment>, revenueRecordRepository: Repository<RevenueRecord>, staffRepository: Repository<Staff>);
    calculateTreatmentRevenue(request: RevenueCalculationRequest): Promise<RevenueCalculationResult[]>;
    private calculateAmountByRule;
    createRevenueRecords(calculationResults: RevenueCalculationResult[]): Promise<RevenueRecord[]>;
    lockRevenueRecord(recordId: string): Promise<RevenueRecord>;
    calculateAndCreateRecords(request: RevenueCalculationRequest): Promise<RevenueRecord[]>;
    handleCompletedTreatment(treatmentId: string): Promise<RevenueRecord[]>;
    handleCompletedSession(sessionId: string): Promise<RevenueRecord[]>;
    private getClinicIdFromTreatment;
}
