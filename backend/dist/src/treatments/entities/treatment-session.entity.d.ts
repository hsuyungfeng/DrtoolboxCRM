import { Treatment } from "./treatment.entity";
export declare class TreatmentSession {
    id: string;
    treatmentId: string;
    treatment: Treatment;
    sessionIndex: number;
    scheduledTime: Date;
    actualTime: Date;
    status: string;
    notes: string;
    observations: string;
    durationMinutes: number;
    revenueCalculated: boolean;
    clinicId: string;
    createdAt: Date;
    updatedAt: Date;
}
