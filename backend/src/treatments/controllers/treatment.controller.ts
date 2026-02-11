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
import { TreatmentService } from "../services/treatment.service";
import { CreateTreatmentDto } from "../dto/create-treatment.dto";
import { UpdateTreatmentDto } from "../dto/update-treatment.dto";

@Controller("treatments")
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  create(@Body() createTreatmentDto: CreateTreatmentDto) {
    return this.treatmentService.create(createTreatmentDto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.treatmentService.findAll(clinicId);
  }

  @Get("patient/:patientId")
  findByPatientId(@Param("patientId") patientId: string) {
    return this.treatmentService.findByPatientId(patientId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.treatmentService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    return this.treatmentService.update(id, updateTreatmentDto);
  }

  @Patch(":id/complete-sessions")
  updateCompletedSessions(
    @Param("id") id: string,
    @Body("completedSessions") completedSessions: number,
  ) {
    return this.treatmentService.updateCompletedSessions(id, completedSessions);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.treatmentService.remove(id);
  }
}
