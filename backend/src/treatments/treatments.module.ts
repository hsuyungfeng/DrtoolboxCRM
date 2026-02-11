import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Treatment } from "./entities/treatment.entity";
import { TreatmentSession } from "./entities/treatment-session.entity";
import { TreatmentService } from "./services/treatment.service";
import { TreatmentSessionService } from "./services/treatment-session.service";
import { TreatmentController } from "./controllers/treatment.controller";
import { TreatmentSessionController } from "./controllers/treatment-session.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Treatment, TreatmentSession])],
  controllers: [TreatmentController, TreatmentSessionController],
  providers: [TreatmentService, TreatmentSessionService],
  exports: [TreatmentService, TreatmentSessionService],
})
export class TreatmentsModule {}
