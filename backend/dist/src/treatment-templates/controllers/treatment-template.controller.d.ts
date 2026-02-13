import { TreatmentTemplateService } from "../services/treatment-template.service";
import { CreateTreatmentTemplateDto } from "../dto/create-treatment-template.dto";
import { UpdateTreatmentTemplateDto } from "../dto/update-treatment-template.dto";
export declare class TreatmentTemplateController {
    private readonly templateService;
    constructor(templateService: TreatmentTemplateService);
    create(dto: CreateTreatmentTemplateDto): Promise<import("../entities/treatment-template.entity").TreatmentTemplate>;
    findAll(clinicId: string): Promise<import("../entities/treatment-template.entity").TreatmentTemplate[]>;
    findById(id: string, clinicId: string): Promise<import("../entities/treatment-template.entity").TreatmentTemplate>;
    update(id: string, clinicId: string, dto: UpdateTreatmentTemplateDto): Promise<import("../entities/treatment-template.entity").TreatmentTemplate>;
    delete(id: string, clinicId: string): Promise<void>;
}
