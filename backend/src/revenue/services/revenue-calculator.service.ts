import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Decimal from "decimal.js";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../../staff/entities/staff.entity";

// 設置 Decimal 精度為 8 位小數，四捨五入
Decimal.set({ precision: 8, rounding: Decimal.ROUND_HALF_UP });



export interface RevenueCalculationResult {
  treatmentId: string;
  sessionId?: string;
  staffId: string;
  role: string;
  amount: number;
  ruleId: string;
  calculationDetails: Record<string, unknown>;
}

export interface RevenueCalculationRequest {
  treatmentId: string;
  sessionId?: string; // 如果为空，计算整个疗程
  clinicId: string;
  calculationDate?: Date;
}

@Injectable()
export class RevenueCalculatorService {
  private readonly logger = new Logger(RevenueCalculatorService.name);

  constructor(
    @InjectRepository(RevenueRule)
    private revenueRuleRepository: Repository<RevenueRule>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(TreatmentSession)
    private treatmentSessionRepository: Repository<TreatmentSession>,
    @InjectRepository(TreatmentStaffAssignment)
    private staffAssignmentRepository: Repository<TreatmentStaffAssignment>,
    @InjectRepository(RevenueRecord)
    private revenueRecordRepository: Repository<RevenueRecord>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  /**
   * 计算单个疗程的分润
   */
  async calculateTreatmentRevenue(
    request: RevenueCalculationRequest,
  ): Promise<RevenueCalculationResult[]> {
    this.logger.log(
      `Calculating revenue for treatment ${request.treatmentId}, clinic ${request.clinicId}`,
    );

    const results: RevenueCalculationResult[] = [];
    const calculationDate = request.calculationDate || new Date();

    // 1. 获取疗程信息
    const treatment = await this.treatmentRepository.findOne({
      where: { id: request.treatmentId, clinicId: request.clinicId },
      relations: ["staffAssignments", "staffAssignments.staff"],
    });

    if (!treatment) {
      throw new Error(
        `Treatment ${request.treatmentId} not found in clinic ${request.clinicId}`,
      );
    }

    // 2. 如果是单次session计算，获取session信息
    let session: TreatmentSession | null = null;
    if (request.sessionId) {
      session = await this.treatmentSessionRepository.findOne({
        where: {
          id: request.sessionId,
          treatmentId: request.treatmentId,
          clinicId: request.clinicId,
        },
      });

      if (!session) {
        throw new Error(
          `TreatmentSession ${request.sessionId} not found for treatment ${request.treatmentId}`,
        );
      }
    }

    // 3. 获取疗程的所有员工分配
    const assignments = await this.staffAssignmentRepository.find({
      where: { treatmentId: request.treatmentId },
      relations: ["staff"],
    });

    if (assignments.length === 0) {
      this.logger.warn(
        `No staff assignments found for treatment ${request.treatmentId}`,
      );
      return results;
    }

    // 4. 为每个员工计算分润
    for (const assignment of assignments) {
      const staff = assignment.staff;

      // 获取该角色当前有效的分润规则
      const activeRules = await this.revenueRuleRepository
        .createQueryBuilder("rule")
        .where("rule.clinicId = :clinicId", { clinicId: request.clinicId })
        .andWhere("rule.role = :role", { role: staff.role })
        .andWhere("rule.isActive = :isActive", { isActive: true })
        .andWhere("rule.effectiveFrom <= :date", { date: calculationDate })
        .andWhere("(rule.effectiveTo IS NULL OR rule.effectiveTo >= :date)", {
          date: calculationDate,
        })
        .orderBy("rule.effectiveFrom", "DESC")
        .getMany();

      if (activeRules.length === 0) {
        this.logger.warn(
          `No active revenue rules found for role ${staff.role} in clinic ${request.clinicId}`,
        );
        continue;
      }

      // 使用最新的规则
      const rule = activeRules[0];

      // 5. 根据规则类型计算分润金额
      const amount = this.calculateAmountByRule(
        rule,
        treatment,
        session,
        staff,
      );

      // 6. 创建计算结果
      const result: RevenueCalculationResult = {
        treatmentId: request.treatmentId,
        sessionId: request.sessionId,
        staffId: staff.id,
        role: staff.role,
        amount,
        ruleId: rule.id,
        calculationDetails: {
          ruleType: rule.ruleType,
          rulePayload: rule.rulePayload as Record<string, unknown>,
          treatmentPrice: treatment.totalPrice,
          sessionCount: treatment.totalSessions,
          completedSessions: treatment.completedSessions,
        },
      };

      results.push(result);
    }

    this.logger.log(
      `Calculated revenue for ${results.length} staff members for treatment ${request.treatmentId}`,
    );
    return results;
  }

  /**
   * 根據規則類型計算金額（使用 Decimal 精確計算）
   * @description 使用 decimal.js 進行精確的財務計算，避免浮點數精度問題
   */
  private calculateAmountByRule(
    rule: RevenueRule,
    treatment: Treatment,
    session: TreatmentSession | null,
    _staff: Staff, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): number {
    const { ruleType, rulePayload } = rule; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

    // 使用 Decimal 進行精確計算
    const totalPrice = new Decimal(treatment.totalPrice);
    const totalSessions = new Decimal(treatment.totalSessions);

    // 計算基礎金額（單次或整個療程）
    const baseAmount = session
      ? totalPrice.div(totalSessions) // 單次平均價格（精確除法）
      : totalPrice; // 整個療程價格

    switch (ruleType) {
      case "percentage": {
        // 百分比規則：rulePayload 包含 percentage 欄位
        const percentageValue =
          (rulePayload as { percentage: number })?.percentage || 0;

        // 驗證百分比範圍（0-100%）
        if (percentageValue < 0 || percentageValue > 100) {
          this.logger.warn(
            `Invalid percentage value: ${percentageValue}. Must be between 0 and 100.`,
          );
          return 0;
        }

        const percentage = new Decimal(percentageValue);
        const result = baseAmount.mul(percentage).div(100);

        // 四捨五入到小數點後 2 位（財務標準）
        return result.toDecimalPlaces(2).toNumber();
      }

      case "fixed": {
        // 固定金額規則：rulePayload 包含 amount 欄位
        const fixedAmount =
          (rulePayload as { amount: number })?.amount || 0;

        // 驗證金額不為負數
        if (fixedAmount < 0) {
          this.logger.warn(`Invalid fixed amount: ${fixedAmount}. Must be non-negative.`);
          return 0;
        }

        return new Decimal(fixedAmount).toDecimalPlaces(2).toNumber();
      }

      case "tiered": {
        // 階梯式規則：rulePayload 包含 tiers 陣列
        // 每個 tier 包含 threshold 和 percentage
        const tiers =
          (
            rulePayload as {
              tiers: Array<{ threshold: number; percentage: number }>;
            }
          )?.tiers || [];

        if (tiers.length === 0) {
          this.logger.warn("Tiered rule has no tiers defined.");
          return 0;
        }

        let amount = new Decimal(0);
        let previousThreshold = new Decimal(0);

        for (const tier of tiers) {
          // 驗證百分比範圍
          if (tier.percentage < 0 || tier.percentage > 100) {
            this.logger.warn(
              `Invalid tier percentage: ${tier.percentage}. Skipping tier.`,
            );
            continue;
          }

          const threshold = new Decimal(tier.threshold);
          const percentage = new Decimal(tier.percentage);

          if (baseAmount.greaterThan(threshold)) {
            // 計算此階梯的金額
            const tierAmount = Decimal.min(baseAmount, threshold).minus(previousThreshold);
            amount = amount.plus(tierAmount.mul(percentage).div(100));
            previousThreshold = threshold;
          } else {
            // 最後一個適用的階梯
            const tierAmount = baseAmount.minus(previousThreshold);
            amount = amount.plus(tierAmount.mul(percentage).div(100));
            break;
          }
        }

        // 四捨五入到小數點後 2 位
        return amount.toDecimalPlaces(2).toNumber();
      }

      default:
        this.logger.warn(`Unknown rule type: ${ruleType}`);
        return 0;
    }
  }

  /**
   * 创建分润记录
   */
  async createRevenueRecords(
    calculationResults: RevenueCalculationResult[],
  ): Promise<RevenueRecord[]> {
    const records: RevenueRecord[] = [];

    for (const result of calculationResults) {
      const record = this.revenueRecordRepository.create({
        treatmentId: result.treatmentId,
        treatmentSessionId: result.sessionId || null,
        staffId: result.staffId,
        role: result.role,
        amount: result.amount,
        ruleId: result.ruleId,
        calculationDetails: result.calculationDetails,
        calculatedAt: new Date(),
        clinicId: await this.getClinicIdFromTreatment(result.treatmentId),
        calculationType: result.sessionId ? "session" : "treatment",
        status: "calculated",
        lockedAt: null,
        paidAt: null,
      });

      const savedRecord = await this.revenueRecordRepository.save(record);
      records.push(savedRecord);
    }

    this.logger.log(`Created ${records.length} revenue records`);
    return records;
  }

  /**
   * 锁定分润记录（财务锁定）
   */
  async lockRevenueRecord(recordId: string): Promise<RevenueRecord> {
    const record = await this.revenueRecordRepository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error(`RevenueRecord ${recordId} not found`);
    }

    if (record.lockedAt) {
      throw new Error(
         `RevenueRecord ${recordId} is already locked at ${record.lockedAt.toISOString()}`,
      );
    }

    record.lockedAt = new Date();
    return await this.revenueRecordRepository.save(record);
  }

  /**
   * 计算并创建分润记录
   */
  async calculateAndCreateRecords(
    request: RevenueCalculationRequest,
  ): Promise<RevenueRecord[]> {
    const results = await this.calculateTreatmentRevenue(request);
    return await this.createRevenueRecords(results);
  }

  /**
   * 自动处理完成疗程的分润计算
   */
  async handleCompletedTreatment(
    treatmentId: string,
  ): Promise<RevenueRecord[]> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new Error(`Treatment ${treatmentId} not found`);
    }

    if (treatment.status !== "completed") {
      throw new Error(
        `Treatment ${treatmentId} is not completed (status: ${treatment.status})`,
      );
    }

    const request: RevenueCalculationRequest = {
      treatmentId,
      clinicId: treatment.clinicId,
      calculationDate: new Date(),
    };

    return await this.calculateAndCreateRecords(request);
  }

  /**
   * 自动处理完成疗次的分润计算
   */
  async handleCompletedSession(sessionId: string): Promise<RevenueRecord[]> {
    const session = await this.treatmentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["treatment"],
    });

    if (!session) {
      throw new Error(`TreatmentSession ${sessionId} not found`);
    }

    if (session.status !== "completed") {
      throw new Error(
        `TreatmentSession ${sessionId} is not completed (status: ${session.status})`,
      );
    }

    const request: RevenueCalculationRequest = {
      treatmentId: session.treatmentId,
      sessionId,
      clinicId: session.clinicId,
      calculationDate: new Date(),
    };

    return await this.calculateAndCreateRecords(request);
  }

  private async getClinicIdFromTreatment(treatmentId: string): Promise<string> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
      select: ["clinicId"],
    });

    if (!treatment) {
      throw new Error(`Treatment ${treatmentId} not found`);
    }

    return treatment.clinicId;
  }
}
