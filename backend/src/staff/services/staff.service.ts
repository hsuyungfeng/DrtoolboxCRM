import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Staff } from "../entities/staff.entity";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async create(createStaffDto: CreateStaffDto): Promise<Staff> {
    const staff = this.staffRepository.create(createStaffDto);
    return await this.staffRepository.save(staff);
  }

  async findAll(clinicId: string): Promise<Staff[]> {
    return await this.staffRepository.find({
      where: { clinicId },
      order: { createdAt: "DESC" },
      relations: ["assignments"],
    });
  }

  async findByRole(clinicId: string, role: string): Promise<Staff[]> {
    return await this.staffRepository.find({
      where: { clinicId, role },
      order: { name: "ASC" },
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: ["assignments", "assignments.treatment"],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(id);
    Object.assign(staff, updateStaffDto);
    return await this.staffRepository.save(staff);
  }

  async remove(id: string): Promise<void> {
    const staff = await this.findOne(id);
    // 软删除：将状态标记为 inactive
    staff.status = "inactive";
    await this.staffRepository.save(staff);
  }

  async searchByName(clinicId: string, name: string): Promise<Staff[]> {
    return await this.staffRepository
      .createQueryBuilder("staff")
      .where("staff.clinicId = :clinicId", { clinicId })
      .andWhere("staff.name LIKE :name", { name: `%${name}%` })
      .orderBy("staff.name", "ASC")
      .getMany();
  }

  /**
   * 根據使用者名稱查找員工（用於登入認證）
   */
  async findByUsername(
    username: string,
    clinicId: string,
  ): Promise<Staff | null> {
    return await this.staffRepository.findOne({
      where: [
        { name: username, clinicId, status: "active" },
        { email: username, clinicId, status: "active" },
      ],
    });
  }
}
