import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InvoiceService } from "./invoice.service";
import { Invoice } from "../entities/invoice.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { Patient } from "../../patients/entities/patient.entity";
import { FeeCalculationService } from "./fee-calculation.service";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";
import { Payment } from "../entities/payment.entity";

/**
 * InvoiceService 單元測試
 * 覆蓋發票生成、狀態流轉、重複開立防護
 */
describe("InvoiceService", () => {
  let service: InvoiceService;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
  let feeCalculationService: jest.Mocked<FeeCalculationService>;

  const clinicId = "clinic-001";
  const treatmentId = "treatment-001";
  const patientId = "patient-001";

  const mockPayment: Partial<Payment> = {
    id: "payment-001",
    amount: 3000,
    paymentMethod: "cash",
    paidAt: new Date("2026-03-01T10:00:00Z"),
    treatmentId,
    patientId,
    clinicId,
    status: "completed",
  };

  const mockInvoice: Partial<Invoice> = {
    id: "invoice-001",
    invoiceNumber: "INV-202603-000001",
    treatmentId,
    patientId,
    lineItems: [
      {
        paymentId: "payment-001",
        amount: 3000,
        paymentMethod: "cash",
        paidAt: "2026-03-01T10:00:00.000Z",
        description: "療程費用（現金）",
      },
    ],
    totalAmount: 3000,
    status: "draft",
    clinicId,
    issuedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdBy: null,
  };

  beforeEach(async () => {
    const mockInvoiceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockFeeCalculationService = {
      calculateBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(Treatment),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: {},
        },
        {
          provide: FeeCalculationService,
          useValue: mockFeeCalculationService,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    feeCalculationService = module.get(FeeCalculationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Test 1：InvoiceService.create — 生成唯一 invoiceNumber
  // ============================================================
  describe("create", () => {
    it("Test 1：應生成唯一 invoiceNumber（格式：INV-{YYYYMM}-{6位序號}）", async () => {
      // 無重複 issued 發票
      invoiceRepo.findOne.mockResolvedValueOnce(null);

      // FeeCalculationService 回傳付款明細
      feeCalculationService.calculateBalance.mockResolvedValue({
        totalFee: 5000,
        totalPaid: 3000,
        balance: 2000,
        payments: [mockPayment as Payment],
      });

      // 無同月序號
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      invoiceRepo.createQueryBuilder.mockReturnValue(qb as any);

      const savedInvoice = { ...mockInvoice } as Invoice;
      invoiceRepo.create.mockReturnValue(savedInvoice);
      invoiceRepo.save.mockResolvedValue(savedInvoice);

      const dto: CreateInvoiceDto = { treatmentId, patientId };
      const result = await service.create(dto, clinicId);

      expect(invoiceRepo.save).toHaveBeenCalledTimes(1);
      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: expect.stringMatching(/^INV-\d{6}-\d{6}$/),
          treatmentId,
          patientId,
          status: "draft",
          clinicId,
        }),
      );
      expect(result.invoiceNumber).toBe("INV-202603-000001");
    });

    // ============================================================
    // Test 2：同一 treatmentId 已有 issued 發票時拋出 ConflictException
    // ============================================================
    it("Test 2：同一 treatmentId 已有 issued 發票時應拋出 ConflictException", async () => {
      const existingIssued = {
        ...mockInvoice,
        status: "issued",
        invoiceNumber: "INV-202603-000001",
      } as Invoice;

      invoiceRepo.findOne.mockResolvedValueOnce(existingIssued);

      const dto: CreateInvoiceDto = { treatmentId, patientId };
      await expect(service.create(dto, clinicId)).rejects.toThrow(ConflictException);
    });

    // ============================================================
    // Test 6：lineItems 從 FeeCalculationService.calculateBalance().payments 自動生成
    // ============================================================
    it("Test 6：lineItems 應從 FeeCalculationService.calculateBalance().payments 自動生成", async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(null);

      const multiplePayments: Payment[] = [
        {
          ...mockPayment,
          id: "payment-001",
          amount: 1000,
          paymentMethod: "cash",
          paidAt: new Date("2026-03-01T10:00:00Z"),
        } as Payment,
        {
          ...mockPayment,
          id: "payment-002",
          amount: 2000,
          paymentMethod: "credit_card",
          paidAt: new Date("2026-03-02T10:00:00Z"),
        } as Payment,
      ];

      feeCalculationService.calculateBalance.mockResolvedValue({
        totalFee: 5000,
        totalPaid: 3000,
        balance: 2000,
        payments: multiplePayments,
      });

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      invoiceRepo.createQueryBuilder.mockReturnValue(qb as any);

      const capturedData = { lineItems: [] as any[], totalAmount: 0 };
      invoiceRepo.create.mockImplementation((data: any) => {
        capturedData.lineItems = data.lineItems;
        capturedData.totalAmount = data.totalAmount;
        return data as Invoice;
      });
      invoiceRepo.save.mockImplementation((inv: any) => Promise.resolve(inv));

      const dto: CreateInvoiceDto = { treatmentId, patientId };
      await service.create(dto, clinicId);

      expect(capturedData.lineItems).toHaveLength(2);
      expect(capturedData.lineItems[0]).toMatchObject({
        paymentId: "payment-001",
        amount: 1000,
        paymentMethod: "cash",
        description: "療程費用（現金）",
      });
      expect(capturedData.lineItems[1]).toMatchObject({
        paymentId: "payment-002",
        amount: 2000,
        paymentMethod: "credit_card",
        description: "療程費用（刷卡）",
      });
      expect(capturedData.totalAmount).toBe(3000);
    });
  });

  // ============================================================
  // Test 3：InvoiceService.issue — draft → issued，設定 issuedAt
  // ============================================================
  describe("issue", () => {
    it("Test 3：應將 draft 發票轉為 issued 並設定 issuedAt", async () => {
      const draftInvoice = { ...mockInvoice, status: "draft" } as Invoice;
      invoiceRepo.findOne.mockResolvedValueOnce(draftInvoice);

      const issuedInvoice = { ...draftInvoice, status: "issued", issuedAt: new Date() } as Invoice;
      invoiceRepo.save.mockResolvedValue(issuedInvoice);

      const result = await service.issue("invoice-001", clinicId);

      expect(result.status).toBe("issued");
      expect(result.issuedAt).toBeInstanceOf(Date);
      expect(invoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "issued", issuedAt: expect.any(Date) }),
      );
    });

    // ============================================================
    // Test 4：對 cancelled 發票調用 issue 時拋出 BadRequestException
    // ============================================================
    it("Test 4：對 cancelled 發票調用 issue 時應拋出 BadRequestException", async () => {
      const cancelledInvoice = { ...mockInvoice, status: "cancelled" } as Invoice;
      invoiceRepo.findOne.mockResolvedValueOnce(cancelledInvoice);

      await expect(service.issue("invoice-001", clinicId)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // Test 5：InvoiceService.cancel — issued/draft → cancelled，設定 cancelledAt
  // ============================================================
  describe("cancel", () => {
    it("Test 5：應將 issued 發票轉為 cancelled 並設定 cancelledAt", async () => {
      const issuedInvoice = { ...mockInvoice, status: "issued", issuedAt: new Date() } as Invoice;
      invoiceRepo.findOne.mockResolvedValueOnce(issuedInvoice);

      const cancelledInvoice = {
        ...issuedInvoice,
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "客戶要求取消",
      } as Invoice;
      invoiceRepo.save.mockResolvedValue(cancelledInvoice);

      const result = await service.cancel("invoice-001", clinicId, "客戶要求取消");

      expect(result.status).toBe("cancelled");
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(invoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancelledAt: expect.any(Date),
          cancelReason: "客戶要求取消",
        }),
      );
    });

    it("應將 draft 發票轉為 cancelled", async () => {
      const draftInvoice = { ...mockInvoice, status: "draft" } as Invoice;
      invoiceRepo.findOne.mockResolvedValueOnce(draftInvoice);

      const cancelledInvoice = {
        ...draftInvoice,
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: null,
      } as Invoice;
      invoiceRepo.save.mockResolvedValue(cancelledInvoice);

      const result = await service.cancel("invoice-001", clinicId);

      expect(result.status).toBe("cancelled");
    });

    it("對 cancelled 發票再次 cancel 應拋出 BadRequestException", async () => {
      const cancelledInvoice = { ...mockInvoice, status: "cancelled" } as Invoice;
      invoiceRepo.findOne.mockResolvedValueOnce(cancelledInvoice);

      await expect(service.cancel("invoice-001", clinicId)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // findOne / findByTreatment / findByPatient
  // ============================================================
  describe("findOne", () => {
    it("應回傳指定發票", async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(mockInvoice as Invoice);
      const result = await service.findOne("invoice-001", clinicId);
      expect(result.id).toBe("invoice-001");
    });

    it("發票不存在時應拋出 NotFoundException", async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne("not-exist", clinicId)).rejects.toThrow(NotFoundException);
    });
  });
});
