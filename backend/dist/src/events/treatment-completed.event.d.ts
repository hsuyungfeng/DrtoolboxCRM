export declare class TreatmentCompletedEvent {
    readonly treatmentId: string;
    readonly clinicId: string;
    readonly completedAt: Date;
    constructor(treatmentId: string, clinicId: string, completedAt?: Date);
}
