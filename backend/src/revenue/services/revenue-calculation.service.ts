import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueRuleEngine } from './revenue-rule-engine.service';
import { RevenueRecord } from '../entities/revenue-record.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { TreatmentStaffAssignment } from '../../staff/entities/treatment-staff-assignment.entity';
import { RevenueRule } from '../entities/revenue-rule.entity';

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
   */
  async calculateSessionRevenue(
    clinicId: string,
    treatmentId: string,
    sessionId: string,
  ): Promise<RevenueRecord[]> {
    this.logger.log(
      `開始計算營收：clinicId=${clinicId}, treatmentId=${treatmentId}, sessionId=${sessionId}`,
    );

    // 獲取治療信息
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new NotFoundException(
        `Treatment with ID ${treatmentId} not found`,
      );
    }

    // 獲取治療課程信息
    const session = await this.treatmentSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Treatment session with ID ${sessionId} not found`,
      );
    }

    // 獲取參與該治療的員工分配信息
    const staffAssignments = await this.treatmentStaffAssignmentRepository.find({
      where: {
        treatmentId,
        isActive: true,
      },
    });

    if (staffAssignments.length === 0) {
      this.logger.warn(
        `No active staff assignments found for treatment ${treatmentId}`,
      );
      return [];
    }

    const revenueRecords: RevenueRecord[] = [];

    // 為每位員工計算營收
    for (const assignment of staffAssignments) {
      try {
        // 獲取該角色的營收規則
        const rules = await this.revenueRuleRepository.find({
          where: {
            role: assignment.role,
            clinicId: treatment.clinicId,
            isActive: true,
          },
        });

        if (rules.length === 0) {
          this.logger.warn(
            `No revenue rule found for role=${assignment.role} in clinic=${treatment.clinicId}`,
          );
          continue;
        }

        // 使用最新的生效規則
        const rule = rules[0];

        // 計算該員工的營收分配比例金額
        const staffAllocationAmount =
          (treatment.totalPrice * (assignment.revenuePercentage || 100)) / 100;

        // 根據規則計算最終營收金額
        const rulePayload = {
          rule_type: rule.ruleType,
          rule_payload: rule.rulePayload,
        };

        const calculatedAmount = this.revenueRuleEngine.calculateAmount(
          staffAllocationAmount,
          rulePayload as any,
        );

        // 創建營收記錄
        const record = new RevenueRecord();
        record.treatmentId = treatmentId;
        record.treatmentSessionId = sessionId;
        record.staffId = assignment.staffId;
        record.role = assignment.role;
        record.amount = calculatedAmount;
        record.calculationType = 'session';
        record.status = 'calculated';
        record.clinicId = treatment.clinicId;
        record.ruleId = rule.id;
        record.calculationDetails = {
          staffAllocationAmount,
          revenuePercentage: assignment.revenuePercentage,
          ruleType: rule.ruleType,
          rulePayload: rule.rulePayload,
        };

        const savedRecord = await this.revenueRecordRepository.save(record);
        revenueRecords.push(savedRecord);

        this.logger.log(
          `營收計算完成：staffId=${assignment.staffId}, role=${assignment.role}, amount=${calculatedAmount}`,
        );
      } catch (error) {
        this.logger.error(
          `計算營收時出錯：staffId=${assignment.staffId}, role=${assignment.role}，錯誤：${error.message}`,
          error.stack,
        );
        continue;
      }
    }

    this.logger.log(
      `課程營收計算完成：生成了 ${revenueRecords.length} 條記錄`,
    );

    return revenueRecords;
  }
}
