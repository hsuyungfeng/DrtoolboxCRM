import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { validate } from "class-validator";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { FeeCalculationService } from "./fee-calculation.service";
import { Payment } from "../entities/payment.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { CreatePaymentDto } from "../dto/create-payment.dto";

// 建立型別安全的 mock Repository
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

describe("FeeCalculationService", () => {
  let service: FeeCalculationService;
  let paymentRepo: MockRepository<Payment>;
  let treatmentRepo: MockRepository<Treatment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeCalculationService,
        {
          provide: getRepositoryToken(Payment),
          useValue: createMockRepository<Payment>(),
        },
        {
          provide: getRepositoryToken(Treatment),
          useValue: createMockRepository<Treatment>(),
        },
      ],
    }).compile();

    service = module.get<FeeCalculationService>(FeeCalculationService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    treatmentRepo = module.get(getRepositoryToken(Treatment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1：createPaymentDto 驗證
   * paymentMethod 不在允許清單時，validate 應拋出驗證錯誤
   */
  describe("DTO 驗證 — paymentMethod 枚舉限制", () => {
    it("應接受合法的 paymentMethod 值（cash）", async () => {
      const dto = new CreatePaymentDto();
      dto.treatmentId = "t-001";
      dto.patientId = "p-001";
      dto.amount = 500;
      dto.paymentMethod = "cash";

      const errors = await validate(dto);
      const methodErrors = errors.filter((e) => e.property === "paymentMethod");
      expect(methodErrors).toHaveLength(0);
    });

    it("應拒絕非法的 paymentMethod（'wechat'），拋出 ValidationError", async () => {
      const dto = new CreatePaymentDto();
      dto.treatmentId = "t-001";
      dto.patientId = "p-001";
      dto.amount = 500;
      // 故意設定非法值（強制型別斷言跳過 TypeScript 型別檢查）
      (dto as any).paymentMethod = "wechat";

      const errors = await validate(dto);
      const methodErrors = errors.filter((e) => e.property === "paymentMethod");
      expect(methodErrors.length).toBeGreaterThan(0);
      expect(methodErrors[0].constraints).toHaveProperty("isIn");
    });
  });

  /**
   * Test 2：calculateBalance — 有付款記錄時返回正確餘額
   */
  describe("calculateBalance", () => {
    it("治療費 10000，已付 3000+4000=7000，餘額應為 3000", async () => {
      const mockTreatment = {
        id: "t-001",
        clinicId: "c-001",
        totalPrice: 10000,
        finalPrice: 10000,
      } as Treatment;

      const mockPayments = [
        { id: "pay-1", amount: 3000, status: "completed", paidAt: new Date("2026-01-01") } as Payment,
        { id: "pay-2", amount: 4000, status: "completed", paidAt: new Date("2026-01-02") } as Payment,
      ];

      treatmentRepo.findOne!.mockResolvedValue(mockTreatment);
      paymentRepo.find!.mockResolvedValue(mockPayments);

      const result = await service.calculateBalance("t-001", "c-001");

      expect(result.totalFee).toBe(10000);
      expect(result.totalPaid).toBe(7000);
      expect(result.balance).toBe(3000);
      expect(result.payments).toHaveLength(2);
    });

    /**
     * Test 3：calculateBalance — 無付款記錄時餘額 = totalFee
     */
    it("無付款記錄時，餘額應等於 finalPrice（全額未付）", async () => {
      const mockTreatment = {
        id: "t-002",
        clinicId: "c-001",
        totalPrice: 8000,
        finalPrice: 8000,
      } as Treatment;

      treatmentRepo.findOne!.mockResolvedValue(mockTreatment);
      paymentRepo.find!.mockResolvedValue([]);

      const result = await service.calculateBalance("t-002", "c-001");

      expect(result.totalFee).toBe(8000);
      expect(result.totalPaid).toBe(0);
      expect(result.balance).toBe(8000);
      expect(result.payments).toHaveLength(0);
    });

    /**
     * Test 4：calculateBalance — 付款總額超過費用時餘額最小為 0
     */
    it("付款超過總費用時，餘額應為 0（不得為負數）", async () => {
      const mockTreatment = {
        id: "t-003",
        clinicId: "c-001",
        totalPrice: 5000,
        finalPrice: 5000,
      } as Treatment;

      const mockPayments = [
        { id: "pay-3", amount: 3000, status: "completed", paidAt: new Date("2026-01-01") } as Payment,
        { id: "pay-4", amount: 3000, status: "completed", paidAt: new Date("2026-01-02") } as Payment,
      ];

      treatmentRepo.findOne!.mockResolvedValue(mockTreatment);
      paymentRepo.find!.mockResolvedValue(mockPayments);

      const result = await service.calculateBalance("t-003", "c-001");

      expect(result.totalPaid).toBe(6000);
      expect(result.balance).toBe(0); // 不得為負數
    });

    /**
     * Test 5：Decimal.js 精確度 — 避免浮點數精度問題
     */
    it("Decimal.js 精確計算：1000.005 + 1000.005 應等於 2000.01", async () => {
      const mockTreatment = {
        id: "t-004",
        clinicId: "c-001",
        totalPrice: 10000,
        finalPrice: 10000,
      } as Treatment;

      const mockPayments = [
        { id: "pay-5", amount: 1000.005, status: "completed", paidAt: new Date("2026-01-01") } as Payment,
        { id: "pay-6", amount: 1000.005, status: "completed", paidAt: new Date("2026-01-02") } as Payment,
      ];

      treatmentRepo.findOne!.mockResolvedValue(mockTreatment);
      paymentRepo.find!.mockResolvedValue(mockPayments);

      const result = await service.calculateBalance("t-004", "c-001");

      // 使用 Decimal.js 正確計算：2000.01（而非 2000.0099999...）
      expect(result.totalPaid).toBe(2000.01);
    });

    it("治療不存在時應拋出 NotFoundException", async () => {
      treatmentRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.calculateBalance("nonexistent", "c-001"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
