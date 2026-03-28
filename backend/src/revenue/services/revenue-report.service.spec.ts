import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import Decimal from "decimal.js";
import {
  RevenueReportService,
  RevenueSummaryDto,
  MonthlyTrendItem,
  PaymentMethodBreakdown,
  StaffRevenueItem,
} from "./revenue-report.service";
import { Payment } from "../entities/payment.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Staff } from "../../staff/entities/staff.entity";

// ───────────────────────── Mock factories ─────────────────────────

const createMockQB = (returnValue: unknown) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(returnValue),
  getRawMany: jest.fn().mockResolvedValue(returnValue),
});

const mockPaymentRepo = {
  createQueryBuilder: jest.fn(),
};

const mockRevenueRecordRepo = {
  createQueryBuilder: jest.fn(),
};

const mockStaffRepo = {};

// ───────────────────────── Test suite ─────────────────────────

describe("RevenueReportService", () => {
  let service: RevenueReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueReportService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
        {
          provide: getRepositoryToken(RevenueRecord),
          useValue: mockRevenueRecordRepo,
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepo,
        },
      ],
    }).compile();

    service = module.get<RevenueReportService>(RevenueReportService);
    jest.clearAllMocks();
  });

  // ─── Test 1: getRevenueSummary ───────────────────────────────────
  describe("getRevenueSummary", () => {
    it("應返回 { totalRevenue, totalPayments, paymentCount, dateRange }", async () => {
      const rawResult = { total: "15000.50", count: "25" };
      mockPaymentRepo.createQueryBuilder.mockReturnValue(
        createMockQB(rawResult),
      );

      const result = await service.getRevenueSummary(
        "clinic-001",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(result).toMatchObject<RevenueSummaryDto>({
        totalRevenue: 15000.5,
        totalPayments: 25,
        paymentCount: 25,
        dateRange: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });

      // Decimal.js 精度驗證
      expect(
        new Decimal(result.totalRevenue).equals(new Decimal("15000.50")),
      ).toBe(true);
    });

    // ─── Test 5: 預設日期範圍（當月）─────────────────────────────────
    it("startDate/endDate 為空時，預設查詢當月（1號到今天）", async () => {
      const rawResult = { total: "0", count: "0" };
      mockPaymentRepo.createQueryBuilder.mockReturnValue(
        createMockQB(rawResult),
      );

      const result = await service.getRevenueSummary("clinic-001");

      const now = new Date();
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const resultStart = new Date(result.dateRange.start);
      expect(resultStart.getFullYear()).toBe(expectedStart.getFullYear());
      expect(resultStart.getMonth()).toBe(expectedStart.getMonth());
      expect(resultStart.getDate()).toBe(expectedStart.getDate());
    });
  });

  // ─── Test 2: getMonthlyTrend ─────────────────────────────────────
  describe("getMonthlyTrend", () => {
    it("應返回 12 個月資料，每月含 { month, revenue, paymentCount }", async () => {
      const rawRows = [
        { month: "2024-01", revenue: "5000.00", paymentCount: "10" },
        { month: "2024-02", revenue: "7500.25", paymentCount: "15" },
      ];
      mockPaymentRepo.createQueryBuilder.mockReturnValue(
        createMockQB(rawRows),
      );

      const result = await service.getMonthlyTrend("clinic-001");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);

      if (result.length > 0) {
        const item: MonthlyTrendItem = result[0];
        expect(item).toHaveProperty("month");
        expect(item).toHaveProperty("revenue");
        expect(item).toHaveProperty("paymentCount");
        expect(typeof item.month).toBe("string");
        expect(typeof item.revenue).toBe("number");
        expect(typeof item.paymentCount).toBe("number");
        // month 格式必須是 YYYY-MM
        expect(item.month).toMatch(/^\d{4}-\d{2}$/);
      }
    });
  });

  // ─── Test 3: getPaymentMethodBreakdown ───────────────────────────
  describe("getPaymentMethodBreakdown", () => {
    it("應返回 [{ method, total, count, percentage }]，percentage 使用 Decimal.js 計算", async () => {
      const rawRows = [
        { method: "cash", total: "6000.00", count: "12" },
        { method: "credit_card", total: "4000.00", count: "8" },
      ];
      mockPaymentRepo.createQueryBuilder.mockReturnValue(
        createMockQB(rawRows),
      );

      const result = await service.getPaymentMethodBreakdown("clinic-001");

      expect(result).toHaveLength(2);

      const cashItem = result.find(
        (r: PaymentMethodBreakdown) => r.method === "cash",
      );
      expect(cashItem).toBeDefined();
      expect(cashItem?.total).toBe(6000.0);
      expect(cashItem?.count).toBe(12);
      // cash 佔 60%（6000 / 10000 * 100）
      expect(cashItem?.percentage).toBeCloseTo(60, 1);

      const cardItem = result.find(
        (r: PaymentMethodBreakdown) => r.method === "credit_card",
      );
      expect(cardItem?.percentage).toBeCloseTo(40, 1);

      // Decimal.js 精度：兩者相加應等於 100
      const total = result.reduce(
        (sum: Decimal, r: PaymentMethodBreakdown) =>
          sum.plus(new Decimal(r.percentage)),
        new Decimal(0),
      );
      expect(total.toNumber()).toBeCloseTo(100, 1);

      // methodLabel 應為中文
      expect(cashItem?.methodLabel).toBe("現金");
    });
  });

  // ─── Test 4: getStaffRevenue ─────────────────────────────────────
  describe("getStaffRevenue", () => {
    it("應返回 [{ staffId, staffName, role, totalAmount, recordCount }] 按 totalAmount DESC", async () => {
      const rawRows = [
        {
          staffId: "staff-001",
          staffName: "王醫師",
          role: "doctor",
          totalAmount: "30000.00",
          recordCount: "20",
        },
        {
          staffId: "staff-002",
          staffName: "李治療師",
          role: "therapist",
          totalAmount: "15000.00",
          recordCount: "10",
        },
      ];
      mockRevenueRecordRepo.createQueryBuilder.mockReturnValue(
        createMockQB(rawRows),
      );

      const result = await service.getStaffRevenue("clinic-001");

      expect(result).toHaveLength(2);

      const firstItem: StaffRevenueItem = result[0];
      expect(firstItem.staffId).toBe("staff-001");
      expect(firstItem.staffName).toBe("王醫師");
      expect(firstItem.role).toBe("doctor");
      expect(firstItem.totalAmount).toBe(30000.0);
      expect(firstItem.recordCount).toBe(20);

      // 確保排序是由大到小（第一筆 > 第二筆）
      expect(result[0].totalAmount).toBeGreaterThanOrEqual(result[1].totalAmount);
    });
  });
});
