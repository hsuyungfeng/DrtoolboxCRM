import { DataSource } from "typeorm";
import { Patient } from "../src/patients/entities/patient.entity";
import { Staff } from "../src/staff/entities/staff.entity";
import { Treatment } from "../src/treatments/entities/treatment.entity";
import { TreatmentSession } from "../src/treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../src/staff/entities/treatment-staff-assignment.entity";
import { RevenueRule } from "../src/revenue/entities/revenue-rule.entity";

/**
 * 數據種子腳本
 * 
 * 此腳本用於創建測試數據，以便測試系統功能
 * 使用方法：npm run seed
 */
async function seed() {
  console.log("開始創建測試數據...");

  // 創建數據庫連接
  const dataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    entities: [
      Patient,
      Staff,
      Treatment,
      TreatmentSession,
      TreatmentStaffAssignment,
      RevenueRule,
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log("數據庫連接成功");

    // 清空現有數據（可選，謹慎使用）
    console.log("清空現有測試數據...");
    await dataSource.query("DELETE FROM treatment_staff_assignments");
    await dataSource.query("DELETE FROM treatment_sessions");
    await dataSource.query("DELETE FROM treatments");
    await dataSource.query("DELETE FROM revenue_rules");
    await dataSource.query("DELETE FROM staff");
    await dataSource.query("DELETE FROM patients");

    // 創建診所ID
    const clinicId = "clinic_001";

    // 1. 創建患者
    console.log("創建患者數據...");
    const patientRepository = dataSource.getRepository(Patient);
    const patient = new Patient();
    patient.id = "patient_001";
    patient.clinicId = clinicId;
    patient.name = "張三";
    patient.phoneNumber = "0912345678";
    patient.email = "zhangsan@example.com";
    patient.dateOfBirth = new Date("1980-01-01");
    patient.gender = "male";
    patient.emergencyContact = "李四";
    patient.emergencyPhone = "0987654321";
    patient.allergies = "無";
    patient.currentMedications = "無";
    patient.status = "active";
    await patientRepository.save(patient);

    // 2. 創建員工
    console.log("創建員工數據...");
    const staffRepository = dataSource.getRepository(Staff);
    
    const doctor = new Staff();
    doctor.id = "staff_001";
    doctor.clinicId = clinicId;
    doctor.name = "王醫師";
    doctor.phone = "0922333444";
    doctor.email = "doctor.wang@example.com";
    doctor.role = "doctor";
    doctor.specialty = "皮膚科";
    doctor.baseSalary = 80000;
    doctor.status = "active";

    const therapist = new Staff();
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

    // 3. 創建分潤規則
    console.log("創建分潤規則...");
    const revenueRuleRepository = dataSource.getRepository(RevenueRule);
    
    // 醫生分潤規則：百分比30%
    const doctorRule = new RevenueRule();
    doctorRule.id = "rule_001";
    doctorRule.clinicId = clinicId;
    doctorRule.ruleType = "percentage";
    doctorRule.rulePayload = { percentage: 30 };
    doctorRule.role = "doctor";
    doctorRule.isActive = true;
    doctorRule.effectiveFrom = new Date("2024-01-01");
    doctorRule.effectiveTo = null as any;
    doctorRule.description = "醫生分潤規則：30%療程收入";

    // 治療師分潤規則：固定金額1000元
    const therapistRule = new RevenueRule();
    therapistRule.id = "rule_002";
    therapistRule.clinicId = clinicId;
    therapistRule.ruleType = "fixed";
    therapistRule.rulePayload = { amount: 1000 };
    therapistRule.role = "therapist";
    therapistRule.isActive = true;
    therapistRule.effectiveFrom = new Date("2024-01-01");
    therapistRule.effectiveTo = null as any;
    therapistRule.description = "治療師分潤規則：每次療程固定1000元";

    // 階梯式分潤規則範例
    const tieredRule = new RevenueRule();
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
    tieredRule.effectiveTo = null as any;
    tieredRule.description = "顧問階梯式分潤規則";

    await revenueRuleRepository.save([doctorRule, therapistRule, tieredRule]);

    // 4. 創治療程
    console.log("創治療程數據...");
    const treatmentRepository = dataSource.getRepository(Treatment);
    const treatment = new Treatment();
    treatment.id = "treatment_001";
    treatment.clinicId = clinicId;
    treatment.patientId = patient.id;
    treatment.name = "激光治療療程";
    treatment.notes = "臉部激光治療，共5次";
    treatment.treatmentTemplateId = null as any;
    treatment.totalPrice = 50000;
    treatment.totalSessions = 5;
    treatment.completedSessions = 0;
    treatment.status = "pending";
    treatment.startDate = new Date("2024-03-01");
    treatment.expectedEndDate = new Date("2024-04-01");
    treatment.actualEndDate = null as any;
    await treatmentRepository.save(treatment);

    // 5. 創建員工分配
    console.log("創建員工分配...");
    const assignmentRepository = dataSource.getRepository(TreatmentStaffAssignment);
    
    const doctorAssignment = new TreatmentStaffAssignment();
    doctorAssignment.id = "assignment_001";
    doctorAssignment.treatmentId = treatment.id;
    doctorAssignment.staffId = doctor.id;
    doctorAssignment.role = "primary";
    doctorAssignment.revenuePercentage = 30;
    doctorAssignment.assignedAt = new Date();

    const therapistAssignment = new TreatmentStaffAssignment();
    therapistAssignment.id = "assignment_002";
    therapistAssignment.treatmentId = treatment.id;
    therapistAssignment.staffId = therapist.id;
    therapistAssignment.role = "assistant";
    therapistAssignment.revenuePercentage = 10;
    therapistAssignment.assignedAt = new Date();

    await assignmentRepository.save([doctorAssignment, therapistAssignment]);

    // 6. 創建療程次數（3次已完成，2次待執行）
    console.log("創建療程次數...");
    const sessionRepository = dataSource.getRepository(TreatmentSession);
    
    // 創建已完成的三次療程
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

    // 創建待執行的兩次療程
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
      const session = new TreatmentSession();
      session.id = sessionData.id;
      session.clinicId = sessionData.clinicId;
      session.treatmentId = sessionData.treatmentId;
      session.sessionIndex = sessionData.sessionIndex;
      session.scheduledTime = sessionData.scheduledTime;
      session.actualTime = sessionData.actualTime as any;
      session.status = sessionData.status;
      session.notes = sessionData.notes;
      session.observations = sessionData.observations as any;
      session.durationMinutes = sessionData.durationMinutes as any;
      session.revenueCalculated = sessionData.revenueCalculated;
      await sessionRepository.save(session);
    }

    // 更新治療的已完成次數
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

  } catch (error) {
    console.error("創建測試數據時發生錯誤:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("數據庫連接已關閉");
    }
  }
}

// 執行種子腳本
if (require.main === module) {
  seed().catch((error) => {
    console.error("未預期的錯誤:", error);
    process.exit(1);
  });
}

export { seed };