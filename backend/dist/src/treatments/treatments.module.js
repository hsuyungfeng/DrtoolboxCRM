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
const treatment_course_template_entity_1 = require("./entities/treatment-course-template.entity");
const treatment_course_entity_1 = require("./entities/treatment-course.entity");
const staff_assignment_entity_1 = require("./entities/staff-assignment.entity");
const medical_order_entity_1 = require("./entities/medical-order.entity");
const script_template_entity_1 = require("./entities/script-template.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const treatment_service_1 = require("./services/treatment.service");
const treatment_session_service_1 = require("./services/treatment-session.service");
const treatment_course_template_service_1 = require("./services/treatment-course-template.service");
const treatment_course_service_1 = require("./services/treatment-course.service");
const treatment_progress_service_1 = require("./services/treatment-progress.service");
const ppf_calculation_service_1 = require("./services/ppf-calculation.service");
const medical_order_service_1 = require("./services/medical-order.service");
const treatment_controller_1 = require("./controllers/treatment.controller");
const treatment_session_controller_1 = require("./controllers/treatment-session.controller");
const treatment_course_controller_1 = require("./controllers/treatment-course.controller");
const medical_order_controller_1 = require("./controllers/medical-order.controller");
const points_module_1 = require("../points/points.module");
const staff_module_1 = require("../staff/staff.module");
const treatment_staff_assignment_entity_1 = require("../staff/entities/treatment-staff-assignment.entity");
let TreatmentsModule = class TreatmentsModule {
};
exports.TreatmentsModule = TreatmentsModule;
exports.TreatmentsModule = TreatmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                treatment_entity_1.Treatment,
                treatment_session_entity_1.TreatmentSession,
                treatment_course_template_entity_1.TreatmentCourseTemplate,
                treatment_course_entity_1.TreatmentCourse,
                staff_assignment_entity_1.StaffAssignment,
                medical_order_entity_1.MedicalOrder,
                script_template_entity_1.ScriptTemplate,
                patient_entity_1.Patient,
                treatment_staff_assignment_entity_1.TreatmentStaffAssignment,
            ]),
            points_module_1.PointsModule,
            staff_module_1.StaffModule,
        ],
        controllers: [
            treatment_controller_1.TreatmentController,
            treatment_session_controller_1.TreatmentSessionController,
            treatment_course_controller_1.TreatmentCourseController,
            treatment_course_controller_1.StaffSessionController,
            medical_order_controller_1.MedicalOrderController,
        ],
        providers: [
            treatment_service_1.TreatmentService,
            treatment_session_service_1.TreatmentSessionService,
            treatment_course_template_service_1.TreatmentCourseTemplateService,
            treatment_course_service_1.TreatmentCourseService,
            treatment_progress_service_1.TreatmentProgressService,
            ppf_calculation_service_1.PPFCalculationService,
            medical_order_service_1.MedicalOrderService,
        ],
        exports: [
            treatment_service_1.TreatmentService,
            treatment_session_service_1.TreatmentSessionService,
            treatment_course_template_service_1.TreatmentCourseTemplateService,
            treatment_course_service_1.TreatmentCourseService,
            treatment_progress_service_1.TreatmentProgressService,
            ppf_calculation_service_1.PPFCalculationService,
            medical_order_service_1.MedicalOrderService,
        ],
    })
], TreatmentsModule);
//# sourceMappingURL=treatments.module.js.map