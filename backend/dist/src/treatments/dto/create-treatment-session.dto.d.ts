export declare class CreateTreatmentSessionDto {
    treatmentId: string;
    sessionIndex: number;
    scheduledTime?: Date;
    actualTime?: Date;
    status?: string;
    notes?: string;
    observations?: string;
    durationMinutes?: number;
    revenueCalculated?: boolean;
    clinicId: string;
}
