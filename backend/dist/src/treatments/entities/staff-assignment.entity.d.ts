import Decimal from "decimal.js";
import { TreatmentSession } from "./treatment-session.entity";
export declare class StaffAssignment {
    id: string;
    sessionId: string;
    staffId: string;
    staffRole: string;
    ppfPercentage: Decimal;
    ppfAmount: Decimal;
    createdAt: Date;
    updatedAt: Date;
    session: TreatmentSession;
}
