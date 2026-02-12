import { Treatment } from "../../treatments/entities/treatment.entity";
import { Staff } from "./staff.entity";
export declare class TreatmentStaffAssignment {
    id: string;
    treatmentId: string;
    treatment: Treatment;
    staffId: string;
    staff: Staff;
    role: string;
    revenuePercentage: number;
    assignedAt: Date;
    isActive: boolean;
}
