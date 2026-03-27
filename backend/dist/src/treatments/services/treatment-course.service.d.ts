import { Repository, DataSource } from "typeorm";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentCourseDto } from "../dto/update-treatment-course.dto";
import { TreatmentCourseTemplateService } from "./treatment-course-template.service";
import { TreatmentProgressService } from "./treatment-progress.service";
import { PointsService } from "../../points/services/points.service";
import { StaffService } from "../../staff/services/staff.service";
export declare class TreatmentCourseService {
    private readonly courseRepository;
    private readonly sessionRepository;
    private readonly staffAssignmentRepository;
    private readonly templateService;
    private readonly treatmentProgressService;
    private readonly pointsService;
    private readonly staffService;
    private readonly dataSource;
    private readonly logger;
    constructor(courseRepository: Repository<TreatmentCourse>, sessionRepository: Repository<TreatmentSession>, staffAssignmentRepository: Repository<StaffAssignment>, templateService: TreatmentCourseTemplateService, treatmentProgressService: TreatmentProgressService, pointsService: PointsService, staffService: StaffService, dataSource: DataSource);
    createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse>;
    getCourseById(courseId: string, clinicId: string): Promise<TreatmentCourse>;
    getPatientCourses(patientId: string, clinicId: string, status?: string): Promise<TreatmentCourse[]>;
    updateCourse(courseId: string, dto: UpdateTreatmentCourseDto, clinicId: string): Promise<TreatmentCourse>;
    deleteCourse(courseId: string, clinicId: string): Promise<void>;
    getCourseSessions(courseId: string, clinicId: string): Promise<TreatmentSession[]>;
    updateCourseStatus(courseId: string, clinicId: string, status: "active" | "completed" | "abandoned"): Promise<TreatmentCourse>;
    getCourseWithProgress(courseId: string, clinicId: string): Promise<TreatmentCourse & {
        progress: ReturnType<TreatmentProgressService["getProgress"]>;
    }>;
    getPatientCoursesWithProgress(patientId: string, clinicId: string): Promise<Array<TreatmentCourse & {
        progress: ReturnType<TreatmentProgressService["getProgress"]>;
    }>>;
    completeSession(sessionId: string, clinicId: string): Promise<TreatmentSession>;
    assignStaffToSession(courseId: string, sessionId: string, staffId: string, clinicId: string, staffRole: string, ppfPercentage: number): Promise<StaffAssignment>;
    getStaffAssignmentsForCourse(courseId: string, clinicId: string): Promise<StaffAssignment[]>;
    unassignStaff(assignmentId: string, clinicId: string): Promise<void>;
    private validateCreateCourseInput;
}
