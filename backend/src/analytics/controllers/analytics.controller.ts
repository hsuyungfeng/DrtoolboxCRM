import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "../services/analytics.service";
import { ClinicScoped } from "../../common/decorators/clinic-scoped.decorator";

@Controller("analytics")
@ClinicScoped()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("patients/group-by/:fieldKey")
  async groupByCustomField(
    @Param("fieldKey") fieldKey: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.analyticsService.aggregatePatientsByCustomField(clinicId, fieldKey);
  }

  @Get("patients/trend/:fieldKey")
  async getFieldTrend(
    @Param("fieldKey") fieldKey: string,
    @Query("clinicId") clinicId: string,
    @Query("period") period: 'day' | 'month' = 'month',
  ) {
    return this.analyticsService.getCustomFieldTrend(clinicId, fieldKey, period);
  }
}
