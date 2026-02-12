import { StaffService } from "../services/staff.service";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    create(createStaffDto: CreateStaffDto): Promise<import("../entities/staff.entity").Staff>;
    findAll(clinicId: string): Promise<import("../entities/staff.entity").Staff[]>;
    findByRole(clinicId: string, role: string): Promise<import("../entities/staff.entity").Staff[]>;
    searchByName(clinicId: string, name: string): Promise<import("../entities/staff.entity").Staff[]>;
    findOne(id: string): Promise<import("../entities/staff.entity").Staff>;
    update(id: string, updateStaffDto: UpdateStaffDto): Promise<import("../entities/staff.entity").Staff>;
    remove(id: string): Promise<void>;
}
