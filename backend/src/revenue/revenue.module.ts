import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaffModule } from "../staff/staff.module";
import { RevenueRule } from "./entities/revenue-rule.entity";
import { RevenueRecord } from "./entities/revenue-record.entity";
import { RevenueAdjustment } from "./entities/revenue-adjustment.entity";
import { Treatment } from "../treatments/entities/treatment.entity";
import { TreatmentSession } from "../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../staff/entities/staff.entity";
import { RevenueRuleService } from "./services/revenue-rule.service";
import { RevenueRecordService } from "./services/revenue-record.service";
import { RevenueAdjustmentService } from "./services/revenue-adjustment.service";
import { RevenueCalculatorService } from "./services/revenue-calculator.service";
import { RevenueRuleEngine } from "./services/revenue-rule-engine.service";
import { RevenueEventListener } from "./listeners/revenue-event.listener";
import { RevenueRuleController } from "./controllers/revenue-rule.controller";
import { RevenueRecordController } from "./controllers/revenue-record.controller";
import { RevenueAdjustmentController } from "./controllers/revenue-adjustment.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRule,
      RevenueRecord,
      RevenueAdjustment,
      Treatment,
      TreatmentSession,
      TreatmentStaffAssignment,
      Staff,
    ]),
    StaffModule,
  ],
  controllers: [
    RevenueRuleController,
    RevenueRecordController,
    RevenueAdjustmentController,
  ],
  providers: [
    RevenueRuleService,
    RevenueRecordService,
    RevenueAdjustmentService,
    RevenueCalculatorService,
    RevenueRuleEngine,
    RevenueEventListener,
  ],
  exports: [
    RevenueRuleService,
    RevenueRecordService,
    RevenueAdjustmentService,
    RevenueCalculatorService,
    RevenueRuleEngine,
  ],
})
export class RevenueModule {}
