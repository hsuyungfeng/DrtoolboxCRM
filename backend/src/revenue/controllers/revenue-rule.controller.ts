import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from "@nestjs/common";
import { RevenueRuleService } from "../services/revenue-rule.service";
import { CreateRevenueRuleDto } from "../dto/create-revenue-rule.dto";
import { UpdateRevenueRuleDto } from "../dto/update-revenue-rule.dto";

@Controller("revenue-rules")
export class RevenueRuleController {
  constructor(private readonly revenueRuleService: RevenueRuleService) {}

  @Post()
  create(@Body() createRevenueRuleDto: CreateRevenueRuleDto) {
    return this.revenueRuleService.create(createRevenueRuleDto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.revenueRuleService.findAll(clinicId);
  }

  @Get("active")
  findActive(
    @Query("clinicId") clinicId: string,
    @Query("date") date?: string,
  ) {
    const queryDate = date ? new Date(date) : new Date();
    return this.revenueRuleService.findActiveRules(clinicId, queryDate);
  }

  @Get("role/:role")
  findByRole(@Query("clinicId") clinicId: string, @Param("role") role: string) {
    return this.revenueRuleService.findByRole(clinicId, role);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.revenueRuleService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateRevenueRuleDto: UpdateRevenueRuleDto,
  ) {
    return this.revenueRuleService.update(id, updateRevenueRuleDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.revenueRuleService.remove(id);
  }
}
