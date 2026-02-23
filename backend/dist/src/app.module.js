"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_config_1 = require("./config/database.config");
const patients_module_1 = require("./patients/patients.module");
const treatments_module_1 = require("./treatments/treatments.module");
const staff_module_1 = require("./staff/staff.module");
const revenue_module_1 = require("./revenue/revenue.module");
const auth_module_1 = require("./auth/auth.module");
const points_module_1 = require("./points/points.module");
const referrals_module_1 = require("./referrals/referrals.module");
const treatment_templates_module_1 = require("./treatment-templates/treatment-templates.module");
const audit_1 = require("./common/audit");
const ai_module_1 = require("./ai/ai.module");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot(database_config_1.databaseConfig),
            event_emitter_1.EventEmitterModule.forRoot(),
            audit_1.AuditModule,
            ai_module_1.AiModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            patients_module_1.PatientsModule,
            treatments_module_1.TreatmentsModule,
            treatment_templates_module_1.TreatmentTemplatesModule,
            staff_module_1.StaffModule,
            revenue_module_1.RevenueModule,
            points_module_1.PointsModule,
            referrals_module_1.ReferralsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map