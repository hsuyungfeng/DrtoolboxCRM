"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const referral_entity_1 = require("./entities/referral.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const staff_entity_1 = require("../staff/entities/staff.entity");
const treatment_entity_1 = require("../treatments/entities/treatment.entity");
const referral_service_1 = require("./services/referral.service");
const referral_controller_1 = require("./controllers/referral.controller");
const referral_event_listener_1 = require("./listeners/referral-event.listener");
const points_module_1 = require("../points/points.module");
let ReferralsModule = class ReferralsModule {
};
exports.ReferralsModule = ReferralsModule;
exports.ReferralsModule = ReferralsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([referral_entity_1.Referral, patient_entity_1.Patient, staff_entity_1.Staff, treatment_entity_1.Treatment]),
            points_module_1.PointsModule,
        ],
        providers: [referral_service_1.ReferralService, referral_event_listener_1.ReferralEventListener],
        controllers: [referral_controller_1.ReferralController],
        exports: [referral_service_1.ReferralService],
    })
], ReferralsModule);
//# sourceMappingURL=referrals.module.js.map