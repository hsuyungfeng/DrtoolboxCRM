"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const staff_module_1 = require("../staff/staff.module");
const revenue_rule_entity_1 = require("./entities/revenue-rule.entity");
const revenue_record_entity_1 = require("./entities/revenue-record.entity");
const revenue_adjustment_entity_1 = require("./entities/revenue-adjustment.entity");
const payment_entity_1 = require("./entities/payment.entity");
const invoice_entity_1 = require("./entities/invoice.entity");
const treatment_entity_1 = require("../treatments/entities/treatment.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const treatment_session_entity_1 = require("../treatments/entities/treatment-session.entity");
const treatment_staff_assignment_entity_1 = require("../staff/entities/treatment-staff-assignment.entity");
const staff_entity_1 = require("../staff/entities/staff.entity");
const revenue_rule_service_1 = require("./services/revenue-rule.service");
const revenue_record_service_1 = require("./services/revenue-record.service");
const revenue_adjustment_service_1 = require("./services/revenue-adjustment.service");
const revenue_calculator_service_1 = require("./services/revenue-calculator.service");
const revenue_calculation_service_1 = require("./services/revenue-calculation.service");
const revenue_rule_engine_service_1 = require("./services/revenue-rule-engine.service");
const payment_service_1 = require("./services/payment.service");
const fee_calculation_service_1 = require("./services/fee-calculation.service");
const invoice_service_1 = require("./services/invoice.service");
const revenue_report_service_1 = require("./services/revenue-report.service");
const revenue_event_listener_1 = require("./listeners/revenue-event.listener");
const revenue_rule_controller_1 = require("./controllers/revenue-rule.controller");
const revenue_record_controller_1 = require("./controllers/revenue-record.controller");
const revenue_adjustment_controller_1 = require("./controllers/revenue-adjustment.controller");
const payment_controller_1 = require("./controllers/payment.controller");
const invoice_controller_1 = require("./controllers/invoice.controller");
const revenue_report_controller_1 = require("./controllers/revenue-report.controller");
let RevenueModule = class RevenueModule {
};
exports.RevenueModule = RevenueModule;
exports.RevenueModule = RevenueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                revenue_rule_entity_1.RevenueRule,
                revenue_record_entity_1.RevenueRecord,
                revenue_adjustment_entity_1.RevenueAdjustment,
                payment_entity_1.Payment,
                invoice_entity_1.Invoice,
                treatment_entity_1.Treatment,
                patient_entity_1.Patient,
                treatment_session_entity_1.TreatmentSession,
                treatment_staff_assignment_entity_1.TreatmentStaffAssignment,
                staff_entity_1.Staff,
            ]),
            staff_module_1.StaffModule,
        ],
        controllers: [
            revenue_rule_controller_1.RevenueRuleController,
            revenue_record_controller_1.RevenueRecordController,
            revenue_adjustment_controller_1.RevenueAdjustmentController,
            payment_controller_1.PaymentController,
            invoice_controller_1.InvoiceController,
            revenue_report_controller_1.RevenueReportController,
        ],
        providers: [
            revenue_rule_service_1.RevenueRuleService,
            revenue_record_service_1.RevenueRecordService,
            revenue_adjustment_service_1.RevenueAdjustmentService,
            revenue_calculator_service_1.RevenueCalculatorService,
            revenue_calculation_service_1.RevenueCalculationService,
            revenue_rule_engine_service_1.RevenueRuleEngine,
            payment_service_1.PaymentService,
            fee_calculation_service_1.FeeCalculationService,
            invoice_service_1.InvoiceService,
            revenue_report_service_1.RevenueReportService,
            revenue_event_listener_1.RevenueEventListener,
        ],
        exports: [
            revenue_rule_service_1.RevenueRuleService,
            revenue_record_service_1.RevenueRecordService,
            revenue_adjustment_service_1.RevenueAdjustmentService,
            revenue_calculator_service_1.RevenueCalculatorService,
            revenue_calculation_service_1.RevenueCalculationService,
            revenue_rule_engine_service_1.RevenueRuleEngine,
            payment_service_1.PaymentService,
            fee_calculation_service_1.FeeCalculationService,
            invoice_service_1.InvoiceService,
            revenue_report_service_1.RevenueReportService,
        ],
    })
], RevenueModule);
//# sourceMappingURL=revenue.module.js.map