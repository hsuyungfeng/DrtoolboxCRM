import { StaffRole } from "../enums/staff-role.enum";
export declare class CreateStaffDto {
    name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    specialty?: string;
    status?: string;
    clinicId: string;
    baseSalary?: number;
    canBeReferrer?: boolean;
}
