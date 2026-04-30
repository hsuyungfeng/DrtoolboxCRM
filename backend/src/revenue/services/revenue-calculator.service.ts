import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import Decimal from "decimal.js";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentCourse } from "../../treatments/entities/treatment-course.entity";
import { TreatmentTemplate } from "../../treatment-templates/entities/treatment-template.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../../staff/entities/staff.entity";

// 設置 Decimal 精度為 8 位小數，四捨五入
Decimal.set({ precision: 8, rounding: Decimal.ROUND_HALF_UP });

export interface RevenueCalculationResult {
  treatmentId?: string;
  treatmentCourseId?: string;
  sessionId?: string;
  staffId: string;
  role: string;
  amount: number;
  ruleId: string;
  calculationDetails: Record<string, unknown>;
}

export interface RevenueCalculationRequest {
  treatmentId?: string;
  treatmentCourseId?: string;
  sessionId: string;
  clinicId: string;
}

@Injectable()
export class RevenueCalculatorService {
  private readonly logger = new Logger(RevenueCalculatorService.name);

  constructor(
    @InjectRepository(RevenueRule)
    private revenueRuleRepository: Repository<RevenueRule>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(TreatmentCourse)
    private treatmentCourseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentTemplate)
    private templateRepository: Repository<TreatmentTemplate>,
    @InjectRepository(TreatmentSession)
    private treatmentSessionRepository: Repository<TreatmentSession>,
    @InjectRepository(TreatmentStaffAssignment)
    private staffAssignmentRepository: Repository<TreatmentStaffAssignment>,
    @InjectRepository(RevenueRecord)
    private revenueRecordRepository: Repository<RevenueRecord>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    private dataSource: DataSource,
  ) {}

  /**
   * 核心分潤計算邏輯：單次操作完成時觸發
   */
  async handleCompletedSession(sessionId: string): Promise<RevenueRecord[]> {
    const session = await this.treatmentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["treatment", "treatmentCourse"],
    });

    if (!session) throw new Error(`TreatmentSession ${sessionId} not found`);
    if (session.status !== "completed" && session.completionStatus !== "completed") {
      this.logger.warn(`Session ${sessionId} is not marked as completed. Skipping calculation.`);
      return [];
    }

    const clinicId = session.clinicId;
    const results: RevenueCalculationResult[] = [];

    // 1. 確定所屬療程 (Treatment 或 TreatmentCourse)
    let parent: any = session.treatment || session.treatmentCourse;
    if (!parent && session.treatmentCourseId) {
      parent = await this.treatmentCourseRepository.findOne({ where: { id: session.treatmentCourseId } });
    }
    
    if (!parent) throw new Error(`No parent treatment found for session ${sessionId}`);

    // 2. 獲取模板與自定義分潤
    const templateId = parent.treatmentTemplateId || parent.templateId;
    let customRules: any[] | null = null;
    if (templateId) {
      const template = await this.templateRepository.findOne({ where: { id: templateId } });
      customRules = template?.customRevenueRules || null;
    }

    // 3. 計算基礎金額 (單次價格)
    // 優先使用實體中的單次價格，若無則計算平均值
    const totalAmount = new Decimal(parent.totalPrice || parent.purchaseAmount || 0);
    const totalSessions = parent.totalSessions || 1;
    const baseAmount = session.sessionPrice ? new Decimal(session.sessionPrice) : totalAmount.div(totalSessions);

    // 4. 計算分潤
    if (customRules && customRules.length > 0) {
      // --- 使用模板指定的自定義分潤 ---
      for (const rule of customRules) {
        // rule 格式: { staffIdOrRole: string, ruleType: 'percentage' | 'fixed', value: number }
        let staffId = rule.staffIdOrRole;
        let staff: Staff | null = null;

        // 🚨 Step 3: 處理動態角色 (dynamic_doctor, dynamic_therapist)
        if (staffId === "dynamic_doctor" || staffId === "dynamic_therapist") {
          const targetRole = staffId === "dynamic_doctor" ? "doctor" : "therapist";
          
          // 優先從 session.executedBy/executedRole 獲取
          if (session.executedBy && session.executedRole === targetRole) {
            staffId = session.executedBy;
          } else {
            // 如果 session 沒記，嘗試從該次 session 的 staffAssignments 中尋找匹配角色的第一個員工
            const sessionAssignments = await this.dataSource
              .getRepository("StaffAssignment")
              .find({
                where: { sessionId: session.id, staffRole: targetRole } as any,
                relations: ["staff"] as any,
              });
            
            if (sessionAssignments && sessionAssignments.length > 0) {
              const sa = sessionAssignments[0] as any;
              staffId = sa.staffId;
              staff = sa.staff;
            } else {
              this.logger.warn(`Dynamic role ${staffId} not found for session ${sessionId}. Skipping.`);
              continue;
            }
          }
        }

        if (!staff) {
          staff = await this.staffRepository.findOne({ where: { id: staffId, clinicId } });
        }

        if (!staff) {
          this.logger.warn(`Staff ${staffId} not found for revenue calculation in session ${sessionId}`);
          continue;
        }

        const amount = this.calculateValue(baseAmount, rule.ruleType, rule.value);
        results.push({
          treatmentId: session.treatmentId,
          treatmentCourseId: session.treatmentCourseId,
          sessionId,
          staffId: staff.id,
          role: staff.role,
          amount,
          ruleId: `template-${templateId}`,
          calculationDetails: {
            source: 'template_custom_rule',
            ruleType: rule.ruleType,
            ruleValue: rule.value,
            baseAmount: baseAmount.toNumber(),
            dynamicRole: rule.staffIdOrRole.startsWith("dynamic_") ? rule.staffIdOrRole : undefined,
          }
        });
      }
    } else {
      // --- 使用系統預設規則 (基於指派人員) ---
      const assignments = await this.staffAssignmentRepository.find({
        where: { treatmentId: session.treatmentId || session.treatmentCourseId },
        relations: ["staff"],
      });

      for (const assignment of assignments) {
        const staff = assignment.staff;
        const rule = await this.findActiveRule(staff.role, clinicId);
        if (!rule) continue;

        const amount = this.calculateAmountByRule(rule, baseAmount);
        results.push({
          treatmentId: session.treatmentId,
          treatmentCourseId: session.treatmentCourseId,
          sessionId,
          staffId: staff.id,
          role: staff.role,
          amount,
          ruleId: rule.id,
          calculationDetails: {
            source: 'global_rule',
            ruleType: rule.ruleType,
            baseAmount: baseAmount.toNumber(),
          }
        });
      }
    }

    // 5. 儲存記錄
    return await this.createRevenueRecords(results, clinicId);
  }

  /**
   * 向後相容方法：處理療程完成事件
   */
  async handleCompletedTreatment(treatmentId: string): Promise<RevenueRecord[]> {
    this.logger.log(`Handling completed treatment ${treatmentId} (Legacy)`);
    // 目前邏輯主要基於 Session 完成，若 Treatment 整體完成，可能需要不同的計算邏輯
    // 這裡暫時返回空，或根據需求實現整體分潤
    return [];
  }

  /**
   * 向後相容方法：通用計算入口
   */
  async calculateAndCreateRecords(request: any): Promise<RevenueRecord[]> {
    if (request.sessionId) {
      return this.handleCompletedSession(request.sessionId);
    }
    if (request.treatmentId) {
      return this.handleCompletedTreatment(request.treatmentId);
    }
    return [];
  }

  private calculateValue(base: Decimal, type: string, value: number): number {
    if (type === 'percentage') {
      return base.mul(value).div(100).toDecimalPlaces(2).toNumber();
    }
    return new Decimal(value).toDecimalPlaces(2).toNumber();
  }

  private async findActiveRule(role: string, clinicId: string): Promise<RevenueRule | null> {
    const activeRules = await this.revenueRuleRepository.find({
      where: { clinicId, role, isActive: true },
      order: { effectiveFrom: "DESC" },
    });
    return activeRules.length > 0 ? activeRules[0] : null;
  }

  /**
   * 根據規則類型計算金額 (輔助方法)
   */
  private calculateAmountByRule(rule: RevenueRule, baseAmount: Decimal): number {
    const { ruleType, rulePayload } = rule;
    const payload = rulePayload as any;

    if (ruleType === "percentage") {
      return baseAmount.mul(payload.percentage || 0).div(100).toDecimalPlaces(2).toNumber();
    } else if (ruleType === "fixed") {
      return new Decimal(payload.amount || 0).toDecimalPlaces(2).toNumber();
    }
    return 0;
  }

  /**
   * 建立分潤記錄
   */
  async createRevenueRecords(
    results: RevenueCalculationResult[],
    clinicId: string
  ): Promise<RevenueRecord[]> {
    const records: RevenueRecord[] = [];

    for (const result of results) {
      const record = this.revenueRecordRepository.create({
        treatmentId: result.treatmentId,
        treatmentSessionId: result.sessionId,
        staffId: result.staffId,
        role: result.role,
        amount: result.amount,
        ruleId: result.ruleId,
        calculationDetails: result.calculationDetails,
        calculatedAt: new Date(),
        clinicId: clinicId,
        calculationType: "session",
        status: "calculated",
      });

      const savedRecord = await this.revenueRecordRepository.save(record);
      records.push(savedRecord);
    }
    return records;
  }
}
