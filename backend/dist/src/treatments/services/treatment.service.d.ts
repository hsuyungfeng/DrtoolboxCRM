import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Treatment } from "../entities/treatment.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";
export declare class TreatmentService {
    private treatmentRepository;
    private staffAssignmentRepository;
    private eventEmitter;
    private readonly logger;
    constructor(treatmentRepository: Repository<Treatment>, staffAssignmentRepository: Repository<TreatmentStaffAssignment>, eventEmitter: EventEmitter2);
    create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment>;
    findAll(clinicId: string): Promise<Treatment[]>;
    findOne(id: string): Promise<Treatment>;
    update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment>;
    remove(id: string): Promise<void>;
    findByPatientId(patientId: string): Promise<Treatment[]>;
    updateCompletedSessions(id: string, completedSessions: number): Promise<Treatment>;
    addStaffAssignment(treatmentId: string, assignmentData: {
        staffId: string;
        role: string;
        revenuePercentage?: number;
    }): Promise<TreatmentStaffAssignment>;
    getStaffAssignments(treatmentId: string): Promise<TreatmentStaffAssignment[]>;
    removeStaffAssignment(treatmentId: string, assignmentId: string): Promise<void>;
    updateStaffAssignment(treatmentId: string, assignmentId: string, updateData: {
        role?: string;
        revenuePercentage?: number;
    }): Promise<TreatmentStaffAssignment>;
}
