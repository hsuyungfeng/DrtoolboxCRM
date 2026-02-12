import { RevenueRuleService } from "../services/revenue-rule.service";
import { CreateRevenueRuleDto } from "../dto/create-revenue-rule.dto";
import { UpdateRevenueRuleDto } from "../dto/update-revenue-rule.dto";
export declare class RevenueRuleController {
    private readonly revenueRuleService;
    constructor(revenueRuleService: RevenueRuleService);
    create(createRevenueRuleDto: CreateRevenueRuleDto): Promise<import("../entities/revenue-rule.entity").RevenueRule>;
    findAll(clinicId: string): Promise<import("../entities/revenue-rule.entity").RevenueRule[]>;
    findActive(clinicId: string, date?: string): Promise<import("../entities/revenue-rule.entity").RevenueRule[]>;
    findByRole(clinicId: string, role: string): Promise<import("../entities/revenue-rule.entity").RevenueRule[]>;
    findOne(id: string): Promise<import("../entities/revenue-rule.entity").RevenueRule>;
    update(id: string, updateRevenueRuleDto: UpdateRevenueRuleDto): Promise<import("../entities/revenue-rule.entity").RevenueRule>;
    remove(id: string): Promise<void>;
}
