import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { RevenueCalculationService } from './revenue-calculation.service';
import { RevenueRuleEngine } from './revenue-rule-engine.service';
import { RevenueRecord } from '../entities/revenue-record.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { TreatmentStaffAssignment } from '../../staff/entities/treatment-staff-assignment.entity';
import { RevenueRule } from '../entities/revenue-rule.entity';

describe('RevenueCalculationService', () => {
  let service: RevenueCalculationService;
  let revenueRecordRepo: Repository<RevenueRecord>;
  let treatmentRepo: Repository<Treatment>;
  let treatmentSessionRepo: Repository<TreatmentSession>;
  let treatmentStaffAssignmentRepo: Repository<TreatmentStaffAssignment>;
  let revenueRuleRepo: Repository<RevenueRule>;
  let revenueRuleEngine: RevenueRuleEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueCalculationService,
        {
          provide: RevenueRuleEngine,
          useValue: {
            calculateAmount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RevenueRecord),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Treatment),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TreatmentStaffAssignment),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RevenueRule),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RevenueCalculationService>(RevenueCalculationService);
    revenueRecordRepo = module.get<Repository<RevenueRecord>>(
      getRepositoryToken(RevenueRecord),
    );
    treatmentRepo = module.get<Repository<Treatment>>(
      getRepositoryToken(Treatment),
    );
    treatmentSessionRepo = module.get<Repository<TreatmentSession>>(
      getRepositoryToken(TreatmentSession),
    );
    treatmentStaffAssignmentRepo = module.get<Repository<TreatmentStaffAssignment>>(
      getRepositoryToken(TreatmentStaffAssignment),
    );
    revenueRuleRepo = module.get<Repository<RevenueRule>>(
      getRepositoryToken(RevenueRule),
    );
    revenueRuleEngine = module.get<RevenueRuleEngine>(RevenueRuleEngine);
  });

  describe('calculateSessionRevenue', () => {
    it('should create revenue records for completed session', async () => {
      const clinicId = 'clinic-1';
      const treatmentId = 'treatment-1';
      const sessionId = 'session-1';

      const treatment: Partial<Treatment> = {
        id: treatmentId,
        clinicId,
        totalPrice: 1000,
        name: 'Test Treatment',
      };

      const session: Partial<TreatmentSession> = {
        id: sessionId,
        treatmentId,
        clinicId,
        status: 'completed',
        revenueCalculated: false,
      };

      const staffAssignments: Partial<TreatmentStaffAssignment>[] = [
        {
          id: 'assign-1',
          staffId: 'staff-1',
          treatmentId,
          role: 'doctor',
          revenuePercentage: 50,
        },
      ];

      const rule: Partial<RevenueRule> = {
        id: 'rule-1',
        role: 'doctor',
        ruleType: 'percentage',
        rulePayload: { percentage: 50 },
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        clinicId,
        isActive: true,
      };

      jest.spyOn(treatmentRepo, 'findOne').mockResolvedValue(treatment as any);
      jest.spyOn(treatmentSessionRepo, 'findOne').mockResolvedValue(session as any);
      jest.spyOn(treatmentStaffAssignmentRepo, 'find').mockResolvedValue(staffAssignments as any);
      jest.spyOn(revenueRuleRepo, 'find').mockResolvedValue([rule as any]);
      jest.spyOn(revenueRuleEngine, 'calculateAmount').mockReturnValue(500);
      jest.spyOn(revenueRecordRepo, 'save').mockResolvedValue({ id: 'record-1' } as any);

      const results = await service.calculateSessionRevenue(
        clinicId,
        treatmentId,
        sessionId,
      );

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(treatmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: treatmentId },
      });
      expect(treatmentSessionRepo.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
      // 驗證批量查詢被呼叫一次（不是迴圈中多次）
      expect(revenueRuleRepo.find).toHaveBeenCalledTimes(1);
      expect(revenueRecordRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error if treatment not found', async () => {
      const clinicId = 'clinic-1';
      const treatmentId = 'treatment-1';
      const sessionId = 'session-1';

      jest.spyOn(treatmentRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.calculateSessionRevenue(clinicId, treatmentId, sessionId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle missing rules gracefully', async () => {
      const clinicId = 'clinic-1';
      const treatmentId = 'treatment-1';
      const sessionId = 'session-1';

      const treatment: Partial<Treatment> = {
        id: treatmentId,
        clinicId,
        totalPrice: 1000,
      };

      const session: Partial<TreatmentSession> = {
        id: sessionId,
        treatmentId,
        clinicId,
        status: 'completed',
        revenueCalculated: false,
      };

      const staffAssignments: Partial<TreatmentStaffAssignment>[] = [
        {
          id: 'assign-1',
          staffId: 'staff-1',
          treatmentId,
          role: 'doctor',
        },
      ];

      jest.spyOn(treatmentRepo, 'findOne').mockResolvedValue(treatment as any);
      jest.spyOn(treatmentSessionRepo, 'findOne').mockResolvedValue(session as any);
      jest.spyOn(treatmentStaffAssignmentRepo, 'find').mockResolvedValue(staffAssignments as any);
      jest.spyOn(revenueRuleRepo, 'find').mockResolvedValue([]);

      const results = await service.calculateSessionRevenue(
        clinicId,
        treatmentId,
        sessionId,
      );

      expect(results).toBeDefined();
      expect(results.length).toBe(0);
      // 驗證批量查詢被呼叫一次以獲取所有角色的規則
      expect(revenueRuleRepo.find).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple staff assignments with different roles efficiently', async () => {
      const clinicId = 'clinic-1';
      const treatmentId = 'treatment-1';
      const sessionId = 'session-1';

      const treatment: Partial<Treatment> = {
        id: treatmentId,
        clinicId,
        totalPrice: 3000,
        name: 'Test Treatment',
      };

      const session: Partial<TreatmentSession> = {
        id: sessionId,
        treatmentId,
        clinicId,
        status: 'completed',
        revenueCalculated: false,
      };

      const staffAssignments: Partial<TreatmentStaffAssignment>[] = [
        {
          id: 'assign-1',
          staffId: 'doctor-1',
          treatmentId,
          role: 'doctor',
          revenuePercentage: 50,
        },
        {
          id: 'assign-2',
          staffId: 'therapist-1',
          treatmentId,
          role: 'therapist',
          revenuePercentage: 30,
        },
      ];

      const mockRules: Partial<RevenueRule>[] = [
        {
          id: 'rule-doctor',
          role: 'doctor',
          ruleType: 'percentage',
          rulePayload: { percentage: 50 },
          revenuePercentage: 50,
          isActive: true,
          clinicId,
          effectiveFrom: new Date('2025-01-01'),
        },
        {
          id: 'rule-therapist',
          role: 'therapist',
          ruleType: 'percentage',
          rulePayload: { percentage: 30 },
          revenuePercentage: 30,
          isActive: true,
          clinicId,
          effectiveFrom: new Date('2025-01-01'),
        },
      ];

      jest.spyOn(treatmentRepo, 'findOne').mockResolvedValue(treatment as any);
      jest.spyOn(treatmentSessionRepo, 'findOne').mockResolvedValue(session as any);
      jest.spyOn(treatmentStaffAssignmentRepo, 'find').mockResolvedValue(staffAssignments as any);
      jest.spyOn(revenueRuleRepo, 'find').mockResolvedValue(mockRules as any);
      jest.spyOn(revenueRuleEngine, 'calculateAmount')
        .mockReturnValueOnce(1500) // 醫生：3000 * 50% = 1500
        .mockReturnValueOnce(900);  // 治療師：3000 * 30% = 900
      jest.spyOn(revenueRecordRepo, 'save')
        .mockResolvedValueOnce({ id: 'record-1' } as any)
        .mockResolvedValueOnce({ id: 'record-2' } as any);

      const results = await service.calculateSessionRevenue(
        clinicId,
        treatmentId,
        sessionId,
      );

      // 驗證結果
      expect(results).toBeDefined();
      expect(results.length).toBe(2);

      // 驗證批量查詢被呼叫一次（不是迴圈中多次）
      // 這是本次修復的核心優化
      expect(revenueRuleRepo.find).toHaveBeenCalledTimes(1);

      // 驗證查詢時使用了 In() 操作符進行批量查詢
      const findCall = (revenueRuleRepo.find as jest.Mock).mock.calls[0][0];
      expect(findCall.where).toBeDefined();
      expect(findCall.where.role).toBeDefined(); // 應該包含 In(['doctor', 'therapist'])
      expect(findCall.where.clinicId).toBe(clinicId);
      expect(findCall.where.isActive).toBe(true);

      // 驗證為兩個員工都建立了記錄
      expect(revenueRecordRepo.save).toHaveBeenCalledTimes(2);

      // 驗證計算引擎被正確呼叫
      expect(revenueRuleEngine.calculateAmount).toHaveBeenCalledTimes(2);
    });
  });
});
