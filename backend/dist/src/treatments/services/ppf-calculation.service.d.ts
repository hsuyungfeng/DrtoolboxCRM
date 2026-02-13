import { Repository } from "typeorm";
import Decimal from "decimal.js";
import { StaffAssignment } from "../entities/staff-assignment.entity";
export declare class PPFCalculationService {
    private assignmentRepository;
    constructor(assignmentRepository: Repository<StaffAssignment>);
    validateStaffAssignments(assignments: {
        ppfPercentage: Decimal | number;
    }[]): boolean;
    calculateStaffPPF(paymentAmount: Decimal, ppfPercentage: Decimal): Decimal;
    distributeToStaff(sessionId: string, paymentAmount: Decimal, assignments: StaffAssignment[]): Promise<StaffAssignment[]>;
}
