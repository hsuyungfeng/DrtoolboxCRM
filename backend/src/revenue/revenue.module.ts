import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaffModule } from "../staff/staff.module";
import { RevenueRule } from "./entities/revenue-rule.entity";
import { RevenueRecord } from "./entities/revenue-record.entity";
import { RevenueAdjustment } from "./entities/revenue-adjustment.entity";
import { Payment } from "./entities/payment.entity";
import { Invoice } from "./entities/invoice.entity";
import { ReconciliationReport } from "./entities/reconciliation-report.entity";
import { Treatment } from "../treatments/entities/treatment.entity";
import { TreatmentCourse } from "../treatments/entities/treatment-course.entity";
import { TreatmentTemplate } from "../treatment-templates/entities/treatment-template.entity";
import { Patient } from "../patients/entities/patient.entity";
import { TreatmentSession } from "../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../staff/entities/staff.entity";
import { RevenueRuleService } from "./services/revenue-rule.service";
import { RevenueRecordService } from "./services/revenue-record.service";
import { RevenueAdjustmentService } from "./services/revenue-adjustment.service";
import { RevenueCalculatorService } from "./services/revenue-calculator.service";
import { RevenueCalculationService } from "./services/revenue-calculation.service";
import { RevenueRuleEngine } from "./services/revenue-rule-engine.service";
import { PaymentService } from "./services/payment.service";
import { FeeCalculationService } from "./services/fee-calculation.service";
import { InvoiceService } from "./services/invoice.service";
import { RevenueReportService } from "./services/revenue-report.service";
import { ReconciliationService } from "./services/reconciliation.service";
import { RevenueEventListener } from "./listeners/revenue-event.listener";
import { RevenueRuleController } from "./controllers/revenue-rule.controller";
import { RevenueRecordController } from "./controllers/revenue-record.controller";
import { RevenueAdjustmentController } from "./controllers/revenue-adjustment.controller";
import { PaymentController } from "./controllers/payment.controller";
import { InvoiceController } from "./controllers/invoice.controller";
import { RevenueReportController } from "./controllers/revenue-report.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRule,
      RevenueRecord,
      RevenueAdjustment,
      Payment,
      Invoice,
      ReconciliationReport,
      Treatment,
      TreatmentCourse,
      TreatmentTemplate,
      Patient,
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
    PaymentController,
    InvoiceController,
    RevenueReportController,
  ],
  providers: [
    RevenueRuleService,
    RevenueRecordService,
    RevenueAdjustmentService,
    RevenueCalculatorService,
    RevenueCalculationService,
    RevenueRuleEngine,
    PaymentService,
    FeeCalculationService,
    InvoiceService,
    RevenueReportService,
    ReconciliationService,
    RevenueEventListener,
  ],
  exports: [
    RevenueRuleService,
    RevenueRecordService,
    RevenueAdjustmentService,
    RevenueCalculatorService,
    RevenueCalculationService,
    RevenueRuleEngine,
    PaymentService,
    FeeCalculationService,
    InvoiceService,
    RevenueReportService,
    ReconciliationService,
  ],
})
export class RevenueModule {}
