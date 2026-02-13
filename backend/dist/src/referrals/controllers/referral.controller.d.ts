import { ReferralService, ReferralStats } from "../services/referral.service";
import { Referral } from "../entities/referral.entity";
import { CreateReferralDto } from "../dto/create-referral.dto";
import { ConvertReferralDto } from "../dto/convert-referral.dto";
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
    create(createReferralDto: CreateReferralDto, req: any): Promise<Referral>;
    getReferralsByReferrer(referrerId: string, referrerType: string, req: any): Promise<Referral[]>;
    getReferralByPatient(patientId: string, req: any): Promise<Referral | null>;
    convert(id: string, convertReferralDto: ConvertReferralDto, req: any): Promise<Referral>;
    delete(id: string, req: any): Promise<Referral>;
    getStats(req: any): Promise<ReferralStats>;
    private validateClinicId;
}
