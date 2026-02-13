import { Patient } from "../../patients/entities/patient.entity";
export declare class Referral {
    id: string;
    referrerId: string;
    referrerType: string;
    patientId: string;
    patient: Patient;
    referralDate: Date;
    status: string;
    firstTreatmentId: string;
    firstTreatmentDate: Date;
    pointsAwarded: number;
    clinicId: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
