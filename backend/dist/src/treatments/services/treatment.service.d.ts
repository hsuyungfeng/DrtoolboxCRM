import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Treatment } from "../entities/treatment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";
export declare class TreatmentService {
    private treatmentRepository;
    private eventEmitter;
    private readonly logger;
    constructor(treatmentRepository: Repository<Treatment>, eventEmitter: EventEmitter2);
    create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment>;
    findAll(clinicId: string): Promise<Treatment[]>;
    findOne(id: string): Promise<Treatment>;
    update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment>;
    remove(id: string): Promise<void>;
    findByPatientId(patientId: string): Promise<Treatment[]>;
    updateCompletedSessions(id: string, completedSessions: number): Promise<Treatment>;
}
