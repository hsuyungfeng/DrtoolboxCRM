import { PartialType } from "@nestjs/mapped-types";
import { CreateTreatmentTemplateDto } from "./create-treatment-template.dto";

export class UpdateTreatmentTemplateDto extends PartialType(
  CreateTreatmentTemplateDto,
) {}
