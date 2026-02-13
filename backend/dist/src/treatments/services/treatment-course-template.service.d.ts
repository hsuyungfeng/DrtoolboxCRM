import { Repository } from "typeorm";
import { TreatmentCourseTemplate } from "../entities/treatment-course-template.entity";
export declare class TreatmentCourseTemplateService {
    private readonly templateRepository;
    constructor(templateRepository: Repository<TreatmentCourseTemplate>);
    getActiveTemplates(clinicId: string): Promise<TreatmentCourseTemplate[]>;
    getTemplateById(templateId: string, clinicId: string): Promise<TreatmentCourseTemplate | null>;
    createTemplate(data: Partial<TreatmentCourseTemplate>): Promise<TreatmentCourseTemplate>;
    updateTemplate(templateId: string, clinicId: string, data: Partial<TreatmentCourseTemplate>): Promise<TreatmentCourseTemplate>;
    deleteTemplate(templateId: string, clinicId: string): Promise<void>;
}
