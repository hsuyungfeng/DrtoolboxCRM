import { Repository } from "typeorm";
import { Patient } from "../entities/patient.entity";
import { CreatePatientDto } from "../dto/create-patient.dto";
import { UpdatePatientDto } from "../dto/update-patient.dto";
import { PatientSearchService } from "./patient-search.service";
export declare class PatientService {
    private readonly patientRepository;
    private readonly patientSearchService;
    constructor(patientRepository: Repository<Patient>, patientSearchService: PatientSearchService);
    createPatient(dto: CreatePatientDto, clinicId: string): Promise<Patient>;
    updatePatient(patientId: string, dto: UpdatePatientDto, clinicId: string): Promise<Patient>;
    create(createPatientDto: CreatePatientDto): Promise<Patient>;
    findAll(clinicId: string): Promise<Patient[]>;
    findOne(id: string): Promise<Patient>;
    update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient>;
    remove(id: string): Promise<void>;
}
