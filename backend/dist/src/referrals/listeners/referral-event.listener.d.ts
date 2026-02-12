import { ReferralService } from '../services/referral.service';
interface TreatmentCreatedEvent {
    treatmentId: string;
    patientId: string;
    clinicId: string;
}
export declare class ReferralEventListener {
    private readonly referralService;
    private readonly logger;
    constructor(referralService: ReferralService);
    handleTreatmentCreated(event: TreatmentCreatedEvent): Promise<void>;
}
export {};
