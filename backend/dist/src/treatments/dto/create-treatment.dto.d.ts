export declare class StaffAssignmentCreateDto {
    staffId: string;
    role: string;
    revenuePercentage?: number;
}
export declare class CreateTreatmentDto {
    patientId: string;
    name: string;
    treatmentTemplateId?: string;
    totalPrice: number;
    totalSessions: number;
    completedSessions?: number;
    status?: string;
    startDate?: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    notes?: string;
    clinicId: string;
    staffAssignments?: StaffAssignmentCreateDto[];
}
