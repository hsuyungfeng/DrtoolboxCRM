import { Repository } from 'typeorm';
import { Referral } from '../entities/referral.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { PointsService } from '../../points/services/points.service';
import { PointsConfigService } from '../../points/services/points-config.service';
import { CreateReferralDto } from '../dto/create-referral.dto';
export interface ReferralStats {
    totalReferrals: number;
    convertedCount: number;
    pendingCount: number;
    cancelledCount: number;
    conversionRate: number;
    totalPointsAwarded: number;
}
export declare class ReferralService {
    private readonly referralRepository;
    private readonly patientRepository;
    private readonly staffRepository;
    private readonly treatmentRepository;
    private readonly pointsService;
    private readonly pointsConfigService;
    private readonly logger;
    constructor(referralRepository: Repository<Referral>, patientRepository: Repository<Patient>, staffRepository: Repository<Staff>, treatmentRepository: Repository<Treatment>, pointsService: PointsService, pointsConfigService: PointsConfigService);
    createReferral(createReferralDto: CreateReferralDto): Promise<Referral>;
    getReferralsByReferrer(referrerId: string, referrerType: string, clinicId: string): Promise<Referral[]>;
    getReferralByPatient(patientId: string, clinicId: string): Promise<Referral | null>;
    convertReferral(referralId: string, treatmentId: string, clinicId: string): Promise<Referral>;
    getReferralStats(clinicId: string): Promise<ReferralStats>;
    deleteReferral(referralId: string, clinicId: string): Promise<Referral>;
    private validateReferrer;
}
