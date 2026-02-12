import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
import { Treatment } from "../entities/treatment.entity";
export declare class TreatmentSessionService {
    private treatmentSessionRepository;
    private treatmentRepository;
    private eventEmitter;
    constructor(treatmentSessionRepository: Repository<TreatmentSession>, treatmentRepository: Repository<Treatment>, eventEmitter: EventEmitter2);
    create(createTreatmentSessionDto: CreateTreatmentSessionDto): Promise<TreatmentSession>;
    findAllByTreatment(treatmentId: string, clinicId: string): Promise<TreatmentSession[]>;
    findAllByClinic(clinicId: string): Promise<TreatmentSession[]>;
    findOne(id: string): Promise<TreatmentSession>;
    update(id: string, updateTreatmentSessionDto: UpdateTreatmentSessionDto): Promise<TreatmentSession>;
    remove(id: string): Promise<void>;
    completeSession(id: string, notes?: string, observations?: string): Promise<TreatmentSession>;
    findByStatus(clinicId: string, status: string): Promise<TreatmentSession[]>;
    findUpcomingSessions(clinicId: string, days?: number): Promise<TreatmentSession[]>;
    private updateTreatmentCompletionStatus;
}
