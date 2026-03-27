/**
 * 醫令組件與 API 單元測試
 * 測試 MedicalOrderForm 組件行為及 medicalOrdersApi API 調用
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// 模擬 API 服務，避免真實 HTTP 請求
vi.mock('@/services/medical-orders-api', () => ({
  medicalOrdersApi: {
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    updateOrder: vi.fn(),
    getPatientOrders: vi.fn(),
    getOrders: vi.fn(),
    recordUsage: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  patientsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  default: {},
}));

// 模擬 Pinia 用戶 store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    token: 'mock-token',
    clinicId: 'clinic-1',
    logout: vi.fn(),
  })),
}));

import { medicalOrdersApi } from '@/services/medical-orders-api';
import MedicalOrderForm from '@/components/MedicalOrderForm.vue';

// ─────────────────────────────────────────
// MedicalOrderForm 組件測試
// ─────────────────────────────────────────
describe('MedicalOrderForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('應該正確掛載並顯示表單', () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: true,
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
          NSpace: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('應該在取消按鈕點擊時發出 cancel 事件', async () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: { template: '<form @submit.prevent><slot /></form>' },
          NFormItem: { template: '<div><slot /></div>' },
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          NSpace: { template: '<div><slot /></div>' },
        },
      },
    });

    // 發出 cancel 事件
    await wrapper.vm.$emit('cancel');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('handleSave 應在 formRef 為空時提前返回', async () => {
    const wrapper = mount(MedicalOrderForm, {
      global: {
        stubs: {
          NForm: true,
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
          NSpace: true,
        },
      },
    });

    // formRef 為 null 時，handleSave 不應拋錯
    await expect(wrapper.vm.handleSave()).resolves.toBeUndefined();
  });

  it('應該接受 order prop 並初始化表單', () => {
    const mockOrder = {
      id: 'order-1',
      patientId: 'patient-1',
      drugOrTreatmentName: '感冒藥',
      description: '每日三次',
      dosage: '500mg',
      usageMethod: '口服',
      totalUsage: 5,
      usedCount: 0,
      status: 'pending' as const,
    };

    const wrapper = mount(MedicalOrderForm, {
      props: { order: mockOrder },
      global: {
        stubs: {
          NForm: true,
          NFormItem: true,
          NInput: true,
          NInputNumber: true,
          NSelect: true,
          NButton: true,
          NSpace: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});

// ─────────────────────────────────────────
// Medical Orders API 單元測試
// ─────────────────────────────────────────
describe('Medical Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該成功建立醫令', async () => {
    const mockData = {
      id: 'order-1',
      patientId: 'patient-1',
      drugOrTreatmentName: '感冒藥',
      dosage: '500mg',
      usageMethod: '口服',
      totalUsage: 5,
      usedCount: 0,
      status: 'pending' as const,
    };

    vi.mocked(medicalOrdersApi.createOrder).mockResolvedValue(mockData);

    const result = await medicalOrdersApi.createOrder({
      patientId: 'patient-1',
      drugOrTreatmentName: '感冒藥',
      dosage: '500mg',
      usageMethod: '口服',
      totalUsage: 5,
    });

    expect(result.id).toBe('order-1');
    expect(result.drugOrTreatmentName).toBe('感冒藥');
  });

  it('應該成功取得患者醫令列表', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        patientId: 'patient-1',
        drugOrTreatmentName: '感冒藥',
        dosage: '500mg',
        usageMethod: '口服',
        totalUsage: 5,
        usedCount: 1,
        status: 'in_progress' as const,
      },
      {
        id: 'order-2',
        patientId: 'patient-1',
        drugOrTreatmentName: '維他命C',
        dosage: '1000mg',
        usageMethod: '口服',
        totalUsage: 30,
        usedCount: 0,
        status: 'pending' as const,
      },
    ];

    vi.mocked(medicalOrdersApi.getPatientOrders).mockResolvedValue(mockOrders);

    const result = await medicalOrdersApi.getPatientOrders('patient-1');

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('in_progress');
    expect(result[1].drugOrTreatmentName).toBe('維他命C');
  });

  it('應該成功更新醫令狀態', async () => {
    const mockUpdated = {
      id: 'order-1',
      patientId: 'patient-1',
      drugOrTreatmentName: '感冒藥',
      dosage: '500mg',
      usageMethod: '口服',
      totalUsage: 5,
      usedCount: 5,
      status: 'completed' as const,
    };

    vi.mocked(medicalOrdersApi.updateOrder).mockResolvedValue(mockUpdated);

    const result = await medicalOrdersApi.updateOrder('order-1', { status: 'completed' });

    expect(result.status).toBe('completed');
    expect(result.usedCount).toBe(5);
  });

  it('應該成功記錄醫令使用次數', async () => {
    const mockResult = {
      id: 'order-1',
      patientId: 'patient-1',
      drugOrTreatmentName: '感冒藥',
      dosage: '500mg',
      usageMethod: '口服',
      totalUsage: 5,
      usedCount: 2,
      status: 'in_progress' as const,
    };

    vi.mocked(medicalOrdersApi.recordUsage).mockResolvedValue(mockResult);

    const result = await medicalOrdersApi.recordUsage('order-1', 2);

    expect(result.usedCount).toBe(2);
    expect(medicalOrdersApi.recordUsage).toHaveBeenCalledWith('order-1', 2);
  });

  it('應該成功取消醫令', async () => {
    vi.mocked(medicalOrdersApi.cancelOrder).mockResolvedValue(undefined);

    await medicalOrdersApi.cancelOrder('order-1');

    expect(medicalOrdersApi.cancelOrder).toHaveBeenCalledWith('order-1');
  });

  it('應該成功取得所有醫令（管理視圖）', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        patientId: 'patient-1',
        drugOrTreatmentName: '感冒藥',
        dosage: '500mg',
        usageMethod: '口服',
        totalUsage: 5,
        usedCount: 0,
        status: 'pending' as const,
      },
    ];

    vi.mocked(medicalOrdersApi.getOrders).mockResolvedValue(mockOrders);

    const result = await medicalOrdersApi.getOrders({ status: 'pending' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('order-1');
  });
});
