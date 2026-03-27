import { PatientService } from '../services/patient.service';
import { PatientSearchService } from '../services/patient-search.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
export declare class PatientController {
    private readonly patientService;
    private readonly patientSearchService;
    constructor(patientService: PatientService, patientSearchService: PatientSearchService);
    search(keyword: string, limit: number | undefined, req: any): Promise<{
        statusCode: number;
        data: import("../entities/patient.entity").Patient[];
        count: number;
    }>;
    identify(idNumber: string, name: string, req: any): Promise<{
        statusCode: number;
        data: import("../entities/patient.entity").Patient;
    }>;
    findOne(id: string, req: any): Promise<{
        statusCode: number;
        data: import("../entities/patient.entity").Patient;
    }>;
    create(dto: CreatePatientDto, req: any): Promise<{
        statusCode: number;
        message: string;
        data: import("../entities/patient.entity").Patient;
    }>;
    update(id: string, dto: UpdatePatientDto, req: any): Promise<{
        statusCode: number;
        message: string;
        data: import("../entities/patient.entity").Patient;
    }>;
    findAll(page: number | undefined, pageSize: number | undefined, req: any): Promise<{
        statusCode: number;
        data: import("../entities/patient.entity").Patient[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
        };
    }>;
}
