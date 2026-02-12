import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { TreatmentTemplateService } from "../services/treatment-template.service";
import { CreateTreatmentTemplateDto } from "../dto/create-treatment-template.dto";
import { UpdateTreatmentTemplateDto } from "../dto/update-treatment-template.dto";

@Controller("treatment-templates")
export class TreatmentTemplateController {
  constructor(
    private readonly templateService: TreatmentTemplateService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTreatmentTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get()
  async findAll(@Query("clinicId") clinicId: string) {
    return this.templateService.findAll(clinicId);
  }

  @Get(":id")
  async findById(
    @Param("id") id: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.templateService.findById(id, clinicId);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Query("clinicId") clinicId: string,
    @Body() dto: UpdateTreatmentTemplateDto,
  ) {
    return this.templateService.update(id, clinicId, dto);
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Query("clinicId") clinicId: string,
  ) {
    return this.templateService.delete(id, clinicId);
  }
}
