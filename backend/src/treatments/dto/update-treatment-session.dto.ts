import { PartialType } from "@nestjs/mapped-types";
import { CreateTreatmentSessionDto } from "./create-treatment-session.dto";

export class UpdateTreatmentSessionDto extends PartialType(
  CreateTreatmentSessionDto,
) {}
