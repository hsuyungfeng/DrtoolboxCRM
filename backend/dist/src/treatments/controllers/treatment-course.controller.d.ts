import { TreatmentCourseService } from "../services/treatment-course.service";
import { TreatmentSessionService } from "../services/treatment-session.service";
import { TreatmentCourseTemplateService } from "../services/treatment-course-template.service";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { UpdateTreatmentCourseDto } from "../dto/update-treatment-course.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";
export declare class TreatmentCourseController {
    private readonly courseService;
    private readonly sessionService;
    private readonly templateService;
    constructor(courseService: TreatmentCourseService, sessionService: TreatmentSessionService, templateService: TreatmentCourseTemplateService);
    createCourse(createDto: CreateTreatmentCourseDto, req: any): Promise<import("../entities/treatment-course.entity").TreatmentCourse>;
    getPatientCourses(patientId: string, clinicId: string, status?: string): Promise<{
        statusCode: number;
        data: import("../entities/treatment-course.entity").TreatmentCourse[];
        count: number;
    }>;
    getPatientTreatments(patientId: string, clinicId: string, status?: string, req?: any): Promise<{
        statusCode: number;
        data: import("../entities/treatment-course.entity").TreatmentCourse[];
        count: number;
    }>;
    getCourseById(courseId: string, clinicId: string, req?: any): Promise<{
        statusCode: number;
        data: import("../entities/treatment-course.entity").TreatmentCourse & {
            progress: ReturnType<import("../services/treatment-progress.service").TreatmentProgressService["getProgress"]>;
        };
    }>;
    getCourseSessions(courseId: string, clinicId: string, req?: any): Promise<{
        statusCode: number;
        data: import("../entities/treatment-session.entity").TreatmentSession[];
        count: number;
    }>;
    updateCourse(courseId: string, dto: UpdateTreatmentCourseDto, clinicId: string, req?: any): Promise<{
        statusCode: number;
        message: string;
        data: import("../entities/treatment-course.entity").TreatmentCourse;
    }>;
    deleteCourse(courseId: string, clinicId: string, req?: any): Promise<{
        statusCode: number;
        message: string;
    }>;
    getActiveTemplates(clinicId: string): Promise<import("../entities/treatment-course-template.entity").TreatmentCourseTemplate[]>;
    completeSession(sessionId: string, updateDto: UpdateTreatmentSessionDto, clinicId: string): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
    markSessionComplete(sessionId: string, req?: any): Promise<import("../entities/treatment-session.entity").TreatmentSession>;
}
export declare class StaffSessionController {
    private readonly sessionService;
    constructor(sessionService: TreatmentSessionService);
    getStaffSessions(staffId: string, clinicId: string, status?: "pending" | "completed" | "cancelled", startDate?: string, endDate?: string): Promise<import("../entities/treatment-session.entity").TreatmentSession[]>;
}
