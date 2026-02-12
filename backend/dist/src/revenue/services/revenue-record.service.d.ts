import { Repository } from "typeorm";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { RevenueCalculatorService } from "./revenue-calculator.service";
export declare class RevenueRecordService {
    private revenueRecordRepository;
    private revenueCalculatorService;
    constructor(revenueRecordRepository: Repository<RevenueRecord>, revenueCalculatorService: RevenueCalculatorService);
    findAll(clinicId: string): Promise<RevenueRecord[]>;
    findByTreatment(treatmentId: string, clinicId: string): Promise<RevenueRecord[]>;
    findByStaff(staffId: string, clinicId: string): Promise<RevenueRecord[]>;
    findOne(id: string): Promise<RevenueRecord>;
    lockRecord(id: string): Promise<RevenueRecord>;
    unlockRecord(id: string): Promise<RevenueRecord>;
    markAsPaid(id: string, paidAt?: Date): Promise<RevenueRecord>;
    remove(id: string): Promise<void>;
    calculateForTreatment(treatmentId: string, clinicId: string): Promise<RevenueRecord[]>;
    calculateForSession(treatmentId: string, sessionId: string, clinicId: string): Promise<RevenueRecord[]>;
    getSummaryByClinic(clinicId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
