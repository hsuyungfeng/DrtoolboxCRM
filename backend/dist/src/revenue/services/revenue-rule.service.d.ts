import { Repository } from "typeorm";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { CreateRevenueRuleDto } from "../dto/create-revenue-rule.dto";
import { UpdateRevenueRuleDto } from "../dto/update-revenue-rule.dto";
export declare class RevenueRuleService {
    private revenueRuleRepository;
    constructor(revenueRuleRepository: Repository<RevenueRule>);
    create(createRevenueRuleDto: CreateRevenueRuleDto): Promise<RevenueRule>;
    findAll(clinicId: string): Promise<RevenueRule[]>;
    findActiveRules(clinicId: string, date?: Date): Promise<RevenueRule[]>;
    findOne(id: string): Promise<RevenueRule>;
    update(id: string, updateRevenueRuleDto: UpdateRevenueRuleDto): Promise<RevenueRule>;
    remove(id: string): Promise<void>;
    findByRole(clinicId: string, role: string): Promise<RevenueRule[]>;
}
