import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Decimal from "decimal.js";
import { Payment } from "../entities/payment.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { Staff } from "../../staff/entities/staff.entity";

/**
 * 收入總覽 DTO（FIN-06）
 */
export interface RevenueSummaryDto {
  /** 患者付款總額（Payment） */
  totalRevenue: number;
  /** 付款筆數（與 paymentCount 相同，保持向後相容） */
  totalPayments: number;
  paymentCount: number;
  dateRange: { start: string; end: string };
}

/**
 * 月收入趨勢項目（FIN-06）
 * 用於 ECharts 長條圖
 */
export interface MonthlyTrendItem {
  /** 格式：YYYY-MM */
  month: string;
  revenue: number;
  paymentCount: number;
}

/**
 * 支付方式分布（FIN-06）
 * 用於 ECharts 環形圖
 */
export interface PaymentMethodBreakdown {
  method: "cash" | "bank_transfer" | "credit_card";
  /** 現金 | 銀行轉帳 | 刷卡 */
  methodLabel: string;
  total: number;
  count: number;
  /** 占總收入百分比，Decimal.js 計算 */
  percentage: number;
}

/**
 * 醫護人員分潤統計項目（FIN-06）
 */
export interface StaffRevenueItem {
  staffId: string;
  staffName: string;
  role: string;
  totalAmount: number;
  recordCount: number;
}

/**
 * RevenueReportService — 收入報表聚合服務（FIN-06）
 *
 * 提供四個聚合查詢方法：
 * - getRevenueSummary：收入總覽
 * - getMonthlyTrend：月收入趨勢（近 12 個月）
 * - getPaymentMethodBreakdown：支付方式分布
 * - getStaffRevenue：醫護人員分潤統計
 */
@Injectable()
export class RevenueReportService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(RevenueRecord)
    private readonly revenueRecordRepo: Repository<RevenueRecord>,

    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  /**
   * 收入總覽（FIN-06）
   * 預設查詢當月，可傳入自訂日期範圍
   */
  async getRevenueSummary(
    clinicId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueSummaryDto> {
    const { start, end } = this.normalizeDateRange(startDate, endDate);

    const result = await this.paymentRepo
      .createQueryBuilder("payment")
      .select("SUM(payment.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("payment.clinicId = :clinicId", { clinicId })
      .andWhere("payment.status = :status", { status: "completed" })
      .andWhere("payment.paidAt >= :start", { start })
      .andWhere("payment.paidAt <= :end", { end })
      .getRawOne();

    const totalRevenue = new Decimal(result?.total ?? 0)
      .toDecimalPlaces(2)
      .toNumber();
    const count = Number(result?.count ?? 0);

    return {
      totalRevenue,
      totalPayments: count,
      paymentCount: count,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  /**
   * 月收入趨勢（最近 12 個月，FIN-06）
   * 用於 ECharts 長條圖
   */
  async getMonthlyTrend(clinicId: string): Promise<MonthlyTrendItem[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await this.paymentRepo
      .createQueryBuilder("payment")
      .select("strftime('%Y-%m', payment.paidAt)", "month")
      .addSelect("SUM(payment.amount)", "revenue")
      .addSelect("COUNT(*)", "paymentCount")
      .where("payment.clinicId = :clinicId", { clinicId })
      .andWhere("payment.status = :status", { status: "completed" })
      .andWhere("payment.paidAt >= :since", { since: twelveMonthsAgo })
      .groupBy("strftime('%Y-%m', payment.paidAt)")
      .orderBy("month", "ASC")
      .getRawMany();

    return rows.map((r) => ({
      month: r.month as string,
      revenue: new Decimal(r.revenue ?? 0).toDecimalPlaces(2).toNumber(),
      paymentCount: Number(r.paymentCount ?? 0),
    }));
  }

  /**
   * 支付方式分布（FIN-06）
   * 用於 ECharts 環形圖
   */
  async getPaymentMethodBreakdown(
    clinicId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentMethodBreakdown[]> {
    const { start, end } = this.normalizeDateRange(startDate, endDate);

    const rows = await this.paymentRepo
      .createQueryBuilder("payment")
      .select("payment.paymentMethod", "method")
      .addSelect("SUM(payment.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("payment.clinicId = :clinicId", { clinicId })
      .andWhere("payment.status = :status", { status: "completed" })
      .andWhere("payment.paidAt >= :start", { start })
      .andWhere("payment.paidAt <= :end", { end })
      .groupBy("payment.paymentMethod")
      .getRawMany();

    const grandTotal = rows.reduce(
      (sum, r) => sum.plus(new Decimal(r.total ?? 0)),
      new Decimal(0),
    );

    const labels: Record<string, string> = {
      cash: "現金",
      bank_transfer: "銀行轉帳",
      credit_card: "刷卡",
    };

    return rows.map((r) => ({
      method: r.method as "cash" | "bank_transfer" | "credit_card",
      methodLabel: labels[r.method as string] ?? (r.method as string),
      total: new Decimal(r.total ?? 0).toDecimalPlaces(2).toNumber(),
      count: Number(r.count ?? 0),
      percentage: grandTotal.isZero()
        ? 0
        : new Decimal(r.total ?? 0)
            .div(grandTotal)
            .mul(100)
            .toDecimalPlaces(2)
            .toNumber(),
    }));
  }

  /**
   * 醫護人員分潤統計（FIN-06）
   * 基於現有 RevenueRecord（分潤視角），按 totalAmount DESC 排序
   */
  async getStaffRevenue(
    clinicId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StaffRevenueItem[]> {
    const { start, end } = this.normalizeDateRange(startDate, endDate);

    const rows = await this.revenueRecordRepo
      .createQueryBuilder("record")
      .select("record.staffId", "staffId")
      .addSelect("staff.name", "staffName")
      .addSelect("record.role", "role")
      .addSelect("SUM(record.amount)", "totalAmount")
      .addSelect("COUNT(*)", "recordCount")
      .leftJoin(Staff, "staff", "staff.id = record.staffId")
      .where("record.clinicId = :clinicId", { clinicId })
      .andWhere("record.status IN (:...statuses)", {
        statuses: ["calculated", "locked", "paid"],
      })
      .andWhere("record.calculatedAt >= :start", { start })
      .andWhere("record.calculatedAt <= :end", { end })
      .groupBy("record.staffId, record.role, staff.name")
      .orderBy("totalAmount", "DESC")
      .getRawMany();

    return rows.map((r) => ({
      staffId: r.staffId as string,
      staffName: (r.staffName as string) ?? "未知",
      role: r.role as string,
      totalAmount: new Decimal(r.totalAmount ?? 0)
        .toDecimalPlaces(2)
        .toNumber(),
      recordCount: Number(r.recordCount ?? 0),
    }));
  }

  /** 正規化日期範圍（預設當月 1 號到月底最後一天） */
  private normalizeDateRange(
    start?: Date,
    end?: Date,
  ): { start: Date; end: Date } {
    const now = new Date();
    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const defaultEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return {
      start: start ?? defaultStart,
      end: end ?? defaultEnd,
    };
  }
}
