import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { FeeCalculationService } from "./fee-calculation.service";
import { Payment } from "../entities/payment.entity";
import { CreatePaymentDto } from "../dto/create-payment.dto";

// 建立型別安全的 mock Repository
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

// FeeCalculationService mock
const mockFeeCalculationService = {
  calculateBalance: jest.fn(),
  calculateTreatmentFee: jest.fn(),
};

describe("PaymentService", () => {
  let service: PaymentService;
  let paymentRepo: MockRepository<Payment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: createMockRepository<Payment>(),
        },
        {
          provide: FeeCalculationService,
          useValue: mockFeeCalculationService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1：PaymentService.create — 儲存 Payment 並回傳含 id 的物件
   */
  describe("create", () => {
    it("應儲存 Payment 並回傳含 id 的物件", async () => {
      const dto: CreatePaymentDto = {
        treatmentId: "t-001",
        patientId: "p-001",
        amount: 3000,
        paymentMethod: "cash",
        paidAt: "2026-01-15T10:00:00Z",
      };
      const clinicId = "c-001";

      const savedPayment: Payment = {
        id: "pay-uuid-001",
        treatmentId: dto.treatmentId,
        patientId: dto.patientId,
        amount: dto.amount,
        paymentMethod: "cash",
        clinicId,
        paidAt: new Date(dto.paidAt!),
        status: "completed",
        notes: null,
        recordedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      } as Payment;

      paymentRepo.create!.mockReturnValue(savedPayment);
      paymentRepo.save!.mockResolvedValue(savedPayment);

      const result = await service.create(dto, clinicId);

      expect(result).toHaveProperty("id");
      expect(result.id).toBe("pay-uuid-001");
      expect(result.clinicId).toBe(clinicId);
      expect(result.status).toBe("completed");
      expect(paymentRepo.save).toHaveBeenCalledTimes(1);
    });

    /**
     * Test 4：PaymentService.create — 若 dto.paidAt 為空，自動設定為 new Date()
     */
    it("若 dto.paidAt 為空，應自動設定為 new Date()", async () => {
      const dto: CreatePaymentDto = {
        treatmentId: "t-001",
        patientId: "p-001",
        amount: 3000,
        paymentMethod: "bank_transfer",
      };
      const clinicId = "c-001";

      // Mock create 時捕捉傳入的物件，確認 paidAt 自動設定
      let createdEntity: Partial<Payment> = {};
      paymentRepo.create!.mockImplementation((data: Partial<Payment>) => {
        createdEntity = data;
        return data as Payment;
      });
      paymentRepo.save!.mockImplementation((entity: Payment) =>
        Promise.resolve({ ...entity, id: "pay-auto-date" } as Payment),
      );

      const before = new Date();
      await service.create(dto, clinicId);
      const after = new Date();

      expect(createdEntity.paidAt).toBeInstanceOf(Date);
      expect((createdEntity.paidAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect((createdEntity.paidAt as Date).getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  /**
   * Test 2：PaymentService.findByTreatment — 回傳同一 treatmentId + clinicId 的付款列表，按 paidAt ASC 排序
   */
  describe("findByTreatment", () => {
    it("應回傳同一 treatmentId + clinicId 的付款列表（按 paidAt ASC）", async () => {
      const mockPayments: Payment[] = [
        {
          id: "pay-1",
          treatmentId: "t-001",
          clinicId: "c-001",
          amount: 1000,
          paidAt: new Date("2026-01-01"),
        } as Payment,
        {
          id: "pay-2",
          treatmentId: "t-001",
          clinicId: "c-001",
          amount: 2000,
          paidAt: new Date("2026-01-10"),
        } as Payment,
      ];

      paymentRepo.find!.mockResolvedValue(mockPayments);

      const result = await service.findByTreatment("t-001", "c-001");

      expect(result).toHaveLength(2);
      expect(paymentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { treatmentId: "t-001", clinicId: "c-001" },
          order: { paidAt: "ASC" },
        }),
      );
    });
  });

  /**
   * Test 3：PaymentService.findByPatient — 回傳同一 patientId + clinicId 的付款列表
   */
  describe("findByPatient", () => {
    it("應回傳同一 patientId + clinicId 的付款列表", async () => {
      const mockPayments: Payment[] = [
        {
          id: "pay-3",
          patientId: "p-002",
          clinicId: "c-001",
          amount: 5000,
          paidAt: new Date("2026-02-01"),
        } as Payment,
      ];

      paymentRepo.find!.mockResolvedValue(mockPayments);

      const result = await service.findByPatient("p-002", "c-001");

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe("p-002");
      expect(paymentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: "p-002", clinicId: "c-001" },
        }),
      );
    });
  });

  /**
   * Test 5：移至 controller 測試（此處驗證 service 層 clinicId 隔離）
   * 確保 create 時 clinicId 來自參數，不接受 body 中的 clinicId
   */
  describe("clinicId 多租戶安全", () => {
    it("create 使用傳入的 clinicId 參數，而非 dto 中任何欄位", async () => {
      const dto: CreatePaymentDto = {
        treatmentId: "t-001",
        patientId: "p-001",
        amount: 100,
        paymentMethod: "cash",
      };

      let createdData: Partial<Payment> = {};
      paymentRepo.create!.mockImplementation((data: Partial<Payment>) => {
        createdData = data;
        return data as Payment;
      });
      paymentRepo.save!.mockImplementation((entity: Payment) =>
        Promise.resolve({ ...entity, id: "pay-secure" } as Payment),
      );

      await service.create(dto, "correct-clinic-id");

      // clinicId 應來自函數參數，而非 DTO
      expect(createdData.clinicId).toBe("correct-clinic-id");
    });
  });

  describe("remove", () => {
    it("Payment 不存在時應拋出 NotFoundException", async () => {
      paymentRepo.findOne!.mockResolvedValue(null);

      await expect(service.remove("nonexistent", "c-001")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
