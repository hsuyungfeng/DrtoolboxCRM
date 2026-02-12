import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TreatmentTemplate } from "./entities/treatment-template.entity";
import { TreatmentTemplateService } from "./services/treatment-template.service";
import { TreatmentTemplateController } from "./controllers/treatment-template.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentTemplate])],
  controllers: [TreatmentTemplateController],
  providers: [TreatmentTemplateService],
  exports: [TreatmentTemplateService],
})
export class TreatmentTemplatesModule {}
