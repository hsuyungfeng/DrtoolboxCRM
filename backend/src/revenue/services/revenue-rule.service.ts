import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { CreateRevenueRuleDto } from "../dto/create-revenue-rule.dto";
import { UpdateRevenueRuleDto } from "../dto/update-revenue-rule.dto";

@Injectable()
export class RevenueRuleService {
  constructor(
    @InjectRepository(RevenueRule)
    private revenueRuleRepository: Repository<RevenueRule>,
  ) {}

  async create(
    createRevenueRuleDto: CreateRevenueRuleDto,
  ): Promise<RevenueRule> {
    const rule = this.revenueRuleRepository.create(createRevenueRuleDto);
    return await this.revenueRuleRepository.save(rule);
  }

  async findAll(clinicId: string): Promise<RevenueRule[]> {
    return await this.revenueRuleRepository.find({
      where: { clinicId },
      order: { effectiveFrom: "DESC" },
    });
  }

  async findActiveRules(clinicId: string, date?: Date): Promise<RevenueRule[]> {
    const queryDate = date || new Date();
    return await this.revenueRuleRepository
      .createQueryBuilder("rule")
      .where("rule.clinicId = :clinicId", { clinicId })
      .andWhere("rule.isActive = :isActive", { isActive: true })
      .andWhere("rule.effectiveFrom <= :queryDate", { queryDate })
      .andWhere(
        "(rule.effectiveTo IS NULL OR rule.effectiveTo >= :queryDate)",
        { queryDate },
      )
      .orderBy("rule.effectiveFrom", "DESC")
      .getMany();
  }

  async findOne(id: string): Promise<RevenueRule> {
    const rule = await this.revenueRuleRepository.findOne({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`RevenueRule with ID ${id} not found`);
    }

    return rule;
  }

  async update(
    id: string,
    updateRevenueRuleDto: UpdateRevenueRuleDto,
  ): Promise<RevenueRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, updateRevenueRuleDto);
    return await this.revenueRuleRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    // 软删除：将 isActive 设为 false
    rule.isActive = false;
    await this.revenueRuleRepository.save(rule);
  }

  async findByRole(clinicId: string, role: string): Promise<RevenueRule[]> {
    return await this.revenueRuleRepository.find({
      where: { clinicId, role },
      order: { effectiveFrom: "DESC" },
    });
  }
}
