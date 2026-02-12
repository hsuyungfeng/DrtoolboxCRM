import { PartialType } from "@nestjs/mapped-types";
import { CreateRevenueRuleDto } from "./create-revenue-rule.dto";

export class UpdateRevenueRuleDto extends PartialType(CreateRevenueRuleDto) {}
