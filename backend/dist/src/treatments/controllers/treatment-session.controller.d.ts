import { TreatmentSessionService } from "../services/treatment-session.service";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
export declare class TreatmentSessionController {
    private readonly treatmentSessionService;
    constructor(treatmentSessionService: TreatmentSessionService);
    create(createTreatmentSessionDto: CreateTreatmentSessionDto): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
    findByTreatmentId(treatmentId: string, clinicId: string): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
    findByClinicId(clinicId: string): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
    findByStatus(clinicId: string, status: string): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
    findUpcomingSessions(clinicId: string, days?: number): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
    findOne(id: string): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
    update(id: string, updateTreatmentSessionDto: UpdateTreatmentSessionDto): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
    completeSession(id: string, notes?: string, observations?: string): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
    remove(id: string): Promise<void>;
}
