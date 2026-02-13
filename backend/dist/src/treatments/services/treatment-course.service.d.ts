import { Repository, DataSource } from "typeorm";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { CreateTreatmentCourseDto } from "../dto/create-treatment-course.dto";
import { TreatmentCourseTemplateService } from "./treatment-course-template.service";
import { PointsService } from "../../points/services/points.service";
export declare class TreatmentCourseService {
    private readonly courseRepository;
    private readonly sessionRepository;
    private readonly templateService;
    private readonly pointsService;
    private readonly dataSource;
    private readonly logger;
    constructor(courseRepository: Repository<TreatmentCourse>, sessionRepository: Repository<TreatmentSession>, templateService: TreatmentCourseTemplateService, pointsService: PointsService, dataSource: DataSource);
    createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse>;
    getCourseById(courseId: string, clinicId: string): Promise<TreatmentCourse>;
    getPatientCourses(patientId: string, clinicId: string): Promise<TreatmentCourse[]>;
    updateCourseStatus(courseId: string, clinicId: string, status: "active" | "completed" | "abandoned"): Promise<TreatmentCourse>;
    private validateCreateCourseInput;
}
