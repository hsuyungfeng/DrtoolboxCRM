import { ref, h, computed, onMounted } from 'vue';
import { NTag, NSpace, NButton, useDialog, useMessage } from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules, SelectOption } from 'naive-ui';
import type { RevenueRecord, RevenueRule, RevenueAdjustment } from '@/types';
import { revenueApi, revenueAdjustmentApi } from '@/services/api';
import { useRevenueStore } from '@/stores/revenue.store';
import { useUserStore } from '@/stores/user';

// Shared state outside the composable function to ensure all components share the same data
const loadingRecords = ref(false);
const loadingRules = ref(false);
const loadingAdjustments = ref(false);

const revenueRecords = ref<RevenueRecord[]>([]);
const revenueRules = ref<RevenueRule[]>([]);
const revenueAdjustments = ref<RevenueAdjustment[]>([]);

const showCreateRuleModal = ref(false);
const showEditRuleModal = ref(false);
const editingRuleId = ref<string | null>(null);

const reportDateRange = ref<[number, number] | null>(null);

const calculatorForm = ref({
  treatmentType: '',
  amount: 0,
});

const calculationResult = ref<any[]>([]);
const tieredPreview = ref<any[]>([]);

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

export function useRevenue() {
  const revenueStore = useRevenueStore();
  const userStore = useUserStore();
  const dialog = useDialog();
  const message = useMessage();

  const clinicId = computed(() => userStore.clinicId || 'clinic_001');

  const ruleFormRef = ref<FormInst | null>(null);

  // Constants & Options
  const treatmentTypeOptions: SelectOption[] = [
    { label: '一般療程', value: 'general' },
    { label: '美容護理', value: 'beauty' },
    { label: '醫療手術', value: 'medical' },
    { label: '復健治療', value: 'rehab' },
  ];

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
        validator: (_rule: any, value: number) => {
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
        validator: (_rule: any, value: number) => {
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

  // Computed
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

  // Methods
  async function loadRevenueData() {
    try {
      loadingRecords.value = true;
      loadingRules.value = true;
      loadingAdjustments.value = true;
      
      const [records, rules, adjustments] = await Promise.all([
        revenueApi.getRecords(clinicId.value),
        revenueApi.getRules(clinicId.value),
        revenueAdjustmentApi.getAdjustments(clinicId.value)
      ]);
      
      revenueRecords.value = records;
      revenueRules.value = rules;
      revenueAdjustments.value = adjustments;
    } catch (error) {
      console.error('加載分潤數據失敗:', error);
      message.error('加載分潤數據失敗');
    } finally {
      loadingRecords.value = false;
      loadingRules.value = false;
      loadingAdjustments.value = false;
    }
  }

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

  function viewRecord(id: string) {
    console.log('查看分潤記錄:', id);
    // TODO: 實現查看分潤記錄詳情
  }

  async function lockRecord(id: string) {
    try {
      await revenueApi.lockRecord(id);
      message.success('分潤記錄已鎖定');
      await loadRevenueData();
    } catch (error) {
      console.error('鎖定分潤記錄失敗:', error);
      message.error('鎖定失敗');
    }
  }

  function viewRule(id: string) {
    console.log('查看分潤規則:', id);
    // TODO: 實現查看分潤規則詳情
  }

  async function editRule(id: string) {
    try {
      const rule = await revenueApi.getRuleById(id, clinicId.value);
      
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
      message.error('加載分潤規則失敗');
    }
  }

  async function deleteRule(id: string) {
    dialog.warning({
      title: '確認刪除',
      content: '確定要刪除此分潤規則嗎？此操作無法復原。',
      positiveText: '確定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await revenueApi.deleteRule(id);
          message.success('分潤規則已刪除');
          await loadRevenueData();
        } catch (error) {
          console.error('刪除分潤規則失敗:', error);
          message.error('刪除失敗');
        }
      }
    });
  }

  async function handleCreateRule() {
    try {
      if (ruleFormRef.value) {
        await ruleFormRef.value.validate();
      }
      
      const ruleData: any = {
        role: ruleFormValue.value.role,
        ruleType: ruleFormValue.value.ruleType,
        effectiveFrom: new Date(ruleFormValue.value.effectiveFrom).toISOString().split('T')[0],
        isActive: ruleFormValue.value.isActive,
        description: ruleFormValue.value.description,
        clinicId: clinicId.value,
      };

      if (ruleFormValue.value.effectiveTo) {
        ruleData.effectiveTo = new Date(ruleFormValue.value.effectiveTo).toISOString().split('T')[0];
      }

      switch (ruleFormValue.value.ruleType) {
        case 'percentage':
          ruleData.rulePayload = { percentage: ruleFormValue.value.rulePayload.percentage };
          break;
        case 'fixed':
          ruleData.rulePayload = { amount: ruleFormValue.value.rulePayload.amount };
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

      await revenueApi.createRule(ruleData);
      message.success('分潤規則已創建');
      showCreateRuleModal.value = false;
      await loadRevenueData();
      resetRuleForm();
    } catch (error) {
      console.error('創建分潤規則失敗:', error);
      // message error handled by catch or validation
    }
  }

  async function handleUpdateRule() {
    try {
      if (ruleFormRef.value) {
        await ruleFormRef.value.validate();
      }
      
      if (!editingRuleId.value) return;
      
      const ruleData: any = {
        role: ruleFormValue.value.role,
        ruleType: ruleFormValue.value.ruleType,
        effectiveFrom: new Date(ruleFormValue.value.effectiveFrom).toISOString().split('T')[0],
        isActive: ruleFormValue.value.isActive,
        description: ruleFormValue.value.description,
        clinicId: clinicId.value,
      };

      if (ruleFormValue.value.effectiveTo) {
        ruleData.effectiveTo = new Date(ruleFormValue.value.effectiveTo).toISOString().split('T')[0];
      }

      switch (ruleFormValue.value.ruleType) {
        case 'percentage':
          ruleData.rulePayload = { percentage: ruleFormValue.value.rulePayload.percentage };
          break;
        case 'fixed':
          ruleData.rulePayload = { amount: ruleFormValue.value.rulePayload.amount };
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

      await revenueApi.updateRule(editingRuleId.value, ruleData);
      message.success('分潤規則已更新');
      showEditRuleModal.value = false;
      editingRuleId.value = null;
      await loadRevenueData();
      resetRuleForm();
    } catch (error) {
      console.error('更新分潤規則失敗:', error);
    }
  }

  function resetRuleForm() {
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
        tiers: [{ threshold: 0, percentage: 0 }]
      },
    };
  }

  function viewAdjustment(id: string) {
    console.log('查看分潤調整:', id);
    // TODO: 實現查看分潤調整詳情
  }

  async function reviewAdjustment(id: string) {
    try {
      const adjustment = await revenueAdjustmentApi.getAdjustmentById(id, clinicId.value);
      
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

  function handleDateRangeChange(value: [number, number] | null) {
    if (value) {
      const startDate = new Date(value[0]).toISOString().split('T')[0];
      const endDate = new Date(value[1]).toISOString().split('T')[0];
      revenueStore.loadReportData(startDate, endDate);
    } else {
      revenueStore.loadReportData();
    }
  }

  function refreshReportData() {
    if (reportDateRange.value) {
      const startDate = new Date(reportDateRange.value[0]).toISOString().split('T')[0];
      const endDate = new Date(reportDateRange.value[1]).toISOString().split('T')[0];
      revenueStore.loadReportData(startDate, endDate);
    } else {
      revenueStore.loadReportData();
    }
  }

  function onTabChange(tabName: string) {
    if (tabName === 'reports' && !revenueStore.summary && !revenueStore.loading) {
      revenueStore.loadReportData();
    }
  }

  onMounted(async () => {
    // Optionally load data on mount or let components decide
  });

  return {
    // State
    loadingRecords,
    loadingRules,
    loadingAdjustments,
    revenueRecords,
    revenueRules,
    revenueAdjustments,
    showCreateRuleModal,
    showEditRuleModal,
    editingRuleId,
    reportDateRange,
    calculatorForm,
    calculationResult,
    tieredPreview,
    ruleFormRef,
    ruleFormValue,
    
    // Computed
    clinicId,
    showPercentageField,
    showFixedField,
    showTieredFields,
    totalCalculatedAmount,
    totalPercentage,
    
    // Constants
    treatmentTypeOptions,
    roleOptions,
    ruleTypeOptions,
    staffRevenueColumns,
    recordColumns,
    ruleColumns,
    adjustmentColumns,
    previewColumns,
    tieredColumns,
    dateShortcuts,
    ruleRules,
    
    // Methods
    loadRevenueData,
    calculatePPF,
    addTier,
    removeTier,
    viewRecord,
    lockRecord,
    viewRule,
    editRule,
    deleteRule,
    handleCreateRule,
    handleUpdateRule,
    viewAdjustment,
    reviewAdjustment,
    handleDateRangeChange,
    refreshReportData,
    onTabChange
  };
}
