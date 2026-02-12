import { Patient } from "../../patients/entities/patient.entity";
import { TreatmentSession } from "./treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
export declare class Treatment {
    id: string;
    patientId: string;
    patient: Patient;
    name: string;
    treatmentTemplateId: string;
    totalPrice: number;
    totalSessions: number;
    completedSessions: number;
    status: string;
    startDate: Date;
    expectedEndDate: Date;
    actualEndDate: Date;
    notes: string;
    clinicId: string;
    pointsRedeemed: number;
    finalPrice: number;
    createdAt: Date;
    updatedAt: Date;
    sessions: TreatmentSession[];
    staffAssignments: TreatmentStaffAssignment[];
    version: number;
}
