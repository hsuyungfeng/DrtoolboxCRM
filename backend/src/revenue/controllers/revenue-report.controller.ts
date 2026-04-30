import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RevenueReportService } from "../services/revenue-report.service";
import { ReconciliationService } from "../services/reconciliation.service";
import { ClinicScoped } from "../../common/decorators/clinic-scoped.decorator";

/**
 * RevenueReportController — 收入報表查詢 REST API（FIN-06）
 *
 * 所有端點皆以 JwtAuthGuard 保護，clinicId 從 JWT payload 取得。
 *
 * GET /revenue-reports/summary         — 收入總覽
 * GET /revenue-reports/monthly-trend   — 近 12 個月趨勢
 * GET /revenue-reports/payment-methods — 支付方式分布
 * GET /revenue-reports/staff           — 醫護人員分潤統計
 */
@UseGuards(JwtAuthGuard)
@ClinicScoped()
@Controller("revenue-reports")
export class RevenueReportController {
  constructor(
    private readonly reportService: RevenueReportService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  /**
   * GET /revenue-reports/summary?startDate=&endDate=
   * 收入總覽（預設當月）
   */
  @Get("summary")
  getSummary(
    @Request() req: { user: { clinicId: string } },
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getRevenueSummary(req.user.clinicId, start, end);
  }

  /**
   * GET /revenue-reports/monthly-trend
   * 近 12 個月收入趨勢（ECharts 長條圖資料）
   */
  @Get("monthly-trend")
  getMonthlyTrend(@Request() req: { user: { clinicId: string } }) {
    return this.reportService.getMonthlyTrend(req.user.clinicId);
  }

  /**
   * GET /revenue-reports/payment-methods?startDate=&endDate=
   * 支付方式分布（ECharts 環形圖資料）
   */
  @Get("payment-methods")
  getPaymentMethods(
    @Request() req: { user: { clinicId: string } },
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getPaymentMethodBreakdown(
      req.user.clinicId,
      start,
      end,
    );
  }

  /**
   * GET /revenue-reports/staff?startDate=&endDate=
   * 醫護人員分潤統計（按總金額降序）
   */
  @Get("staff")
  getStaffRevenue(
    @Request() req: { user: { clinicId: string } },
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getStaffRevenue(
      req.user.clinicId,
      start,
      end,
    );
  }

  /**
   * GET /revenue-reports/reconciliation/reports
   * 獲取對帳報告列表
   */
  @Get("reconciliation/reports")
  getReconciliationReports(@Request() req: { user: { clinicId: string } }) {
    return this.reconciliationService.getReports(req.user.clinicId);
  }
}
