import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { RevenueRecordService } from "../services/revenue-record.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ClinicScoped } from "../../common/decorators/clinic-scoped.decorator";

@UseGuards(JwtAuthGuard)
@ClinicScoped()
@Controller("revenue-records")
export class RevenueRecordController {
  constructor(private readonly revenueRecordService: RevenueRecordService) {}

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.revenueRecordService.findAll(clinicId);
  }

  @Get("treatment/:treatmentId")
  findByTreatment(
    @Param("treatmentId") treatmentId: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.revenueRecordService.findByTreatment(treatmentId, clinicId);
  }

  @Get("staff/:staffId")
  findByStaff(
    @Param("staffId") staffId: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.revenueRecordService.findByStaff(staffId, clinicId);
  }

  @Get("summary")
  getSummary(
    @Query("clinicId") clinicId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.revenueRecordService.getSummaryByClinic(clinicId, start, end);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.revenueRecordService.findOne(id);
  }

  @Post("calculate/treatment/:treatmentId")
  calculateForTreatment(
    @Param("treatmentId") treatmentId: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.revenueRecordService.calculateForTreatment(
      treatmentId,
      clinicId,
    );
  }

  @Post("calculate/session/:sessionId")
  calculateForSession(
    @Param("sessionId") sessionId: string,
    @Query("treatmentId") treatmentId: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.revenueRecordService.calculateForSession(
      treatmentId,
      sessionId,
      clinicId,
    );
  }

  @Patch(":id/lock")
  lockRecord(@Param("id") id: string) {
    return this.revenueRecordService.lockRecord(id);
  }

  @Patch(":id/unlock")
  unlockRecord(@Param("id") id: string) {
    return this.revenueRecordService.unlockRecord(id);
  }

  @Patch(":id/paid")
  markAsPaid(@Param("id") id: string, @Body("paidAt") paidAt?: string) {
    const paidDate = paidAt ? new Date(paidAt) : undefined;
    return this.revenueRecordService.markAsPaid(id, paidDate);
  }
}
