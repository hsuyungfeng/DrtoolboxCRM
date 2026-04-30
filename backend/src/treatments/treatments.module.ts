import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Treatment } from "./entities/treatment.entity";
import { TreatmentSession } from "./entities/treatment-session.entity";
import { TreatmentCourseTemplate } from "./entities/treatment-course-template.entity";
import { TreatmentCourse } from "./entities/treatment-course.entity";
import { StaffAssignment } from "./entities/staff-assignment.entity";
import { MedicalOrder } from "./entities/medical-order.entity";
import { ScriptTemplate } from "./entities/script-template.entity";
import { TreatmentTemplate } from "../treatment-templates/entities/treatment-template.entity";
import { Patient } from "../patients/entities/patient.entity";
import { TreatmentService } from "./services/treatment.service";
import { TreatmentSessionService } from "./services/treatment-session.service";
import { TreatmentCourseTemplateService } from "./services/treatment-course-template.service";
import { TreatmentCourseService } from "./services/treatment-course.service";
import { TreatmentProgressService } from "./services/treatment-progress.service";
import { PPFCalculationService } from "./services/ppf-calculation.service";
import { MedicalOrderService } from "./services/medical-order.service";
import { TreatmentController } from "./controllers/treatment.controller";
import { TreatmentSessionController } from "./controllers/treatment-session.controller";
import {
  TreatmentCourseController,
  StaffSessionController,
} from "./controllers/treatment-course.controller";
import { MedicalOrderController } from "./controllers/medical-order.controller";
import { PointsModule } from "../points/points.module";
import { StaffModule } from "../staff/staff.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AttributesModule } from "../common/attributes/attributes.module";
import { TreatmentEventListener } from "./listeners/treatment-event.listener";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Treatment,
      TreatmentSession,
      TreatmentCourseTemplate,
      TreatmentCourse,
      StaffAssignment,
      MedicalOrder,
      ScriptTemplate,
      TreatmentTemplate,
      Patient,
    ]),
    PointsModule,
    StaffModule,
    NotificationsModule,
    AttributesModule,
  ],
  controllers: [
    TreatmentCourseController,
    TreatmentSessionController,
    StaffSessionController,
    MedicalOrderController,
    TreatmentController,
  ],
  providers: [
    TreatmentService,
    TreatmentSessionService,
    TreatmentCourseTemplateService,
    TreatmentCourseService,
    TreatmentProgressService,
    PPFCalculationService,
    MedicalOrderService,
    TreatmentEventListener,
  ],
  exports: [
    TreatmentService,
    TreatmentSessionService,
    TreatmentCourseTemplateService,
    TreatmentCourseService,
    TreatmentProgressService,
    PPFCalculationService,
    MedicalOrderService,
  ],
})
export class TreatmentsModule {}
