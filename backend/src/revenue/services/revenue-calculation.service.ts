import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { RevenueRuleEngine } from "./revenue-rule-engine.service";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { RevenueRule } from "../entities/revenue-rule.entity";

/**
 * 營收計算服務
 * Revenue Calculation Service for processing session completion
 */
@Injectable()
export class RevenueCalculationService {
  private readonly logger = new Logger(RevenueCalculationService.name);

  constructor(
    @InjectRepository(RevenueRecord)
    private revenueRecordRepository: Repository<RevenueRecord>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(TreatmentSession)
    private treatmentSessionRepository: Repository<TreatmentSession>,
    @InjectRepository(TreatmentStaffAssignment)
    private treatmentStaffAssignmentRepository: Repository<TreatmentStaffAssignment>,
    @InjectRepository(RevenueRule)
    private revenueRuleRepository: Repository<RevenueRule>,
    private revenueRuleEngine: RevenueRuleEngine,
  ) {}

  /**
   * 計算治療課程的營收
   * Calculate revenue for a treatment session
   *
   * 優化: 使用批量查詢替代迴圈查詢，解決 N+1 查詢問題
   */
  async calculateSessionRevenue(
    clinicId: string,
    treatmentId: string,
    sessionId: string,
  ): Promise<RevenueRecord[]> {
    this.logger.log(
      `開始計算營收：clinicId=${clinicId}, treatmentId=${treatmentId}, sessionId=${sessionId}`,
    );

    // 1. 獲取治療信息
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${treatmentId} not found`);
    }

    // 2. 獲取治療課程信息
    const session = await this.treatmentSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Treatment session with ID ${sessionId} not found`,
      );
    }

    // 3. 獲取參與該治療的員工分配信息
    const staffAssignments = await this.treatmentStaffAssignmentRepository.find(
      {
        where: {
          treatmentId,
          isActive: true,
        },
      },
    );

    if (staffAssignments.length === 0) {
      this.logger.warn(`沒有找到治療 ${treatmentId} 的活躍員工分配`);
      return [];
    }

    // 4. 優化：先收集所有唯一的角色（修復 N+1 查詢問題）
    const roles = [
      ...new Set(staffAssignments.map((assignment) => assignment.role)),
    ];

    this.logger.debug(`收集到 ${roles.length} 個唯一角色：${roles.join(", ")}`);

    // 5. 一次性查詢所有角色的規則（批量查詢，不是迴圈查詢）
    const allRules = await this.revenueRuleRepository.find({
      where: {
        role: In(roles),
        clinicId: treatment.clinicId,
        isActive: true,
      },
      order: { effectiveFrom: "DESC" },
    });

    if (allRules.length === 0) {
      this.logger.warn(
        `診所 ${treatment.clinicId} 的角色 [${roles.join(", ")}] 未找到營收規則`,
      );
      return [];
    }

    // 6. 建立角色->規則的映射表，以便快速查找（O(1) 時間複雜度）
    const roleRulesMap = new Map<string, RevenueRule>();
    allRules.forEach((rule) => {
      if (!roleRulesMap.has(rule.role)) {
        roleRulesMap.set(rule.role, rule);
      }
    });

    this.logger.debug(`建立了 ${roleRulesMap.size} 個角色的規則映射`);

    // 7. 對每個員工計算分潤（使用映射表查找，無數據庫查詢）
    const createdRecords: RevenueRecord[] = [];

    for (const assignment of staffAssignments) {
      try {
        const role = assignment.role;

        // 從映射表中查找規則（O(1) 時間複雜度，無數據庫查詢）
        const rule = roleRulesMap.get(role);

        if (!rule) {
          this.logger.warn(
            `診所 ${treatment.clinicId} 的角色 ${role} 沒有找到營收規則，跳過員工 ${assignment.staffId}`,
          );
          continue;
        }

        // 8. 計算該員工的營收分配比例金額
        const staffAllocationAmount =
          (treatment.totalPrice * (assignment.revenuePercentage || 100)) / 100;

        // 9. 根據規則計算最終營收金額
        const rulePayload = {
          rule_type: rule.ruleType as "fixed" | "percentage" | "tiered",
          rule_payload: rule.rulePayload,
        };

        const calculatedAmount = this.revenueRuleEngine.calculateAmount(
          staffAllocationAmount,
          rulePayload,
        );

        // 10. 創建營收記錄
        const record = new RevenueRecord();
        record.treatmentId = treatmentId;
        record.treatmentSessionId = sessionId;
        record.staffId = assignment.staffId;
        record.role = role;
        record.amount = calculatedAmount;
        record.calculationType = "session";
        record.status = "calculated";
        record.clinicId = treatment.clinicId;
        record.ruleId = rule.id;
        record.calculationDetails = {
          staffAllocationAmount,
          revenuePercentage: assignment.revenuePercentage,
          ruleType: rule.ruleType,
          rulePayload: rule.rulePayload,
        };

        const savedRecord = await this.revenueRecordRepository.save(record);
        createdRecords.push(savedRecord);

        this.logger.log(
          `營收計算完成：staffId=${assignment.staffId}, role=${role}, amount=${calculatedAmount}`,
        );
      } catch (error) {
        this.logger.error(
          `計算營收時出錯：staffId=${assignment.staffId}, role=${assignment.role}，錯誤：${error.message}`,
          error.stack,
        );
        continue;
      }
    }

    this.logger.log(`課程營收計算完成：生成了 ${createdRecords.length} 條記錄`);

    return createdRecords;
  }
}
