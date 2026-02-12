export declare class CreateReferralDto {
    referrerId: string;
    referrerType: 'staff' | 'patient';
    patientId: string;
    clinicId: string;
    notes?: string;
}
