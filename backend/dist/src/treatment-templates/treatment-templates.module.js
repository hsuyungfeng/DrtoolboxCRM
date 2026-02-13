"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const treatment_template_entity_1 = require("./entities/treatment-template.entity");
const treatment_template_service_1 = require("./services/treatment-template.service");
const treatment_template_controller_1 = require("./controllers/treatment-template.controller");
let TreatmentTemplatesModule = class TreatmentTemplatesModule {
};
exports.TreatmentTemplatesModule = TreatmentTemplatesModule;
exports.TreatmentTemplatesModule = TreatmentTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([treatment_template_entity_1.TreatmentTemplate])],
        controllers: [treatment_template_controller_1.TreatmentTemplateController],
        providers: [treatment_template_service_1.TreatmentTemplateService],
        exports: [treatment_template_service_1.TreatmentTemplateService],
    })
], TreatmentTemplatesModule);
//# sourceMappingURL=treatment-templates.module.js.map