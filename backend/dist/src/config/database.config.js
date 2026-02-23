"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const path_1 = require("path");
const staff_entity_1 = require("../staff/entities/staff.entity");
const treatment_staff_assignment_entity_1 = require("../staff/entities/treatment-staff-assignment.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const treatment_entity_1 = require("../treatments/entities/treatment.entity");
const treatment_session_entity_1 = require("../treatments/entities/treatment-session.entity");
const staff_assignment_entity_1 = require("../treatments/entities/staff-assignment.entity");
const treatment_template_entity_1 = require("../treatment-templates/entities/treatment-template.entity");
const treatment_course_template_entity_1 = require("../treatments/entities/treatment-course-template.entity");
const treatment_course_entity_1 = require("../treatments/entities/treatment-course.entity");
const revenue_record_entity_1 = require("../revenue/entities/revenue-record.entity");
const revenue_rule_entity_1 = require("../revenue/entities/revenue-rule.entity");
const revenue_adjustment_entity_1 = require("../revenue/entities/revenue-adjustment.entity");
const points_config_entity_1 = require("../points/entities/points-config.entity");
const points_balance_entity_1 = require("../points/entities/points-balance.entity");
const points_transaction_entity_1 = require("../points/entities/points-transaction.entity");
const audit_log_entity_1 = require("../common/audit/audit-log.entity");
const entities = [
    staff_entity_1.Staff,
    treatment_staff_assignment_entity_1.TreatmentStaffAssignment,
    patient_entity_1.Patient,
    treatment_entity_1.Treatment,
    treatment_session_entity_1.TreatmentSession,
    staff_assignment_entity_1.StaffAssignment,
    treatment_template_entity_1.TreatmentTemplate,
    treatment_course_template_entity_1.TreatmentCourseTemplate,
    treatment_course_entity_1.TreatmentCourse,
    revenue_record_entity_1.RevenueRecord,
    revenue_rule_entity_1.RevenueRule,
    revenue_adjustment_entity_1.RevenueAdjustment,
    points_config_entity_1.PointsConfig,
    points_balance_entity_1.PointsBalance,
    points_transaction_entity_1.PointsTransaction,
    audit_log_entity_1.AuditLog,
];
const dbType = process.env.DB_TYPE || 'sqlite';
exports.databaseConfig = {
    type: dbType,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || (dbType === 'postgres' ? '5432' : '0'), 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || (dbType === 'sqlite' ? (0, path_1.join)(process.cwd(), 'database.sqlite') : 'doctor_crm'),
    entities,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    migrations: [(0, path_1.join)(__dirname, '../migrations/*{.ts,.js}')],
    migrationsRun: false,
    ssl: dbType === 'postgres' && process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
//# sourceMappingURL=database.config.js.map