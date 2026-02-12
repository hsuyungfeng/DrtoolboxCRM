"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const treatment_entity_1 = require("./entities/treatment.entity");
const treatment_session_entity_1 = require("./entities/treatment-session.entity");
const treatment_service_1 = require("./services/treatment.service");
const treatment_session_service_1 = require("./services/treatment-session.service");
const treatment_controller_1 = require("./controllers/treatment.controller");
const treatment_session_controller_1 = require("./controllers/treatment-session.controller");
let TreatmentsModule = class TreatmentsModule {
};
exports.TreatmentsModule = TreatmentsModule;
exports.TreatmentsModule = TreatmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([treatment_entity_1.Treatment, treatment_session_entity_1.TreatmentSession])],
        controllers: [treatment_controller_1.TreatmentController, treatment_session_controller_1.TreatmentSessionController],
        providers: [treatment_service_1.TreatmentService, treatment_session_service_1.TreatmentSessionService],
        exports: [treatment_service_1.TreatmentService, treatment_session_service_1.TreatmentSessionService],
    })
], TreatmentsModule);
//# sourceMappingURL=treatments.module.js.map