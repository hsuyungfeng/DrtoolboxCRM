import { Repository } from "typeorm";
import { Staff } from "../entities/staff.entity";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
export declare class StaffService {
    private staffRepository;
    constructor(staffRepository: Repository<Staff>);
    create(createStaffDto: CreateStaffDto): Promise<Staff>;
    findAll(clinicId: string): Promise<Staff[]>;
    findByRole(clinicId: string, role: string): Promise<Staff[]>;
    findOne(id: string): Promise<Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff>;
    remove(id: string): Promise<void>;
    searchByName(clinicId: string, name: string): Promise<Staff[]>;
    findByUsername(username: string, clinicId: string): Promise<Staff | null>;
}
