import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
} from "@nestjs/common";
import { TreatmentSessionService } from "../services/treatment-session.service";
import { CreateTreatmentSessionDto } from "../dto/create-treatment-session.dto";
import { UpdateTreatmentSessionDto } from "../dto/update-treatment-session.dto";

import { ClinicScoped } from "../../common/decorators/clinic-scoped.decorator";

@Controller("treatment-sessions")
@ClinicScoped()
export class TreatmentSessionController {
  constructor(
    private readonly treatmentSessionService: TreatmentSessionService,
  ) {}

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.treatmentSessionService.findAllByClinic(clinicId);
  }

  @Post()
  create(@Body() createTreatmentSessionDto: CreateTreatmentSessionDto) {
    return this.treatmentSessionService.create(createTreatmentSessionDto);
  }

  @Get("treatment/:treatmentId")
  findByTreatmentId(
    @Param("treatmentId") treatmentId: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.treatmentSessionService.findAllByTreatment(
      treatmentId,
      clinicId,
    );
  }

  @Get("clinic/:clinicId")
  findByClinicId(@Param("clinicId") clinicId: string) {
    return this.treatmentSessionService.findAllByClinic(clinicId);
  }

  @Get("status")
  findByStatus(
    @Query("clinicId") clinicId: string,
    @Query("status") status: "pending" | "completed" | "cancelled",
  ) {
    return this.treatmentSessionService.findByStatus(clinicId, status);
  }

  @Get("upcoming")
  findUpcomingSessions(
    @Query("clinicId") clinicId: string,
    @Query("days") days?: number,
  ) {
    return this.treatmentSessionService.findUpcomingSessions(clinicId, days);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.treatmentSessionService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateTreatmentSessionDto: UpdateTreatmentSessionDto,
  ) {
    return this.treatmentSessionService.update(id, updateTreatmentSessionDto);
  }

  @Patch(":id/complete")
  completeSession(
    @Param("id") id: string,
    @Body() updateDto?: any,
    @Query("clinicId") clinicId?: string,
  ) {
    // 支持新的 API 簽名：completeSession(sessionId, updateDto, clinicId)
    // 也支持舊的簽名：completeSession(id, notes, observations)
    if (updateDto && typeof updateDto === "string") {
      // 舊的簽名：updateDto 是 notes，clinicId 是 observations
      return this.treatmentSessionService.completeSessionLegacy(
        id,
        updateDto,
        clinicId,
      );
    }
    // 新的簽名
    return this.treatmentSessionService.completeSession(
      id,
      updateDto || {},
      clinicId || "",
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.treatmentSessionService.remove(id);
  }
}
