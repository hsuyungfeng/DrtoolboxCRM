"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const typeorm_1 = require("typeorm");
const patient_entity_1 = require("../src/patients/entities/patient.entity");
const staff_entity_1 = require("../src/staff/entities/staff.entity");
const treatment_entity_1 = require("../src/treatments/entities/treatment.entity");
const treatment_session_entity_1 = require("../src/treatments/entities/treatment-session.entity");
const treatment_staff_assignment_entity_1 = require("../src/staff/entities/treatment-staff-assignment.entity");
const revenue_rule_entity_1 = require("../src/revenue/entities/revenue-rule.entity");
async function seed() {
    console.log("開始創建測試數據...");
    const dataSource = new typeorm_1.DataSource({
        type: "sqlite",
        database: "database.sqlite",
        entities: [
            patient_entity_1.Patient,
            staff_entity_1.Staff,
            treatment_entity_1.Treatment,
            treatment_session_entity_1.TreatmentSession,
            treatment_staff_assignment_entity_1.TreatmentStaffAssignment,
            revenue_rule_entity_1.RevenueRule,
        ],
        synchronize: false,
        logging: true,
    });
    try {
        await dataSource.initialize();
        console.log("數據庫連接成功");
        console.log("清空現有測試數據...");
        await dataSource.query("DELETE FROM treatment_staff_assignments");
        await dataSource.query("DELETE FROM treatment_sessions");
        await dataSource.query("DELETE FROM treatments");
        await dataSource.query("DELETE FROM revenue_rules");
        await dataSource.query("DELETE FROM staff");
        await dataSource.query("DELETE FROM patients");
        const clinicId = "clinic_001";
        console.log("創建患者數據...");
        const patientRepository = dataSource.getRepository(patient_entity_1.Patient);
        const patient = new patient_entity_1.Patient();
        patient.id = "patient_001";
        patient.clinicId = clinicId;
        patient.name = "張三";
        patient.phone = "0912345678";
        patient.email = "zhangsan@example.com";
        patient.dateOfBirth = new Date("1980-01-01");
        patient.gender = "male";
        patient.emergencyContact = "李四";
        patient.emergencyPhone = "0987654321";
        patient.allergies = "無";
        patient.currentMedications = "無";
        patient.medicalNotes = "健康狀況良好";
        patient.status = "active";
        await patientRepository.save(patient);
        console.log("創建員工數據...");
        const staffRepository = dataSource.getRepository(staff_entity_1.Staff);
        const doctor = new staff_entity_1.Staff();
        doctor.id = "staff_001";
        doctor.clinicId = clinicId;
        doctor.name = "王醫師";
        doctor.phone = "0922333444";
        doctor.email = "doctor.wang@example.com";
        doctor.role = "doctor";
        doctor.specialty = "皮膚科";
        doctor.baseSalary = 80000;
        doctor.status = "active";
        const therapist = new staff_entity_1.Staff();
        therapist.id = "staff_002";
        therapist.clinicId = clinicId;
        therapist.name = "李治療師";
        therapist.phone = "0933444555";
        therapist.email = "therapist.li@example.com";
        therapist.role = "therapist";
        therapist.specialty = "物理治療";
        therapist.baseSalary = 50000;
        therapist.status = "active";
        await staffRepository.save([doctor, therapist]);
        console.log("創建分潤規則...");
        const revenueRuleRepository = dataSource.getRepository(revenue_rule_entity_1.RevenueRule);
        const doctorRule = new revenue_rule_entity_1.RevenueRule();
        doctorRule.id = "rule_001";
        doctorRule.clinicId = clinicId;
        doctorRule.ruleType = "percentage";
        doctorRule.rulePayload = { percentage: 30 };
        doctorRule.role = "doctor";
        doctorRule.isActive = true;
        doctorRule.effectiveFrom = new Date("2024-01-01");
        doctorRule.effectiveTo = null;
        doctorRule.description = "醫生分潤規則：30%療程收入";
        const therapistRule = new revenue_rule_entity_1.RevenueRule();
        therapistRule.id = "rule_002";
        therapistRule.clinicId = clinicId;
        therapistRule.ruleType = "fixed";
        therapistRule.rulePayload = { amount: 1000 };
        therapistRule.role = "therapist";
        therapistRule.isActive = true;
        therapistRule.effectiveFrom = new Date("2024-01-01");
        therapistRule.effectiveTo = null;
        therapistRule.description = "治療師分潤規則：每次療程固定1000元";
        const tieredRule = new revenue_rule_entity_1.RevenueRule();
        tieredRule.id = "rule_003";
        tieredRule.clinicId = clinicId;
        tieredRule.ruleType = "tiered";
        tieredRule.rulePayload = {
            tiers: [
                { threshold: 10000, percentage: 20 },
                { threshold: 50000, percentage: 25 },
                { threshold: 100000, percentage: 30 },
            ],
        };
        tieredRule.role = "consultant";
        tieredRule.isActive = true;
        tieredRule.effectiveFrom = new Date("2024-01-01");
        tieredRule.effectiveTo = null;
        tieredRule.description = "顧問階梯式分潤規則";
        await revenueRuleRepository.save([doctorRule, therapistRule, tieredRule]);
        console.log("創治療程數據...");
        const treatmentRepository = dataSource.getRepository(treatment_entity_1.Treatment);
        const treatment = new treatment_entity_1.Treatment();
        treatment.id = "treatment_001";
        treatment.clinicId = clinicId;
        treatment.patientId = patient.id;
        treatment.name = "激光治療療程";
        treatment.notes = "臉部激光治療，共5次";
        treatment.treatmentTemplateId = null;
        treatment.totalPrice = 50000;
        treatment.totalSessions = 5;
        treatment.completedSessions = 0;
        treatment.status = "pending";
        treatment.startDate = new Date("2024-03-01");
        treatment.expectedEndDate = new Date("2024-04-01");
        treatment.actualEndDate = null;
        await treatmentRepository.save(treatment);
        console.log("創建員工分配...");
        const assignmentRepository = dataSource.getRepository(treatment_staff_assignment_entity_1.TreatmentStaffAssignment);
        const doctorAssignment = new treatment_staff_assignment_entity_1.TreatmentStaffAssignment();
        doctorAssignment.id = "assignment_001";
        doctorAssignment.treatmentId = treatment.id;
        doctorAssignment.staffId = doctor.id;
        doctorAssignment.role = "primary";
        doctorAssignment.revenuePercentage = 30;
        doctorAssignment.assignedAt = new Date();
        const therapistAssignment = new treatment_staff_assignment_entity_1.TreatmentStaffAssignment();
        therapistAssignment.id = "assignment_002";
        therapistAssignment.treatmentId = treatment.id;
        therapistAssignment.staffId = therapist.id;
        therapistAssignment.role = "assistant";
        therapistAssignment.revenuePercentage = 10;
        therapistAssignment.assignedAt = new Date();
        await assignmentRepository.save([doctorAssignment, therapistAssignment]);
        console.log("創建療程次數...");
        const sessionRepository = dataSource.getRepository(treatment_session_entity_1.TreatmentSession);
        const completedSessions = [
            {
                id: "session_001",
                clinicId,
                treatmentId: treatment.id,
                sessionIndex: 1,
                scheduledTime: new Date("2024-03-01 10:00:00"),
                actualTime: new Date("2024-03-01 10:15:00"),
                status: "completed",
                notes: "第一次治療順利完成",
                observations: "患者反應良好",
                durationMinutes: 60,
                revenueCalculated: false,
            },
            {
                id: "session_002",
                clinicId,
                treatmentId: treatment.id,
                sessionIndex: 2,
                scheduledTime: new Date("2024-03-08 10:00:00"),
                actualTime: new Date("2024-03-08 10:10:00"),
                status: "completed",
                notes: "第二次治療，患者反應良好",
                observations: "無特殊狀況",
                durationMinutes: 60,
                revenueCalculated: false,
            },
            {
                id: "session_003",
                clinicId,
                treatmentId: treatment.id,
                sessionIndex: 3,
                scheduledTime: new Date("2024-03-15 10:00:00"),
                actualTime: new Date("2024-03-15 10:20:00"),
                status: "completed",
                notes: "第三次治療完成",
                observations: "治療進展順利",
                durationMinutes: 60,
                revenueCalculated: false,
            },
        ];
        const scheduledSessions = [
            {
                id: "session_004",
                clinicId,
                treatmentId: treatment.id,
                sessionIndex: 4,
                scheduledTime: new Date("2024-03-22 10:00:00"),
                actualTime: null,
                status: "scheduled",
                notes: "待執行",
                observations: null,
                durationMinutes: null,
                revenueCalculated: false,
            },
            {
                id: "session_005",
                clinicId,
                treatmentId: treatment.id,
                sessionIndex: 5,
                scheduledTime: new Date("2024-03-29 10:00:00"),
                actualTime: null,
                status: "scheduled",
                notes: "待執行",
                observations: null,
                durationMinutes: null,
                revenueCalculated: false,
            },
        ];
        for (const sessionData of [...completedSessions, ...scheduledSessions]) {
            const session = new treatment_session_entity_1.TreatmentSession();
            session.id = sessionData.id;
            session.clinicId = sessionData.clinicId;
            session.treatmentId = sessionData.treatmentId;
            session.sessionIndex = sessionData.sessionIndex;
            session.scheduledTime = sessionData.scheduledTime;
            session.actualTime = sessionData.actualTime;
            session.status = sessionData.status;
            session.notes = sessionData.notes;
            session.observations = sessionData.observations;
            session.durationMinutes = sessionData.durationMinutes;
            session.revenueCalculated = sessionData.revenueCalculated;
            await sessionRepository.save(session);
        }
        treatment.completedSessions = 3;
        await treatmentRepository.save(treatment);
        console.log("測試數據創建完成！");
        console.log("========== 測試數據摘要 ==========");
        console.log(`診所ID: ${clinicId}`);
        console.log(`患者: ${patient.name} (${patient.id})`);
        console.log(`員工: 醫生 ${doctor.name}, 治療師 ${therapist.name}`);
        console.log(`療程: ${treatment.name} - 已完成 ${treatment.completedSessions}/${treatment.totalSessions} 次`);
        console.log(`分潤規則: 3條規則已創建`);
        console.log(`療程次數: 5次已創建 (3次完成, 2次待執行)`);
        console.log("==================================");
    }
    catch (error) {
        console.error("創建測試數據時發生錯誤:", error);
        process.exit(1);
    }
    finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log("數據庫連接已關閉");
        }
    }
}
if (require.main === module) {
    seed().catch((error) => {
        console.error("未預期的錯誤:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed-data.js.map