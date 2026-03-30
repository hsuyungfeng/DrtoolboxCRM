import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { reportApi } from '@/services/revenue-api';

/** 收入總覽型別 */
interface RevenueSummary {
  totalRevenue: number;
  totalPayments: number;
  paymentCount: number;
  dateRange: { start: string; end: string };
}

/** 月收入趨勢項目型別 */
interface MonthlyTrendItem {
  month: string;
  revenue: number;
  paymentCount: number;
}

/** 支付方式分布項目型別 */
interface PaymentMethodItem {
  method: string;
  methodLabel: string;
  total: number;
  count: number;
  percentage: number;
}

/** 醫護人員分潤統計項目型別 */
interface StaffRevenueItem {
  staffId: string;
  staffName: string;
  role: string;
  totalAmount: number;
  recordCount: number;
}

/**
 * useRevenueStore — 收入管理 Pinia Store（FIN-06）
 *
 * 管理收入報表狀態，提供 ECharts 圖表計算屬性：
 * - monthlyTrendChartOption：月收入長條圖設定
 * - paymentMethodChartOption：支付方式環形圖設定
 */
export const useRevenueStore = defineStore('revenue', () => {
  // ── 狀態 ─────────────────────────────────────────────────────────

  const summary = ref<RevenueSummary | null>(null);
  const monthlyTrend = ref<MonthlyTrendItem[]>([]);
  const paymentMethods = ref<PaymentMethodItem[]>([]);
  const staffRevenue = ref<StaffRevenueItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ── 計算屬性：ECharts 月趨勢長條圖 ──────────────────────────────

  const monthlyTrendChartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: monthlyTrend.value.map((d) => d.month),
    },
    yAxis: {
      type: 'value',
      name: '收入（元）',
    },
    series: [
      {
        name: '月收入',
        type: 'bar',
        data: monthlyTrend.value.map((d) => d.revenue),
        itemStyle: { color: '#18a058' },
      },
    ],
  }));

  // ── 計算屬性：ECharts 支付方式環形圖 ────────────────────────────

  const paymentMethodChartOption = computed(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}元 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '支付方式',
        type: 'pie',
        radius: ['40%', '70%'],
        data: paymentMethods.value.map((m) => ({
          name: m.methodLabel,
          value: m.total,
        })),
      },
    ],
  }));

  // ── 計算屬性：平均單筆金額 ──────────────────────────────────────

  const averagePaymentAmount = computed(() => {
    if (!summary.value || summary.value.paymentCount === 0) return 0;
    return Math.round(summary.value.totalRevenue / summary.value.paymentCount);
  });

  // ── Actions ──────────────────────────────────────────────────────

  /**
   * 載入報表資料（並行請求全部 4 個端點）
   */
  async function loadReportData(startDate?: string, endDate?: string) {
    loading.value = true;
    error.value = null;

    try {
      const [summaryRes, trendRes, methodsRes, staffRes] = await Promise.all([
        reportApi.getSummary({ startDate, endDate }),
        reportApi.getMonthlyTrend(),
        reportApi.getPaymentMethods({ startDate, endDate }),
        reportApi.getStaffRevenue({ startDate, endDate }),
      ]);

      summary.value = summaryRes as unknown as RevenueSummary;
      monthlyTrend.value = trendRes as unknown as MonthlyTrendItem[];
      paymentMethods.value = methodsRes as unknown as PaymentMethodItem[];
      staffRevenue.value = staffRes as unknown as StaffRevenueItem[];
    } catch (e: unknown) {
      error.value = '載入報表資料失敗';
      console.error('[RevenueStore] 載入報表失敗：', e);
    } finally {
      loading.value = false;
    }
  }

  return {
    // 狀態
    summary,
    monthlyTrend,
    paymentMethods,
    staffRevenue,
    loading,
    error,
    // 計算屬性
    monthlyTrendChartOption,
    paymentMethodChartOption,
    averagePaymentAmount,
    // Actions
    loadReportData,
  };
});
