"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const staff_entity_1 = require("../entities/staff.entity");
let StaffService = class StaffService {
    staffRepository;
    constructor(staffRepository) {
        this.staffRepository = staffRepository;
    }
    async create(createStaffDto) {
        const staff = this.staffRepository.create(createStaffDto);
        return await this.staffRepository.save(staff);
    }
    async findAll(clinicId) {
        return await this.staffRepository.find({
            where: { clinicId },
            order: { createdAt: "DESC" },
            relations: ["assignments"],
        });
    }
    async findByRole(clinicId, role) {
        return await this.staffRepository.find({
            where: { clinicId, role },
            order: { name: "ASC" },
        });
    }
    async findOne(id) {
        const staff = await this.staffRepository.findOne({
            where: { id },
            relations: ["assignments", "assignments.treatment"],
        });
        if (!staff) {
            throw new common_1.NotFoundException(`Staff with ID ${id} not found`);
        }
        return staff;
    }
    async update(id, updateStaffDto) {
        const staff = await this.findOne(id);
        Object.assign(staff, updateStaffDto);
        return await this.staffRepository.save(staff);
    }
    async remove(id) {
        const staff = await this.findOne(id);
        staff.status = "inactive";
        await this.staffRepository.save(staff);
    }
    async searchByName(clinicId, name) {
        return await this.staffRepository
            .createQueryBuilder("staff")
            .where("staff.clinicId = :clinicId", { clinicId })
            .andWhere("staff.name LIKE :name", { name: `%${name}%` })
            .orderBy("staff.name", "ASC")
            .getMany();
    }
    async findByUsername(username, clinicId) {
        return await this.staffRepository.findOne({
            where: [
                { name: username, clinicId, status: "active" },
                { email: username, clinicId, status: "active" },
            ],
        });
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StaffService);
//# sourceMappingURL=staff.service.js.map