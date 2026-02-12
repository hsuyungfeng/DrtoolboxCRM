import { Repository } from "typeorm";
import { Treatment } from "../entities/treatment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";
export declare class TreatmentService {
    private treatmentRepository;
    constructor(treatmentRepository: Repository<Treatment>);
    create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment>;
    findAll(clinicId: string): Promise<Treatment[]>;
    findOne(id: string): Promise<Treatment>;
    update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment>;
    remove(id: string): Promise<void>;
    findByPatientId(patientId: string): Promise<Treatment[]>;
    updateCompletedSessions(id: string, completedSessions: number): Promise<Treatment>;
}
