export declare class SessionCompletedEvent {
    readonly sessionId: string;
    readonly treatmentId: string;
    readonly clinicId: string;
    readonly completedAt: Date;
    constructor(sessionId: string, treatmentId: string, clinicId: string, completedAt?: Date);
}
