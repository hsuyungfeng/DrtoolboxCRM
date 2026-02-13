import { RevenueRecord } from "./revenue-record.entity";
export declare class RevenueAdjustment {
    id: string;
    revenueRecordId: string;
    revenueRecord: RevenueRecord;
    adjustmentAmount: number;
    reason: string;
    createdBy: string;
    createdAt: Date;
    clinicId: string;
    metadata: any;
    reviewStatus: "pending" | "approved" | "rejected";
    reviewNotes: string | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    version: number;
}
