<template>
  <div class="revenue-view">
    <div class="page-header">
      <h1>分潤管理</h1>
      <n-space>
        <n-button type="primary" @click="showCreateRuleModal = true">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </n-icon>
          </template>
          新增規則
        </n-button>
        <n-button secondary>
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
              </svg>
            </n-icon>
          </template>
          導出報表
        </n-button>
      </n-space>
    </div>

    <n-card>
      <n-tabs type="line" animated @update:value="onTabChange">
        <n-tab-pane name="records" tab="分潤記錄">
          <n-data-table
            :columns="recordColumns"
            :data="revenueRecords"
            :loading="loadingRecords"
            :pagination="pagination"
            :row-key="(row) => row.id"
          />
        </n-tab-pane>
        <n-tab-pane name="rules" tab="分潤規則">
          <n-data-table
             :columns="ruleColumns"
             :data="revenueRules"
             :loading="loadingRules"
             :pagination="pagination"
             :row-key="(row) => row.id"
           />
         </n-tab-pane>
        <n-tab-pane name="adjustments" tab="分潤調整">
            <n-data-table
              :columns="adjustmentColumns"
              :data="revenueAdjustments"
              :loading="loadingAdjustments"
              :pagination="pagination"
              :row-key="(row) => row.id"
            />
          </n-tab-pane>
          <n-tab-pane name="calculator" tab="分潤試算">
            <div class="calculator-section">
              <n-card title="即時分潤試算" subtitle="輸入療程金額，即時查看各角色分潤分配">
                <n-space vertical :size="16">
                  <n-form-item label="療程類型" path="treatmentType">
                    <n-select
                      v-model:value="calculatorForm.treatmentType"
                      :options="treatmentTypeOptions"
                      placeholder="請選擇療程類型"
                      style="width: 300px"
                    />
                  </n-form-item>
                  <n-form-item label="療程金額" path="amount">
                    <n-input-number
                      v-model:value="calculatorForm.amount"
                      :min="0"
                      :step="100"
                      placeholder="請輸入療程金額"
                      style="width: 300px"
                    >
                      <template #prefix>¥</template>
                    </n-input-number>
                  </n-form-item>
                  <n-button type="primary" @click="calculatePPF" :disabled="!calculatorForm.amount">
                    開始試算
                  </n-button>
                </n-space>
              </n-card>

              <n-card v-if="calculationResult.length > 0" title="試算結果" style="margin-top: 16px">
                <n-data-table
                  :columns="previewColumns"
                  :data="calculationResult"
                  :pagination="false"
                />
                <div class="total-summary">
                  <n-statistic label="總分潤金額" :value="totalCalculatedAmount">
                    <template #prefix>¥</template>
                  </n-statistic>
                  <n-statistic label="分潤率" :value="totalPercentage" suffix="%">
                  </n-statistic>
                </div>
              </n-card>

              <n-card v-if="tieredPreview.length > 0" title="階梯式規則預覽" style="margin-top: 16px">
                <n-data-table
                  :columns="tieredColumns"
                  :data="tieredPreview"
                  :pagination="false"
                />
              </n-card>
            </div>
          </n-tab-pane>
        <n-tab-pane name="reports" tab="收入報表">
          <div class="report-section">
            <!-- 日期範圍選擇器 -->
            <n-card style="margin-bottom: 16px">
              <n-space align="center">
                <span>日期範圍：</span>
                <n-date-picker
                  v-model:value="reportDateRange"
                  type="daterange"
                  clearable
                  :shortcuts="dateShortcuts"
                  style="width: 280px"
                  @update:value="handleDateRangeChange"
                />
                <n-button type="primary" @click="refreshReportData" :loading="revenueStore.loading">
                  重新整理
                </n-button>
              </n-space>
            </n-card>

            <!-- 統計卡片行 -->
            <n-grid :cols="3" :x-gap="16" style="margin-bottom: 16px">
              <n-gi>
                <n-card>
                  <n-statistic label="本期總收入（元）" :value="revenueStore.summary?.totalRevenue ?? 0">
                    <template #prefix>$</template>
                  </n-statistic>
                </n-card>
              </n-gi>
              <n-gi>
                <n-card>
                  <n-statistic label="付款筆數" :value="revenueStore.summary?.paymentCount ?? 0" />
                </n-card>
              </n-gi>
              <n-gi>
                <n-card>
                  <n-statistic label="平均單筆金額（元）" :value="revenueStore.averagePaymentAmount">
                    <template #prefix>$</template>
                  </n-statistic>
                </n-card>
              </n-gi>
            </n-grid>

            <!-- 圖表區域 -->
            <n-grid :cols="2" :x-gap="16" style="margin-bottom: 16px">
              <n-gi>
                <n-card title="月收入趨勢（近 12 個月）">
                  <v-chart
                    :option="revenueStore.monthlyTrendChartOption"
                    autoresize
                    style="height: 300px"
                  />
                </n-card>
              </n-gi>
              <n-gi>
                <n-card title="支付方式分布">
                  <v-chart
                    :option="revenueStore.paymentMethodChartOption"
                    autoresize
                    style="height: 280px"
                  />
                </n-card>
              </n-gi>
            </n-grid>

            <!-- 醫護人員分潤明細表 -->
            <n-card title="醫護人員分潤統計">
              <n-data-table
                :columns="staffRevenueColumns"
                :data="revenueStore.staffRevenue"
                :loading="revenueStore.loading"
                :pagination="{ pageSize: 10 }"
                :row-key="(row) => row.staffId + row.role"
              />
            </n-card>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 新增規則模態框 -->
    <n-modal
      v-model:show="showCreateRuleModal"
      preset="dialog"
      title="新增分潤規則"
      positive-text="確認"
      negative-text="取消"
      @positive-click="handleCreateRule"
    >
      <n-form ref="ruleFormRef" :model="ruleFormValue" :rules="ruleRules">
        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="ruleFormValue.role"
            :options="roleOptions"
            placeholder="請選擇適用角色"
          />
        </n-form-item>
        <n-form-item label="規則類型" path="ruleType">
          <n-select
            v-model:value="ruleFormValue.ruleType"
            :options="ruleTypeOptions"
            placeholder="請選擇規則類型"
          />
        </n-form-item>
        <n-form-item label="生效日期" path="effectiveFrom">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveFrom"
            type="date"
            style="width: 100%"
            placeholder="請選擇生效日期"
          />
        </n-form-item>
        <n-form-item label="失效日期" path="effectiveTo">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveTo"
            type="date"
            style="width: 100%"
            placeholder="請選擇失效日期（可選）"
            clearable
          />
        </n-form-item>
        
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="ruleFormValue.description"
            type="textarea"
            placeholder="請輸入規則描述（可選）"
            :autosize="{ minRows: 2, maxRows: 5 }"
          />
        </n-form-item>
        
        <!-- 動態規則參數字段 -->
        <n-form-item v-if="showPercentageField" label="百分比 (%)" path="rulePayload.percentage">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.percentage"
            :min="0"
            :max="100"
            :step="0.1"
            placeholder="請輸入百分比"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showFixedField" label="固定金額" path="rulePayload.amount">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.amount"
            :min="0"
            :step="100"
            placeholder="請輸入固定金額"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showTieredFields" label="階梯設定" path="rulePayload.tiers">
          <div style="width: 100%">
            <div v-for="(tier, index) in ruleFormValue.rulePayload.tiers" :key="index" style="margin-bottom: 12px; display: flex; gap: 8px;">
              <n-input-number
                v-model:value="tier.threshold"
                :min="0"
                :step="1000"
                placeholder="門檻金額"
                style="flex: 1"
              />
              <n-input-number
                v-model:value="tier.percentage"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比 (%)"
                style="flex: 1"
              />
              <n-button
                size="small"
                @click="removeTier(index)"
                :disabled="ruleFormValue.rulePayload.tiers.length <= 1"
              >
                移除
              </n-button>
            </div>
            <n-button @click="addTier" size="small">添加階梯</n-button>
          </div>
        </n-form-item>
        
        <n-form-item label="是否啟用" path="isActive">
          <n-switch v-model:value="ruleFormValue.isActive" />
        </n-form-item>
      </n-form>
    </n-modal>
    
    <!-- 編輯規則模態框 -->
    <n-modal
      v-model:show="showEditRuleModal"
      preset="dialog"
      title="編輯分潤規則"
      positive-text="確認"
      negative-text="取消"
      @positive-click="handleUpdateRule"
    >
      <n-form ref="ruleFormRef" :model="ruleFormValue" :rules="ruleRules">
        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="ruleFormValue.role"
            :options="roleOptions"
            placeholder="請選擇適用角色"
          />
        </n-form-item>
        <n-form-item label="規則類型" path="ruleType">
          <n-select
            v-model:value="ruleFormValue.ruleType"
            :options="ruleTypeOptions"
            placeholder="請選擇規則類型"
          />
        </n-form-item>
        <n-form-item label="生效日期" path="effectiveFrom">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveFrom"
            type="date"
            style="width: 100%"
            placeholder="請選擇生效日期"
          />
        </n-form-item>
        <n-form-item label="失效日期" path="effectiveTo">
          <n-date-picker
            v-model:value="ruleFormValue.effectiveTo"
            type="date"
            style="width: 100%"
            placeholder="請選擇失效日期（可選）"
            clearable
          />
        </n-form-item>
        
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="ruleFormValue.description"
            type="textarea"
            placeholder="請輸入規則描述（可選）"
            :autosize="{ minRows: 2, maxRows: 5 }"
          />
        </n-form-item>
        
        <!-- 動態規則參數字段 -->
        <n-form-item v-if="showPercentageField" label="百分比 (%)" path="rulePayload.percentage">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.percentage"
            :min="0"
            :max="100"
            :step="0.1"
            placeholder="請輸入百分比"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showFixedField" label="固定金額" path="rulePayload.amount">
          <n-input-number
            v-model:value="ruleFormValue.rulePayload.amount"
            :min="0"
            :step="100"
            placeholder="請輸入固定金額"
            style="width: 100%"
          />
        </n-form-item>
        
        <n-form-item v-if="showTieredFields" label="階梯設定" path="rulePayload.tiers">
          <div style="width: 100%">
            <div v-for="(tier, index) in ruleFormValue.rulePayload.tiers" :key="index" style="margin-bottom: 12px; display: flex; gap: 8px;">
              <n-input-number
                v-model:value="tier.threshold"
                :min="0"
                :step="1000"
                placeholder="門檻金額"
                style="flex: 1"
              />
              <n-input-number
                v-model:value="tier.percentage"
                :min="0"
                :max="100"
                :step="0.1"
                placeholder="百分比 (%)"
                style="flex: 1"
              />
              <n-button
                size="small"
                @click="removeTier(index)"
                :disabled="ruleFormValue.rulePayload.tiers.length <= 1"
              >
                移除
              </n-button>
            </div>
            <n-button @click="addTier" size="small">添加階梯</n-button>
          </div>
        </n-form-item>
        
        <n-form-item label="是否啟用" path="isActive">
          <n-switch v-model:value="ruleFormValue.isActive" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import {
  NButton, NTag, NSpace, NIcon, NDataTable, NCard, NModal,
  NForm, NFormItem, NSelect, NDatePicker, NSwitch, NTabs, NTabPane,
  NInput, NInputNumber, useDialog, useMessage, NStatistic,
  NGrid, NGi,
} from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules, SelectOption } from 'naive-ui';
import type { RevenueRecord, RevenueRule, RevenueAdjustment } from '@/types';
import { revenueApi, revenueAdjustmentApi } from '@/services/api';

// ECharts 元件（收入報表用）
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

// 收入報表 Store
import { useRevenueStore } from '@/stores/revenue.store';

// 收入報表 Store 初始化
const revenueStore = useRevenueStore();

// 報表日期範圍（timestamp pair for n-date-picker type="daterange"）
const reportDateRange = ref<[number, number] | null>(null);

// 日期快捷鍵
const dateShortcuts = {
  本月: (): [number, number] => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start.getTime(), end.getTime()];
  },
  上月: (): [number, number] => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return [start.getTime(), end.getTime()];
  },
  本季: (): [number, number] => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    return [start.getTime(), end.getTime()];
  },
};

// 醫護人員分潤統計表格欄位
const staffRevenueColumns: DataTableColumns<{
  staffId: string;
  staffName: string;
  role: string;
  totalAmount: number;
  recordCount: number;
}> = [
  {
    title: '人員名稱',
    key: 'staffName',
  },
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap: Record<string, string> = {
        doctor: '醫師',
        therapist: '治療師',
        assistant: '助理',
        consultant: '顧問',
        admin: '管理員',
      };
      return roleMap[row.role] ?? row.role;
    },
  },
  {
    title: '分潤金額（元）',
    key: 'totalAmount',
    render(row) {
      return h('span', { style: 'font-weight: bold;' }, `$${Number(row.totalAmount).toLocaleString()}`);
    },
  },
  {
    title: '記錄筆數',
    key: 'recordCount',
  },
];

// 處理日期範圍變更
function handleDateRangeChange(value: [number, number] | null) {
  if (value) {
    const startDate = new Date(value[0]).toISOString().split('T')[0];
    const endDate = new Date(value[1]).toISOString().split('T')[0];
    revenueStore.loadReportData(startDate, endDate);
  } else {
    revenueStore.loadReportData();
  }
}

// 手動重新整理報表
function refreshReportData() {
  if (reportDateRange.value) {
    const startDate = new Date(reportDateRange.value[0]).toISOString().split('T')[0];
    const endDate = new Date(reportDateRange.value[1]).toISOString().split('T')[0];
    revenueStore.loadReportData(startDate, endDate);
  } else {
    revenueStore.loadReportData();
  }
}

const loadingRecords = ref(false);
const loadingRules = ref(false);
const revenueRecords = ref<RevenueRecord[]>([]);
const revenueRules = ref<RevenueRule[]>([]);
const revenueAdjustments = ref<RevenueAdjustment[]>([]);
const loadingAdjustments = ref(false);
const showCreateRuleModal = ref(false);
const showEditRuleModal = ref(false);
const editingRuleId = ref<string | null>(null);

const calculatorForm = ref({
  treatmentType: '',
  amount: 0,
});

const calculationResult = ref<any[]>([]);
const tieredPreview = ref<any[]>([]);

const treatmentTypeOptions: SelectOption[] = [
  { label: '一般療程', value: 'general' },
  { label: '美容護理', value: 'beauty' },
  { label: '醫療手術', value: 'medical' },
  { label: '復健治療', value: 'rehab' },
];

const ruleFormRef = ref<FormInst | null>(null);
const ruleFormValue = ref({
  role: '',
  ruleType: 'percentage' as RevenueRule['ruleType'],
  effectiveFrom: Date.now(),
  effectiveTo: undefined as number | undefined,
  isActive: true,
  description: '',
  rulePayload: {
    percentage: 0,
    amount: 0,
    tiers: [
      { threshold: 0, percentage: 0 }
    ]
  },
});

// 根據規則類型動態顯示 rulePayload 字段
const showPercentageField = computed(() => ruleFormValue.value.ruleType === 'percentage');
const showFixedField = computed(() => ruleFormValue.value.ruleType === 'fixed');
const showTieredFields = computed(() => ruleFormValue.value.ruleType === 'tiered');

const totalCalculatedAmount = computed(() => {
  return calculationResult.value.reduce((sum, item) => sum + item.amount, 0);
});

const totalPercentage = computed(() => {
  if (!calculatorForm.value.amount) return 0;
  return ((totalCalculatedAmount.value / calculatorForm.value.amount) * 100).toFixed(2);
});

const roleOptions: SelectOption[] = [
  { label: '醫生', value: 'doctor' },
  { label: '治療師', value: 'therapist' },
  { label: '助理', value: 'assistant' },
  { label: '顧問', value: 'consultant' },
  { label: '管理員', value: 'admin' },
];

const ruleTypeOptions: SelectOption[] = [
  { label: '百分比', value: 'percentage' },
  { label: '固定金額', value: 'fixed' },
  { label: '階梯式', value: 'tiered' },
];

const ruleRules: FormRules = {
  role: [
    { required: true, message: '請選擇角色', trigger: 'blur' },
  ],
  ruleType: [
    { required: true, message: '請選擇規則類型', trigger: 'blur' },
  ],
  effectiveFrom: [
    { required: true, type: 'number', message: '請選擇生效日期', trigger: 'blur' },
  ],
  description: [
    { max: 255, message: '描述最多255個字符', trigger: 'blur' },
  ],
  'rulePayload.percentage': [
    {
      validator: (_rule, value) => {
        if (ruleFormValue.value.ruleType === 'percentage') {
          return value > 0 && value <= 100;
        }
        return true;
      },
      message: '百分比必須在0到100之間',
      trigger: 'blur'
    }
  ],
  'rulePayload.amount': [
    {
      validator: (_rule, value) => {
        if (ruleFormValue.value.ruleType === 'fixed') {
          return value > 0;
        }
        return true;
      },
      message: '金額必須大於0',
      trigger: 'blur'
    }
  ],
};

const pagination = {
  pageSize: 10,
};

const recordColumns: DataTableColumns<RevenueRecord> = [
  {
    title: '療程 ID',
    key: 'treatmentId',
    width: 120,
    render(row) {
      return h('span', { style: 'font-family: monospace;' }, row.treatmentId.substring(0, 8) + '...');
    },
  },
  {
    title: '員工 ID',
    key: 'staffId',
    width: 120,
    render(row) {
      return h('span', { style: 'font-family: monospace;' }, row.staffId.substring(0, 8) + '...');
    },
  },
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap = {
        doctor: { text: '醫生', type: 'info' as const },
        therapist: { text: '治療師', type: 'success' as const },
        assistant: { text: '助理', type: 'warning' as const },
        consultant: { text: '顧問', type: 'default' as const },
        admin: { text: '管理員', type: 'error' as const },
      };
      const role = roleMap[row.role as keyof typeof roleMap] || { text: row.role, type: 'default' as const };
      return h(NTag, { type: role.type }, { default: () => role.text });
    },
  },
  {
    title: '金額',
    key: 'amount',
    render(row) {
      return h('span', { style: 'font-weight: bold;' }, `$${row.amount.toLocaleString()}`);
    },
  },
  {
    title: '計算類型',
    key: 'calculationType',
    render(row) {
      const typeMap = {
        treatment: { text: '療程', type: 'info' as const },
        session: { text: '次數', type: 'success' as const },
      };
      const type = typeMap[row.calculationType];
      return h(NTag, { type: type.type }, { default: () => type.text });
    },
  },
  {
    title: '狀態',
    key: 'status',
    render(row) {
      const statusMap = {
        pending: { text: '待計算', type: 'default' as const },
        calculated: { text: '已計算', type: 'warning' as const },
        locked: { text: '已鎖定', type: 'success' as const },
        adjusted: { text: '已調整', type: 'error' as const },
      };
      const status = statusMap[row.status];
      return h(NTag, { type: status.type }, { default: () => status.text });
    },
  },
  {
    title: '計算時間',
    key: 'calculatedAt',
    render(row) {
      return new Date(row.calculatedAt).toLocaleDateString();
    },
  },
  {
    title: '鎖定時間',
    key: 'lockedAt',
    render(row) {
      return row.lockedAt ? new Date(row.lockedAt).toLocaleDateString() : '-';
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          onClick: () => viewRecord(row.id),
        }, { default: () => '查看' }),
        h(NButton, {
          size: 'small',
          type: 'warning',
          disabled: row.status === 'locked',
          onClick: () => lockRecord(row.id),
        }, { default: () => '鎖定' }),
      ]);
    },
  },
];

const ruleColumns: DataTableColumns<RevenueRule> = [
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap = {
        doctor: { text: '醫生', type: 'info' as const },
        therapist: { text: '治療師', type: 'success' as const },
        assistant: { text: '助理', type: 'warning' as const },
        consultant: { text: '顧問', type: 'default' as const },
        admin: { text: '管理員', type: 'error' as const },
      };
      const role = roleMap[row.role as keyof typeof roleMap] || { text: row.role, type: 'default' as const };
      return h(NTag, { type: role.type }, { default: () => role.text });
    },
  },
  {
    title: '規則類型',
    key: 'ruleType',
    render(row) {
      const typeMap = {
        percentage: { text: '百分比', type: 'info' as const },
        fixed: { text: '固定金額', type: 'success' as const },
        tiered: { text: '階梯式', type: 'warning' as const },
      };
      const type = typeMap[row.ruleType];
      return h(NTag, { type: type.type }, { default: () => type.text });
    },
  },
  {
    title: '生效時間',
    key: 'effectiveFrom',
    render(row) {
      return new Date(row.effectiveFrom).toLocaleDateString();
    },
  },
  {
    title: '失效時間',
    key: 'effectiveTo',
    render(row) {
      return row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString() : '-';
    },
  },
  {
    title: '狀態',
    key: 'isActive',
    render(row) {
      return h(NTag, {
        type: row.isActive ? 'success' : 'default',
      }, { default: () => row.isActive ? '啟用中' : '已停用' });
    },
  },
  {
    title: '創建時間',
    key: 'createdAt',
    render(row) {
      return new Date(row.createdAt).toLocaleDateString();
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          onClick: () => viewRule(row.id),
        }, { default: () => '查看' }),
        h(NButton, {
          size: 'small',
          type: 'warning',
          onClick: () => editRule(row.id),
        }, { default: () => '編輯' }),
        h(NButton, {
          size: 'small',
          type: 'error',
          onClick: () => deleteRule(row.id),
        }, { default: () => '刪除' }),
      ]);
    },
  },
];

const adjustmentColumns: DataTableColumns<RevenueAdjustment> = [
  {
    title: '分潤記錄 ID',
    key: 'revenueRecordId',
    width: 120,
    render(row) {
      return h('span', { style: 'font-family: monospace;' }, row.revenueRecordId.substring(0, 8) + '...');
    },
  },
  {
    title: '員工 ID',
    key: 'staffId',
    width: 120,
    render(row) {
      return h('span', { style: 'font-family: monospace;' }, row.staffId.substring(0, 8) + '...');
    },
  },
  {
    title: '調整類型',
    key: 'adjustmentType',
    render(row) {
      const typeMap = {
        increase: { text: '增加', type: 'success' as const },
        decrease: { text: '減少', type: 'error' as const },
      };
      const type = typeMap[row.adjustmentType];
      return h(NTag, { type: type.type }, { default: () => type.text });
    },
  },
  {
    title: '金額',
    key: 'amount',
    render(row) {
      return h('span', { style: 'font-weight: bold;' }, `$${row.amount.toLocaleString()}`);
    },
  },
  {
    title: '原因',
    key: 'reason',
    width: 200,
  },
  {
    title: '狀態',
    key: 'status',
    render(row) {
      const statusMap = {
        pending: { text: '待審核', type: 'warning' as const },
        approved: { text: '已批准', type: 'success' as const },
        rejected: { text: '已拒絕', type: 'error' as const },
      };
      const status = statusMap[row.status];
      return h(NTag, { type: status.type }, { default: () => status.text });
    },
  },
  {
    title: '審核人',
    key: 'reviewedBy',
    render(row) {
      return row.reviewedBy ? h('span', row.reviewedBy) : h('span', '-');
    },
  },
  {
    title: '審核時間',
    key: 'reviewedAt',
    render(row) {
      return row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString() : '-';
    },
  },
  {
    title: '創建時間',
    key: 'createdAt',
    render(row) {
      return new Date(row.createdAt).toLocaleDateString();
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          onClick: () => viewAdjustment(row.id),
        }, { default: () => '查看' }),
        h(NButton, {
          size: 'small',
          type: 'warning',
          disabled: row.status !== 'pending',
          onClick: () => reviewAdjustment(row.id),
        }, { default: () => '審核' }),
      ]);
    },
  },
];

const previewColumns: DataTableColumns<any> = [
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap: Record<string, { text: string; type: string }> = {
        doctor: { text: '醫生', type: 'info' },
        therapist: { text: '治療師', type: 'success' },
        assistant: { text: '助理', type: 'warning' },
        consultant: { text: '顧問', type: 'default' },
        admin: { text: '管理員', type: 'error' },
      };
      const role = roleMap[row.role] || { text: row.role, type: 'default' };
      return h(NTag, { type: role.type as any }, { default: () => role.text });
    },
  },
  {
    title: '規則類型',
    key: 'ruleType',
    render(row) {
      const typeMap: Record<string, { text: string; type: string }> = {
        percentage: { text: '百分比', type: 'info' },
        fixed: { text: '固定金額', type: 'success' },
        tiered: { text: '階梯式', type: 'warning' },
      };
      const type = typeMap[row.ruleType] || { text: row.ruleType, type: 'default' };
      return h(NTag, { type: type.type as any }, { default: () => type.text });
    },
  },
  {
    title: '計算參數',
    key: 'params',
    render(row) {
      if (row.ruleType === 'percentage') {
        return `${row.params.percentage}%`;
      } else if (row.ruleType === 'fixed') {
        return `¥${row.params.amount}`;
      } else {
        return '階梯式';
      }
    },
  },
  {
    title: '分潤金額',
    key: 'amount',
    render(row) {
      return h('span', { style: 'font-weight: bold; color: #18a058;' }, `¥${row.amount.toLocaleString()}`);
    },
  },
  {
    title: '佔比',
    key: 'percentage',
    render(row) {
      return `${row.percentage.toFixed(2)}%`;
    },
  },
];

const tieredColumns: DataTableColumns<any> = [
  {
    title: '門檻金額',
    key: 'threshold',
    render(row) {
      return `¥${row.threshold.toLocaleString()}`;
    },
  },
  {
    title: '適用百分比',
    key: 'percentage',
    render(row) {
      return `${row.percentage}%`;
    },
  },
  {
    title: '說明',
    key: 'description',
  },
];

// 生命周期
onMounted(async () => {
  await loadRevenueData();
});

// 方法
function calculatePPF() {
  const amount = calculatorForm.value.amount;
  if (!amount || amount <= 0) return;

  const results: any[] = [];
  const activeRules = revenueRules.value.filter(r => r.isActive);

  activeRules.forEach(rule => {
    let calculatedAmount = 0;
    const ruleType = rule.ruleType;
    const payload = rule.rulePayload;

    if (ruleType === 'percentage' && payload.percentage) {
      calculatedAmount = (amount * payload.percentage) / 100;
    } else if (ruleType === 'fixed' && payload.amount) {
      calculatedAmount = payload.amount;
    }

    if (calculatedAmount > 0) {
      results.push({
        role: rule.role,
        ruleType: ruleType,
        params: payload,
        amount: Math.round(calculatedAmount * 100) / 100,
        percentage: (calculatedAmount / amount) * 100,
      });
    }
  });

  calculationResult.value = results;

  const tieredRules = activeRules.filter(r => r.ruleType === 'tiered' && r.rulePayload?.tiers);
  const tieredResults: any[] = [];
  
  tieredRules.forEach(rule => {
    const tiers = rule.rulePayload.tiers.sort((a: any, b: any) => b.threshold - a.threshold);
    const applicableTier = tiers.find((tier: any) => amount >= tier.threshold);
    
    if (applicableTier) {
      tieredResults.push({
        threshold: applicableTier.threshold,
        percentage: applicableTier.percentage,
        description: `金額 ¥${amount.toLocaleString()} 適用於門檻 ¥${applicableTier.threshold.toLocaleString()}`,
      });
    }
  });

  tieredPreview.value = tieredResults;
}

function addTier() {
  ruleFormValue.value.rulePayload.tiers.push({ threshold: 0, percentage: 0 });
}

function removeTier(index: number) {
  ruleFormValue.value.rulePayload.tiers.splice(index, 1);
}

async function loadRevenueData() {
  try {
    loadingRecords.value = true;
    loadingRules.value = true;
    loadingAdjustments.value = true;
    const clinicId = 'clinic_001';
    revenueRecords.value = await revenueApi.getRecords(clinicId);
    revenueRules.value = await revenueApi.getRules(clinicId);
    revenueAdjustments.value = await revenueAdjustmentApi.getAdjustments(clinicId);
  } catch (error) {
    console.error('加載分潤數據失敗:', error);
  } finally {
    loadingRecords.value = false;
    loadingRules.value = false;
    loadingAdjustments.value = false;
  }
}

function viewRecord(id: string) {
  // TODO: 實現查看分潤記錄詳情
  console.log('查看分潤記錄:', id);
}

async function lockRecord(id: string) {
  try {
    await revenueApi.lockRecord(id);
    await loadRevenueData();
  } catch (error) {
    console.error('鎖定分潤記錄失敗:', error);
  }
}

function viewRule(id: string) {
  // TODO: 實現查看分潤規則詳情
  console.log('查看分潤規則:', id);
}

async function editRule(id: string) {
  try {
    const clinicId = 'clinic_001';
    const rule = await revenueApi.getRuleById(id, clinicId);
    
    // 填充表單數據
    ruleFormValue.value = {
      role: rule.role,
      ruleType: rule.ruleType,
      effectiveFrom: new Date(rule.effectiveFrom).getTime(),
      effectiveTo: rule.effectiveTo ? new Date(rule.effectiveTo).getTime() : undefined,
      isActive: rule.isActive,
      description: rule.description || '',
      rulePayload: {
        percentage: rule.rulePayload?.percentage || 0,
        amount: rule.rulePayload?.amount || 0,
        tiers: rule.rulePayload?.tiers || [{ threshold: 0, percentage: 0 }]
      },
    };
    
    editingRuleId.value = id;
    showEditRuleModal.value = true;
  } catch (error) {
    console.error('加載分潤規則失敗:', error);
  }
}

async function deleteRule(id: string) {
  try {
    if (window.confirm('確定要刪除此分潤規則嗎？此操作無法復原。')) {
      await revenueApi.deleteRule(id);
      await loadRevenueData();
    }
  } catch (error) {
    console.error('刪除分潤規則失敗:', error);
  }
}

async function handleCreateRule() {
  try {
    // 表單驗證
    if (ruleFormRef.value) {
      await ruleFormRef.value.validate();
    }
    
    // 構建規則數據
    const ruleData: any = {
      role: ruleFormValue.value.role,
      ruleType: ruleFormValue.value.ruleType,
      effectiveFrom: new Date(ruleFormValue.value.effectiveFrom).toISOString().split('T')[0],
      isActive: ruleFormValue.value.isActive,
      description: ruleFormValue.value.description,
      clinicId: 'clinic_001', // 暫時硬編碼，實際應從 userStore 獲取
    };

    // 添加失效日期（如果有）
    if (ruleFormValue.value.effectiveTo) {
      ruleData.effectiveTo = new Date(ruleFormValue.value.effectiveTo).toISOString().split('T')[0];
    }

    // 根據規則類型構建 rulePayload
    switch (ruleFormValue.value.ruleType) {
      case 'percentage':
        ruleData.rulePayload = {
          percentage: ruleFormValue.value.rulePayload.percentage
        };
        break;
      case 'fixed':
        ruleData.rulePayload = {
          amount: ruleFormValue.value.rulePayload.amount
        };
        break;
      case 'tiered':
        ruleData.rulePayload = {
          tiers: ruleFormValue.value.rulePayload.tiers.map((tier: any) => ({
            threshold: tier.threshold,
            percentage: tier.percentage
          }))
        };
        break;
    }

    console.log('創建分潤規則:', ruleData);
    await revenueApi.createRule(ruleData);
    showCreateRuleModal.value = false;
    await loadRevenueData();
    
    // 重置表單
    ruleFormValue.value = {
      role: '',
      ruleType: 'percentage',
      effectiveFrom: Date.now(),
      effectiveTo: undefined,
      isActive: true,
      description: '',
      rulePayload: {
        percentage: 0,
        amount: 0,
        tiers: [
          { threshold: 0, percentage: 0 }
        ]
      },
    };
  } catch (error) {
    console.error('創建分潤規則失敗:', error);
  }
}

async function handleUpdateRule() {
  try {
    // 表單驗證
    if (ruleFormRef.value) {
      await ruleFormRef.value.validate();
    }
    
    if (!editingRuleId.value) {
      console.error('沒有編輯規則 ID');
      return;
    }
    
    // 構建規則數據
    const ruleData: any = {
      role: ruleFormValue.value.role,
      ruleType: ruleFormValue.value.ruleType,
      effectiveFrom: new Date(ruleFormValue.value.effectiveFrom).toISOString().split('T')[0],
      isActive: ruleFormValue.value.isActive,
      description: ruleFormValue.value.description,
      clinicId: 'clinic_001', // 暫時硬編碼，實際應從 userStore 獲取
    };

    // 添加失效日期（如果有）
    if (ruleFormValue.value.effectiveTo) {
      ruleData.effectiveTo = new Date(ruleFormValue.value.effectiveTo).toISOString().split('T')[0];
    }

    // 根據規則類型構建 rulePayload
    switch (ruleFormValue.value.ruleType) {
      case 'percentage':
        ruleData.rulePayload = {
          percentage: ruleFormValue.value.rulePayload.percentage
        };
        break;
      case 'fixed':
        ruleData.rulePayload = {
          amount: ruleFormValue.value.rulePayload.amount
        };
        break;
      case 'tiered':
        ruleData.rulePayload = {
          tiers: ruleFormValue.value.rulePayload.tiers.map((tier: any) => ({
            threshold: tier.threshold,
            percentage: tier.percentage
          }))
        };
        break;
    }

    console.log('更新分潤規則:', ruleData);
    await revenueApi.updateRule(editingRuleId.value, ruleData);
    showEditRuleModal.value = false;
    editingRuleId.value = null;
    await loadRevenueData();
    
    // 重置表單
    ruleFormValue.value = {
      role: '',
      ruleType: 'percentage',
      effectiveFrom: Date.now(),
      effectiveTo: undefined,
      isActive: true,
      description: '',
      rulePayload: {
        percentage: 0,
        amount: 0,
        tiers: [
          { threshold: 0, percentage: 0 }
        ]
      },
    };
  } catch (error) {
    console.error('更新分潤規則失敗:', error);
  }
}

function viewAdjustment(id: string) {
  // TODO: 實現查看分潤調整詳情
  console.log('查看分潤調整:', id);
}

async function reviewAdjustment(id: string) {
  const dialog = useDialog();
  const message = useMessage();
  
  try {
    // 獲取調整詳情
    const clinicId = 'clinic_001';
    const adjustment = await revenueAdjustmentApi.getAdjustmentById(id, clinicId);
    
    // 顯示審核對話框
    dialog.info({
      title: '分潤調整審核',
      content: `確定要審核此分潤調整嗎？\n\n` +
               `調整類型：${adjustment.adjustmentType === 'increase' ? '增加' : '減少'}\n` +
               `金額：$${adjustment.amount.toLocaleString()}\n` +
               `原因：${adjustment.reason}`,
      positiveText: '批准',
      negativeText: '拒絕',
      onPositiveClick: async () => {
        try {
          await revenueAdjustmentApi.reviewAdjustment(id, { status: 'approved' });
          message.success('調整已批准');
          await loadRevenueData();
        } catch (error) {
          console.error('批准調整失敗:', error);
          message.error('批准失敗');
        }
      },
      onNegativeClick: async () => {
        try {
          await revenueAdjustmentApi.reviewAdjustment(id, { status: 'rejected' });
          message.success('調整已拒絕');
          await loadRevenueData();
        } catch (error) {
          console.error('拒絕調整失敗:', error);
          message.error('拒絕失敗');
        }
      },
    });
  } catch (error) {
    console.error('審核分潤調整失敗:', error);
    message.error('加載調整詳情失敗');
  }
}

// 切換分頁時自動載入報表資料
function onTabChange(tabName: string) {
  if (tabName === 'reports' && !revenueStore.summary && !revenueStore.loading) {
    revenueStore.loadReportData();
  }
}
</script>

<style scoped>
.revenue-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  color: #333;
}

.calculator-section {
  padding: 8px;
}

.report-section {
  padding: 8px;
}

.total-summary {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
}
</style>