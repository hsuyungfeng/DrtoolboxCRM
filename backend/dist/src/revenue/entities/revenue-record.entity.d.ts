import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { Staff } from "../../staff/entities/staff.entity";
export declare class RevenueRecord {
    id: string;
    treatmentId: string;
    treatment?: Treatment;
    treatmentSessionId: string | null;
    treatmentSession?: TreatmentSession | null;
    staffId: string;
    staff?: Staff;
    role: string;
    amount: number;
    calculationType: string;
    status: string;
    calculatedAt: Date;
    lockedAt: Date | null;
    paidAt: Date | null;
    calculationDetails: Record<string, unknown> | null;
    updatedAt: Date;
    clinicId: string;
    ruleId: string | null;
    version: number;
}
