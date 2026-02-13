import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository, DataSource } from "typeorm";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
import { PPFCalculationService } from "./ppf-calculation.service";
export declare class TreatmentSessionService {
    private readonly sessionRepository;
    private readonly courseRepository;
    private readonly assignmentRepository;
    private readonly ppfCalculationService;
    private readonly eventEmitter;
    private readonly dataSource;
    constructor(sessionRepository: Repository<TreatmentSession>, courseRepository: Repository<TreatmentCourse>, assignmentRepository: Repository<StaffAssignment>, ppfCalculationService: PPFCalculationService, eventEmitter: EventEmitter2, dataSource: DataSource);
    updateSession(sessionId: string, updateDto: UpdateTreatmentSessionDto, clinicId: string): Promise<TreatmentSession>;
    completeSession(sessionId: string, updateDto: UpdateTreatmentSessionDto, clinicId: string): Promise<TreatmentSession>;
    getStaffSessions(staffId: string, clinicId: string, filter?: {
        status?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<TreatmentSession[]>;
    create(createTreatmentSessionDto: CreateTreatmentSessionDto): Promise<TreatmentSession>;
    findAllByTreatment(treatmentId: string, clinicId: string): Promise<TreatmentSession[]>;
    findAllByClinic(clinicId: string): Promise<TreatmentSession[]>;
    findOne(id: string): Promise<TreatmentSession>;
    update(id: string, updateTreatmentSessionDto: UpdateTreatmentSessionDto): Promise<TreatmentSession>;
    remove(id: string): Promise<void>;
    findByStatus(clinicId: string, status: "pending" | "completed" | "cancelled"): Promise<TreatmentSession[]>;
    findUpcomingSessions(clinicId: string, days?: number): Promise<TreatmentSession[]>;
    completeSessionLegacy(id: string, notes?: string, observations?: string): Promise<TreatmentSession>;
}
