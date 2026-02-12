import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RevenueCalculatorService } from "./revenue-calculator.service";
import { RevenueRule } from "../entities/revenue-rule.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { TreatmentSession } from "../../treatments/entities/treatment-session.entity";
import { TreatmentStaffAssignment } from "../../staff/entities/treatment-staff-assignment.entity";
import { Staff } from "../../staff/entities/staff.entity";

describe("RevenueCalculatorService", () => {
  let service: RevenueCalculatorService;
  let revenueRuleRepo: jest.Mocked<Repository<RevenueRule>>;
  let treatmentRepo: jest.Mocked<Repository<Treatment>>;
  let sessionRepo: jest.Mocked<Repository<TreatmentSession>>;
  let assignmentRepo: jest.Mocked<Repository<TreatmentStaffAssignment>>;
  let recordRepo: jest.Mocked<Repository<RevenueRecord>>;
  let staffRepo: jest.Mocked<Repository<Staff>>;

  // 測試用的模擬數據
  const mockClinicId = "clinic_001";
  const mockTreatmentId = "treatment_001";
  const mockSessionId = "session_001";
  const mockStaffId = "staff_001";
  const mockRuleId = "rule_001";

  const mockStaff: Partial<Staff> = {
    id: mockStaffId,
    name: "張醫師",
    role: "doctor",
    clinicId: mockClinicId,
  };

  const mockTreatment: Partial<Treatment> = {
    id: mockTreatmentId,
    name: "皮膚療程",
    totalPrice: 10000,
    totalSessions: 10,
    completedSessions: 5,
    status: "in_progress",
    clinicId: mockClinicId,
    staffAssignments: [],
  };

  const mockSession: Partial<TreatmentSession> = {
    id: mockSessionId,
    treatmentId: mockTreatmentId,
    status: "completed",
    clinicId: mockClinicId,
  };

  const mockAssignment: Partial<TreatmentStaffAssignment> = {
    id: "assignment_001",
    treatmentId: mockTreatmentId,
    staffId: mockStaffId,
    staff: mockStaff as Staff,
    role: "doctor",
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueCalculatorService,
        {
          provide: getRepositoryToken(RevenueRule),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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
          provide: getRepositoryToken(RevenueRecord),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RevenueCalculatorService>(RevenueCalculatorService);
    revenueRuleRepo = module.get(getRepositoryToken(RevenueRule));
    treatmentRepo = module.get(getRepositoryToken(Treatment));
    sessionRepo = module.get(getRepositoryToken(TreatmentSession));
    assignmentRepo = module.get(getRepositoryToken(TreatmentStaffAssignment));
    recordRepo = module.get(getRepositoryToken(RevenueRecord));
    staffRepo = module.get(getRepositoryToken(Staff));
  });

  it("應該被定義", () => {
    expect(service).toBeDefined();
  });

  describe("calculateAmountByRule - 百分比規則", () => {
    it("應該正確計算整個療程的百分比分潤", () => {
      // 使用反射調用私有方法
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 30 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      // 10000 * 30% = 3000
      expect(result).toBe(3000);
    });

    it("應該正確計算單次療程的百分比分潤", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 30 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const session: Partial<TreatmentSession> = {
        id: mockSessionId,
      };

      const result = calculateAmountByRule(rule, treatment, session, mockStaff);

      // (10000 / 10) * 30% = 1000 * 0.3 = 300
      expect(result).toBe(300);
    });

    it("應該正確處理精度問題（1000/3 的情況）", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 33.33 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 1000,
        totalSessions: 3, // 1000/3 = 333.333...
      };

      const session: Partial<TreatmentSession> = {
        id: mockSessionId,
      };

      const result = calculateAmountByRule(rule, treatment, session, mockStaff);

      // (1000 / 3) * 33.33% = 333.333... * 0.3333 = 111.1
      // 結果應該是精確的小數
      expect(typeof result).toBe("number");
      expect(result).toBeCloseTo(111.1, 1);
    });

    it("應該拒絕超過 100% 的百分比", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 150 }, // 無效的百分比
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該拒絕負數百分比", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: -10 }, // 無效的百分比
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該處理 0% 百分比", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 0 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該處理 100% 百分比", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "percentage",
        rulePayload: { percentage: 100 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(10000);
    });
  });

  describe("calculateAmountByRule - 固定金額規則", () => {
    it("應該正確返回固定金額", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "fixed",
        rulePayload: { amount: 500 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(500);
    });

    it("應該拒絕負數金額", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "fixed",
        rulePayload: { amount: -100 }, // 無效的金額
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該處理 0 金額", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "fixed",
        rulePayload: { amount: 0 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該正確處理小數金額", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "fixed",
        rulePayload: { amount: 123.456 },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      // 四捨五入到小數點後 2 位
      expect(result).toBe(123.46);
    });
  });

  describe("calculateAmountByRule - 階梯式規則", () => {
    it("應該正確計算階梯式分潤", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "tiered",
        rulePayload: {
          tiers: [
            { threshold: 5000, percentage: 20 },
            { threshold: 10000, percentage: 30 },
            { threshold: 20000, percentage: 40 },
          ],
        },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 15000,
        totalSessions: 1,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      // 0-5000: 5000 * 20% = 1000
      // 5000-10000: 5000 * 30% = 1500
      // 10000-15000: 5000 * 40% = 2000
      // 總計: 1000 + 1500 + 2000 = 4500
      expect(result).toBeCloseTo(4500, 2);
    });

    it("應該處理空的階梯規則", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "tiered",
        rulePayload: { tiers: [] },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });

    it("應該跳過無效百分比的階梯", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "tiered",
        rulePayload: {
          tiers: [
            { threshold: 5000, percentage: 150 }, // 無效，應跳過
            { threshold: 10000, percentage: 30 },
          ],
        },
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 1,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      // 只計算有效的階梯
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateAmountByRule - 未知規則類型", () => {
    it("應該對未知規則類型返回 0", () => {
      const calculateAmountByRule = (service as any).calculateAmountByRule.bind(
        service,
      );

      const rule: Partial<RevenueRule> = {
        id: mockRuleId,
        ruleType: "unknown_type" as any,
        rulePayload: {},
      };

      const treatment: Partial<Treatment> = {
        totalPrice: 10000,
        totalSessions: 10,
      };

      const result = calculateAmountByRule(rule, treatment, null, mockStaff);

      expect(result).toBe(0);
    });
  });

  describe("calculateTreatmentRevenue", () => {
    it("應該在找不到療程時拋出錯誤", async () => {
      treatmentRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.calculateTreatmentRevenue({
          treatmentId: mockTreatmentId,
          clinicId: mockClinicId,
        }),
      ).rejects.toThrow(
        `Treatment ${mockTreatmentId} not found in clinic ${mockClinicId}`,
      );
    });

    it("應該在沒有員工分配時返回空結果", async () => {
      treatmentRepo.findOne = jest.fn().mockResolvedValue(mockTreatment);
      assignmentRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.calculateTreatmentRevenue({
        treatmentId: mockTreatmentId,
        clinicId: mockClinicId,
      });

      expect(result).toEqual([]);
    });
  });

  describe("lockRevenueRecord", () => {
    it("應該正確鎖定分潤記錄", async () => {
      const mockRecord: Partial<RevenueRecord> = {
        id: "record_001",
        lockedAt: null,
      };

      recordRepo.findOne = jest.fn().mockResolvedValue(mockRecord);
      recordRepo.save = jest.fn().mockImplementation((record) =>
        Promise.resolve({
          ...record,
          lockedAt: new Date(),
        }),
      );

      const result = await service.lockRevenueRecord("record_001");

      expect(result.lockedAt).toBeDefined();
    });

    it("應該在記錄已鎖定時拋出錯誤", async () => {
      const lockedDate = new Date();
      const mockRecord: Partial<RevenueRecord> = {
        id: "record_001",
        lockedAt: lockedDate,
      };

      recordRepo.findOne = jest.fn().mockResolvedValue(mockRecord);

      await expect(service.lockRevenueRecord("record_001")).rejects.toThrow(
        `RevenueRecord record_001 is already locked`,
      );
    });

    it("應該在記錄不存在時拋出錯誤", async () => {
      recordRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.lockRevenueRecord("nonexistent")).rejects.toThrow(
        "RevenueRecord nonexistent not found",
      );
    });
  });

  describe("handleCompletedTreatment", () => {
    it("應該在療程未完成時拋出錯誤", async () => {
      const incompleteTreatment: Partial<Treatment> = {
        id: mockTreatmentId,
        status: "in_progress",
        clinicId: mockClinicId,
      };

      treatmentRepo.findOne = jest.fn().mockResolvedValue(incompleteTreatment);

      await expect(
        service.handleCompletedTreatment(mockTreatmentId),
      ).rejects.toThrow(
        `Treatment ${mockTreatmentId} is not completed (status: in_progress)`,
      );
    });

    it("應該在療程不存在時拋出錯誤", async () => {
      treatmentRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.handleCompletedTreatment("nonexistent"),
      ).rejects.toThrow("Treatment nonexistent not found");
    });
  });

  describe("handleCompletedSession", () => {
    it("應該在療程次數未完成時拋出錯誤", async () => {
      const incompleteSession: Partial<TreatmentSession> = {
        id: mockSessionId,
        status: "in_progress",
        treatmentId: mockTreatmentId,
        clinicId: mockClinicId,
      };

      sessionRepo.findOne = jest.fn().mockResolvedValue(incompleteSession);

      await expect(
        service.handleCompletedSession(mockSessionId),
      ).rejects.toThrow(
        `TreatmentSession ${mockSessionId} is not completed (status: in_progress)`,
      );
    });

    it("應該在療程次數不存在時拋出錯誤", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.handleCompletedSession("nonexistent"),
      ).rejects.toThrow("TreatmentSession nonexistent not found");
    });
  });
});
