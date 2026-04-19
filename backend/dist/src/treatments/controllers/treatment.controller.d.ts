import { TreatmentService } from "../services/treatment.service";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";
export declare class TreatmentController {
    private readonly treatmentService;
    constructor(treatmentService: TreatmentService);
    create(createTreatmentDto: CreateTreatmentDto): Promise<import("../entities/treatment.entity").Treatment>;
    findAll(clinicId: string): Promise<import("../entities/treatment.entity").Treatment[]>;
    findByPatientId(patientId: string): Promise<import("../entities/treatment.entity").Treatment[]>;
    findOne(id: string): Promise<import("../entities/treatment.entity").Treatment>;
    update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<import("../entities/treatment.entity").Treatment>;
    updateCompletedSessions(id: string, completedSessions: number): Promise<import("../entities/treatment.entity").Treatment>;
    remove(id: string): Promise<void>;
    addStaffAssignment(treatmentId: string, assignmentData: any): Promise<import("../../staff/entities/treatment-staff-assignment.entity").TreatmentStaffAssignment>;
    getStaffAssignments(treatmentId: string): Promise<import("../../staff/entities/treatment-staff-assignment.entity").TreatmentStaffAssignment[]>;
    removeStaffAssignment(treatmentId: string, assignmentId: string): Promise<void>;
    updateStaffAssignment(treatmentId: string, assignmentId: string, updateData: any): Promise<import("../../staff/entities/treatment-staff-assignment.entity").TreatmentStaffAssignment>;
}
