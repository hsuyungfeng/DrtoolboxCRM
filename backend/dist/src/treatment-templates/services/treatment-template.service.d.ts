import { Repository } from "typeorm";
import { TreatmentTemplate } from "../entities/treatment-template.entity";
import { CreateTreatmentTemplateDto } from "../dto/create-treatment-template.dto";
import { UpdateTreatmentTemplateDto } from "../dto/update-treatment-template.dto";
export declare class TreatmentTemplateService {
    private readonly templateRepository;
    private readonly logger;
    constructor(templateRepository: Repository<TreatmentTemplate>);
    create(dto: CreateTreatmentTemplateDto): Promise<TreatmentTemplate>;
    findAll(clinicId: string): Promise<TreatmentTemplate[]>;
    findById(id: string, clinicId: string): Promise<TreatmentTemplate>;
    update(id: string, clinicId: string, dto: UpdateTreatmentTemplateDto): Promise<TreatmentTemplate>;
    delete(id: string, clinicId: string): Promise<void>;
}
