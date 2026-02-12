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
import { PatientService } from "../services/patient.service";
import { CreatePatientDto } from "../dto/create-patient.dto";
import { UpdatePatientDto } from "../dto/update-patient.dto";

@Controller("patients")
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientService.create(createPatientDto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.patientService.findAll(clinicId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.patientService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.patientService.remove(id);
  }
}
