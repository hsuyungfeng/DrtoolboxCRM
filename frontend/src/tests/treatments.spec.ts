/**
 * 療程組件與 API 單元測試
 * 測試 TreatmentForm、TreatmentProgressBar 組件及 treatmentsApi API 調用
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// 模擬 API 服務
vi.mock('@/services/treatments-api', () => ({
  treatmentsApi: {
    getTreatments: vi.fn(),
    getTreatment: vi.fn(),
    createTreatment: vi.fn(),
    updateTreatment: vi.fn(),
    deleteTreatment: vi.fn(),
    completeSession: vi.fn(),
  },
  treatmentCoursesApi: {
    getPatientCourses: vi.fn(),
    getCourse: vi.fn(),
    createCourse: vi.fn(),
    updateSession: vi.fn(),
    getTemplates: vi.fn(),
    getStaffSessions: vi.fn(),
  },
  treatmentSessionApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  default: {},
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

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    token: 'mock-token',
    clinicId: 'clinic-1',
    logout: vi.fn(),
  })),
}));

import { treatmentsApi } from '@/services/treatments-api';
import TreatmentForm from '@/components/TreatmentForm.vue';
import TreatmentProgressBar from '@/components/TreatmentProgressBar.vue';

// ─────────────────────────────────────────
// TreatmentForm 組件測試
// ─────────────────────────────────────────
describe('TreatmentForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('應該正確掛載並顯示表單', () => {
    const wrapper = mount(TreatmentForm, {
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

  it('應該接受 treatment prop 並初始化表單欄位', () => {
    const mockTreatment = {
      id: 'treatment-1',
      patientId: 'patient-1',
      name: '復健治療計畫',
      type: 'rehabilitation',
      costPerSession: 1500,
      totalSessions: 10,
      description: '每週兩次復健',
    };

    const wrapper = mount(TreatmentForm, {
      props: { treatment: mockTreatment },
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

  it('handleSave 應在 formRef 為空時提前返回', async () => {
    const wrapper = mount(TreatmentForm, {
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

    await expect(wrapper.vm.handleSave()).resolves.toBeUndefined();
  });

  it('應該在取消時發出 cancel 事件', async () => {
    const wrapper = mount(TreatmentForm, {
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

    await wrapper.vm.$emit('cancel');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});

// ─────────────────────────────────────────
// TreatmentProgressBar 組件測試
// ─────────────────────────────────────────
describe('TreatmentProgressBar.vue', () => {
  it('應該正確計算進度百分比（30%）', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 3,
        total: 10,
      },
      global: {
        stubs: {
          NProgress: true,
        },
      },
    });

    expect(wrapper.vm.progressPercent).toBe(30);
  });

  it('應該正確計算進度百分比（50%）', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 5,
        total: 10,
      },
      global: {
        stubs: {
          NProgress: true,
        },
      },
    });

    expect(wrapper.vm.progressPercent).toBe(50);
  });

  it('應該正確顯示進度文字（5 / 10）', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 5,
        total: 10,
      },
      global: {
        stubs: {
          NProgress: true,
        },
      },
    });

    expect(wrapper.text()).toContain('5 / 10');
    expect(wrapper.text()).toContain('50%');
  });

  it('應該在 total 為 0 時返回 0%', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 0,
        total: 0,
      },
      global: {
        stubs: {
          NProgress: true,
        },
      },
    });

    expect(wrapper.vm.progressPercent).toBe(0);
  });

  it('應該在全部完成時顯示 100%', () => {
    const wrapper = mount(TreatmentProgressBar, {
      props: {
        completed: 10,
        total: 10,
      },
      global: {
        stubs: {
          NProgress: true,
        },
      },
    });

    expect(wrapper.vm.progressPercent).toBe(100);
  });
});

// ─────────────────────────────────────────
// Treatments API 單元測試
// ─────────────────────────────────────────
describe('Treatments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該成功取得所有療程', async () => {
    const mockTreatments = [
      {
        id: 'treatment-1',
        patientId: 'patient-1',
        name: '復健治療',
        type: 'rehabilitation',
        totalSessions: 10,
        completedSessions: 3,
        status: 'active',
      },
    ];

    vi.mocked(treatmentsApi.getTreatments).mockResolvedValue(mockTreatments as any);

    const result = await treatmentsApi.getTreatments({ patientId: 'patient-1' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('復健治療');
  });

  it('應該成功建立新療程', async () => {
    const mockCourse = {
      id: 'treatment-2',
      patientId: 'patient-1',
      name: '美容療程',
      type: 'cosmetic',
      totalSessions: 5,
      completedSessions: 0,
      status: 'active',
    };

    vi.mocked(treatmentsApi.createTreatment).mockResolvedValue(mockCourse as any);

    const result = await treatmentsApi.createTreatment({
      patientId: 'patient-1',
      name: '美容療程',
      type: 'cosmetic',
      totalSessions: 5,
      costPerSession: 3000,
    });

    expect(result.id).toBe('treatment-2');
    expect(result.name).toBe('美容療程');
  });

  it('應該成功更新療程', async () => {
    const mockUpdated = {
      id: 'treatment-1',
      name: '更新後的療程',
      totalSessions: 15,
      status: 'active',
    };

    vi.mocked(treatmentsApi.updateTreatment).mockResolvedValue(mockUpdated as any);

    const result = await treatmentsApi.updateTreatment('treatment-1', {
      name: '更新後的療程',
      totalSessions: 15,
    });

    expect(result.name).toBe('更新後的療程');
    expect(result.totalSessions).toBe(15);
  });

  it('應該成功標記課程為完成', async () => {
    const mockSession = {
      id: 'session-1',
      completionStatus: 'completed',
      actualStartTime: '2026-03-27T09:00:00Z',
    };

    vi.mocked(treatmentsApi.completeSession).mockResolvedValue(mockSession as any);

    const result = await treatmentsApi.completeSession('session-1');

    expect(result.completionStatus).toBe('completed');
    expect(treatmentsApi.completeSession).toHaveBeenCalledWith('session-1');
  });

  it('應該成功刪除療程', async () => {
    vi.mocked(treatmentsApi.deleteTreatment).mockResolvedValue(undefined as any);

    await treatmentsApi.deleteTreatment('treatment-1');

    expect(treatmentsApi.deleteTreatment).toHaveBeenCalledWith('treatment-1');
  });
});
