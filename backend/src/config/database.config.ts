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
import { AuditLog } from "../common/audit/audit-log.entity";

const entities = [
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
  AuditLog,
];

const dbType = process.env.DB_TYPE || 'sqlite';

export const databaseConfig: TypeOrmModuleOptions = {
  type: dbType as any,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (dbType === 'postgres' ? '5432' : '0'), 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || (dbType === 'sqlite' ? join(process.cwd(), 'database.sqlite') : 'doctor_crm'),
  entities,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsRun: false,
  ssl: dbType === 'postgres' && process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
