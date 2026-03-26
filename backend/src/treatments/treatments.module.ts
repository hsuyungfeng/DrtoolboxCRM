import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Treatment } from "./entities/treatment.entity";
import { TreatmentSession } from "./entities/treatment-session.entity";
import { TreatmentCourseTemplate } from "./entities/treatment-course-template.entity";
import { TreatmentCourse } from "./entities/treatment-course.entity";
import { StaffAssignment } from "./entities/staff-assignment.entity";
import { TreatmentService } from "./services/treatment.service";
import { TreatmentSessionService } from "./services/treatment-session.service";
import { TreatmentCourseTemplateService } from "./services/treatment-course-template.service";
import { TreatmentCourseService } from "./services/treatment-course.service";
import { TreatmentProgressService } from "./services/treatment-progress.service";
import { PPFCalculationService } from "./services/ppf-calculation.service";
import { TreatmentController } from "./controllers/treatment.controller";
import { TreatmentSessionController } from "./controllers/treatment-session.controller";
import {
  TreatmentCourseController,
  StaffSessionController,
} from "./controllers/treatment-course.controller";
import { PointsModule } from "../points/points.module";
import { StaffModule } from "../staff/staff.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Treatment,
      TreatmentSession,
      TreatmentCourseTemplate,
      TreatmentCourse,
      StaffAssignment,
    ]),
    PointsModule,
    StaffModule,
  ],
  controllers: [
    TreatmentController,
    TreatmentSessionController,
    TreatmentCourseController,
    StaffSessionController,
  ],
  providers: [
    TreatmentService,
    TreatmentSessionService,
    TreatmentCourseTemplateService,
    TreatmentCourseService,
    TreatmentProgressService,
    PPFCalculationService,
  ],
  exports: [
    TreatmentService,
    TreatmentSessionService,
    TreatmentCourseTemplateService,
    TreatmentCourseService,
    TreatmentProgressService,
    PPFCalculationService,
  ],
})
export class TreatmentsModule {}
