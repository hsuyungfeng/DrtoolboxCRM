import { RevenueRecordService } from "../services/revenue-record.service";
export declare class RevenueRecordController {
    private readonly revenueRecordService;
    constructor(revenueRecordService: RevenueRecordService);
    findAll(clinicId: string): Promise<import("../entities/revenue-record.entity").RevenueRecord[]>;
    findByTreatment(treatmentId: string, clinicId: string): Promise<import("../entities/revenue-record.entity").RevenueRecord[]>;
    findByStaff(staffId: string, clinicId: string): Promise<import("../entities/revenue-record.entity").RevenueRecord[]>;
    getSummary(clinicId: string, startDate?: string, endDate?: string): Promise<any>;
    findOne(id: string): Promise<import("../entities/revenue-record.entity").RevenueRecord>;
    calculateForTreatment(treatmentId: string, clinicId: string): Promise<import("../entities/revenue-record.entity").RevenueRecord[]>;
    calculateForSession(sessionId: string, treatmentId: string, clinicId: string): Promise<import("../entities/revenue-record.entity").RevenueRecord[]>;
    lockRecord(id: string): Promise<import("../entities/revenue-record.entity").RevenueRecord>;
    unlockRecord(id: string): Promise<import("../entities/revenue-record.entity").RevenueRecord>;
    markAsPaid(id: string, paidAt?: string): Promise<import("../entities/revenue-record.entity").RevenueRecord>;
}
