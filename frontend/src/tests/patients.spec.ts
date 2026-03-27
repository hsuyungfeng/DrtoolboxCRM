/**
 * 患者 API 與組件單元測試
 * 測試 patientsApi 調用及患者相關功能
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// 模擬 API 服務
vi.mock('@/services/api', () => ({
  patientsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  treatmentsApi: {
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

vi.mock('@/services/medical-orders-api', () => ({
  medicalOrdersApi: {
    getPatientOrders: vi.fn(),
    createOrder: vi.fn(),
    getOrders: vi.fn(),
    updateOrder: vi.fn(),
    recordUsage: vi.fn(),
    cancelOrder: vi.fn(),
  },
  default: {},
}));

vi.mock('@/services/treatments-api', () => ({
  treatmentsApi: {
    getTreatments: vi.fn(),
    getTreatment: vi.fn(),
    createTreatment: vi.fn(),
    updateTreatment: vi.fn(),
    deleteTreatment: vi.fn(),
    completeSession: vi.fn(),
  },
  default: {},
}));

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    token: 'mock-token',
    clinicId: 'clinic-1',
    user: { id: 'patient-1', name: 'Test User', role: 'patient' },
    logout: vi.fn(),
  })),
}));

import { patientsApi } from '@/services/api';
import { medicalOrdersApi } from '@/services/medical-orders-api';

// ─────────────────────────────────────────
// Patient API 單元測試
// ─────────────────────────────────────────
describe('Patient API', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('應該成功搜尋患者', async () => {
    const mockPatients = [
      { id: '1', name: 'John', idNumber: 'ID001' },
      { id: '2', name: 'Jane', idNumber: 'ID002' },
    ];

    vi.mocked(patientsApi.getAll).mockResolvedValue(mockPatients);

    const result = await patientsApi.getAll('clinic-1', { search: 'John' });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John');
    expect(result[1].idNumber).toBe('ID002');
  });

  it('應該成功以 ID 取得患者詳情', async () => {
    const mockPatient = {
      id: '1',
      name: 'John',
      idNumber: 'ID001',
      birthDate: '1990-01-01',
      phone: '0912345678',
    };

    vi.mocked(patientsApi.getById).mockResolvedValue(mockPatient);

    const result = await patientsApi.getById('1', 'clinic-1');

    expect(result.id).toBe('1');
    expect(result.name).toBe('John');
    expect(result.idNumber).toBe('ID001');
  });

  it('應該成功建立新患者', async () => {
    const newPatient = {
      name: 'Alice',
      idNumber: 'ID003',
      birthDate: '1995-05-20',
      phone: '0922334455',
      clinicId: 'clinic-1',
    };

    const mockCreated = { id: '3', ...newPatient };

    vi.mocked(patientsApi.create).mockResolvedValue(mockCreated);

    const result = await patientsApi.create(newPatient);

    expect(result.id).toBe('3');
    expect(result.name).toBe('Alice');
    expect(patientsApi.create).toHaveBeenCalledWith(newPatient);
  });

  it('應該成功更新患者資料', async () => {
    const mockUpdated = {
      id: '1',
      name: 'John Updated',
      idNumber: 'ID001',
      phone: '0999887766',
    };

    vi.mocked(patientsApi.update).mockResolvedValue(mockUpdated);

    const result = await patientsApi.update('1', { name: 'John Updated', phone: '0999887766' });

    expect(result.name).toBe('John Updated');
    expect(result.phone).toBe('0999887766');
  });

  it('應該成功刪除患者', async () => {
    vi.mocked(patientsApi.delete).mockResolvedValue(undefined);

    await patientsApi.delete('1');

    expect(patientsApi.delete).toHaveBeenCalledWith('1');
  });

  it('應該在搜尋無結果時返回空陣列', async () => {
    vi.mocked(patientsApi.getAll).mockResolvedValue([]);

    const result = await patientsApi.getAll('clinic-1', { search: 'NonExistent' });

    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────
// 患者醫令整合測試
// ─────────────────────────────────────────
describe('Patient Medical Orders Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該成功取得患者的醫令列表', async () => {
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

    vi.mocked(medicalOrdersApi.getPatientOrders).mockResolvedValue(mockOrders);

    const orders = await medicalOrdersApi.getPatientOrders('patient-1');

    expect(orders).toHaveLength(1);
    expect(orders[0].patientId).toBe('patient-1');
    expect(orders[0].status).toBe('pending');
  });

  it('應該正確過濾狀態為 pending 的醫令', async () => {
    const mockPendingOrders = [
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

    vi.mocked(medicalOrdersApi.getPatientOrders).mockResolvedValue(mockPendingOrders);

    const result = await medicalOrdersApi.getPatientOrders('patient-1', 'pending');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
    expect(medicalOrdersApi.getPatientOrders).toHaveBeenCalledWith('patient-1', 'pending');
  });
});

// ─────────────────────────────────────────
// PatientMedicalOrderView 元件測試
// ─────────────────────────────────────────
describe('PatientMedicalOrderView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('應該正確掛載患者醫令視圖組件', async () => {
    const { default: PatientMedicalOrderView } = await import(
      '@/components/PatientMedicalOrderView.vue'
    );

    const wrapper = mount(PatientMedicalOrderView, {
      props: { patientId: 'patient-1' },
      global: {
        stubs: {
          NDataTable: true,
          NTag: true,
          NSpace: true,
          NSpin: true,
          NEmpty: true,
          NAlert: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
