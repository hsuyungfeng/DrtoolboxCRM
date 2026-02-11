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

@Controller("treatment-sessions")
export class TreatmentSessionController {
  constructor(
    private readonly treatmentSessionService: TreatmentSessionService,
  ) {}

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
    @Query("status") status: string,
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
    @Body("notes") notes?: string,
    @Body("observations") observations?: string,
  ) {
    return this.treatmentSessionService.completeSession(
      id,
      notes,
      observations,
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.treatmentSessionService.remove(id);
  }
}
