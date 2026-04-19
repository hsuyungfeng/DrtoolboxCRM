import { TreatmentStaffAssignment } from "./treatment-staff-assignment.entity";
export declare class Staff {
    id: string;
    name: string;
    email: string;
    username: string;
    passwordHash: string;
    phone: string;
    role: string;
    specialty: string;
    status: string;
    clinicId: string;
    baseSalary: number;
    pointsBalance: number;
    canBeReferrer: boolean;
    createdAt: Date;
    updatedAt: Date;
    assignments: TreatmentStaffAssignment[];
}
