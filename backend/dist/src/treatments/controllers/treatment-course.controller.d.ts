import { TreatmentCourseService } from "../services/treatment-course.service";
import { TreatmentSessionService } from "../services/treatment-session.service";
import { TreatmentCourseTemplateService } from "../services/treatment-course-template.service";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
export declare class TreatmentCourseController {
    private readonly courseService;
    private readonly sessionService;
    private readonly templateService;
    constructor(courseService: TreatmentCourseService, sessionService: TreatmentSessionService, templateService: TreatmentCourseTemplateService);
    createCourse(createDto: CreateTreatmentCourseDto): Promise<import("../entities/treatment-course.entity").TreatmentCourse>;
    getPatientCourses(patientId: string, clinicId: string): Promise<import("../entities/treatment-course.entity").TreatmentCourse[]>;
    getCourseById(courseId: string, clinicId: string): Promise<import("../entities/treatment-course.entity").TreatmentCourse>;
    getActiveTemplates(clinicId: string): Promise<import("../entities/treatment-course-template.entity").TreatmentCourseTemplate[]>;
    completeSession(sessionId: string, updateDto: UpdateTreatmentSessionDto, clinicId: string): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
}
export declare class StaffSessionController {
    private readonly sessionService;
    constructor(sessionService: TreatmentSessionService);
    getStaffSessions(staffId: string, clinicId: string, status?: "pending" | "completed" | "cancelled", startDate?: string, endDate?: string): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
}
