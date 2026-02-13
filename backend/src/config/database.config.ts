import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import { Staff } from "../staff/entities/staff.entity";
import { TreatmentStaffAssignment } from "../staff/entities/treatment-staff-assignment.entity";
import { Patient } from "../patients/entities/patient.entity";
import { Treatment } from "../treatments/entities/treatment.entity";
import { TreatmentSession } from "../treatments/entities/treatment-session.entity";
import { StaffAssignment } from "../treatments/entities/staff-assignment.entity";
import { TreatmentTemplate } from "../treatment-templates/entities/treatment-template.entity";
import { TreatmentCourseTemplate } from "../treatments/entities/treatment-course-template.entity";
import { TreatmentCourse } from "../treatments/entities/treatment-course.entity";
import { RevenueRecord } from "../revenue/entities/revenue-record.entity";
import { RevenueRule } from "../revenue/entities/revenue-rule.entity";
import { RevenueAdjustment } from "../revenue/entities/revenue-adjustment.entity";
import { PointsConfig } from "../points/entities/points-config.entity";
import { PointsBalance } from "../points/entities/points-balance.entity";
import { PointsTransaction } from "../points/entities/points-transaction.entity";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "sqlite",
  database: join(process.cwd(), "database.sqlite"),
  entities: [
    Staff,
    TreatmentStaffAssignment,
    Patient,
    Treatment,
    TreatmentSession,
    StaffAssignment,
    TreatmentTemplate,
    TreatmentCourseTemplate,
    TreatmentCourse,
    RevenueRecord,
    RevenueRule,
    RevenueAdjustment,
    PointsConfig,
    PointsBalance,
    PointsTransaction,
  ],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  migrations: [join(__dirname, "../migrations/*{.ts,.js}")],
  migrationsRun: false,
};
