/**
 * MedicalOrderService 單元測試
 * 測試醫令服務的業務邏輯、狀態轉換、使用進度追蹤
 * Unit tests for MedicalOrderService business logic, state transitions, usage progress tracking
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalOrderService } from '../services/medical-order.service';
import { MedicalOrder } from '../entities/medical-order.entity';
import { ScriptTemplate } from '../entities/script-template.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { CreateMedicalOrderDto } from '../dto/create-medical-order.dto';
import { UpdateMedicalOrderDto } from '../dto/update-medical-order.dto';

describe('MedicalOrderService', () => {
  let service: MedicalOrderService;
  let mockMedicalOrderRepo: any;
  let mockScriptTemplateRepo: any;
  let mockPatientRepo: any;

  const mockClinicId = 'clinic-001';
  const mockDoctorId = 'doctor-001';
  const mockPatientId = 'patient-001';
  const mockOrderId = 'order-001';

  const mockPatient = {
    id: mockPatientId,
    clinicId: mockClinicId,
    name: '王小明',
    idNumber: 'A123456789',
  };

  const mockOrder = {
    id: mockOrderId,
    clinicId: mockClinicId,
    patientId: mockPatientId,
    prescribedBy: mockDoctorId,
    drugOrTreatmentName: '感冒藥',
    dosage: '500mg',
    usageMethod: '口服',
    totalSessions: 5,
    completedSessions: 0,
    status: 'pending' as const,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMedicalOrderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockScriptTemplateRepo = {
      findOne: jest.fn(),
    };

    mockPatientRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalOrderService,
        {
          provide: getRepositoryToken(MedicalOrder),
          useValue: mockMedicalOrderRepo,
        },
        {
          provide: getRepositoryToken(ScriptTemplate),
          useValue: mockScriptTemplateRepo,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepo,
        },
      ],
    }).compile();

    service = module.get<MedicalOrderService>(MedicalOrderService);
  });

  // ────────────────────────────────────────────────────────────────────
  // createMedicalOrder
  // ────────────────────────────────────────────────────────────────────
  describe('createMedicalOrder', () => {
    it('應該成功建立醫令', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: mockPatientId,
        drugOrTreatmentName: '感冒藥',
        dosage: '500mg',
        usageMethod: '口服',
        totalSessions: 5,
      };

      mockPatientRepo.findOne.mockResolvedValue(mockPatient);
      mockMedicalOrderRepo.create.mockReturnValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.createMedicalOrder(dto, mockDoctorId, mockClinicId);

      expect(result).toEqual(mockOrder);
      expect(mockPatientRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockPatientId, clinicId: mockClinicId },
      });
      expect(mockMedicalOrderRepo.create).toHaveBeenCalled();
      expect(mockMedicalOrderRepo.save).toHaveBeenCalled();
    });

    it('患者不存在時應拋出 NotFoundException', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: 'non-existent-patient',
        drugOrTreatmentName: '感冒藥',
        dosage: '500mg',
        usageMethod: '口服',
        totalSessions: 5,
      };

      mockPatientRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createMedicalOrder(dto, mockDoctorId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('療程數 <= 0 時應拋出 BadRequestException', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: mockPatientId,
        drugOrTreatmentName: '感冒藥',
        dosage: '500mg',
        usageMethod: '口服',
        totalSessions: 0,
      };

      mockPatientRepo.findOne.mockResolvedValue(mockPatient);

      await expect(
        service.createMedicalOrder(dto, mockDoctorId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('使用模板建立醫令時應複製模板預設值', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: mockPatientId,
        drugOrTreatmentName: '針灸',
        scriptTemplateId: 'template-001',
        dosage: '',
        usageMethod: '',
        totalSessions: 0,
      };

      const mockTemplate = {
        id: 'template-001',
        clinicId: mockClinicId,
        defaultDosage: '每次30分鐘',
        defaultUsageMethod: '針刺',
        defaultTotalSessions: 10,
      };

      mockPatientRepo.findOne.mockResolvedValue(mockPatient);
      mockScriptTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      const expectedOrder = { ...mockOrder, drugOrTreatmentName: '針灸', totalSessions: 10 };
      mockMedicalOrderRepo.create.mockReturnValue(expectedOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(expectedOrder);

      const result = await service.createMedicalOrder(dto, mockDoctorId, mockClinicId);

      expect(result.totalSessions).toBe(10);
      expect(mockScriptTemplateRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'template-001', clinicId: mockClinicId },
      });
    });

    it('模板不存在時應拋出 NotFoundException', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: mockPatientId,
        drugOrTreatmentName: '針灸',
        scriptTemplateId: 'invalid-template',
        dosage: '',
        usageMethod: '',
        totalSessions: 0,
      };

      mockPatientRepo.findOne.mockResolvedValue(mockPatient);
      mockScriptTemplateRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createMedicalOrder(dto, mockDoctorId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getMedicalOrder
  // ────────────────────────────────────────────────────────────────────
  describe('getMedicalOrder', () => {
    it('應該成功取得醫令', async () => {
      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.getMedicalOrder(mockOrderId, mockClinicId);

      expect(result).toEqual(mockOrder);
      expect(mockMedicalOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockOrderId, clinicId: mockClinicId },
        relations: ['patient', 'prescriber'],
      });
    });

    it('醫令不存在時應拋出 NotFoundException', async () => {
      mockMedicalOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getMedicalOrder('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // updateMedicalOrder
  // ────────────────────────────────────────────────────────────────────
  describe('updateMedicalOrder', () => {
    it('應該成功更新醫令狀態 pending -> in_progress 並記錄開始日期', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' as const, startedAt: null };
      const updatedOrder = { ...pendingOrder, status: 'in_progress' as const, startedAt: new Date() };

      mockMedicalOrderRepo.findOne.mockResolvedValue(pendingOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(updatedOrder);

      const dto: UpdateMedicalOrderDto = { status: 'in_progress' };
      const result = await service.updateMedicalOrder(mockOrderId, dto, mockClinicId);

      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeDefined();
    });

    it('應該成功更新醫令狀態 in_progress -> completed 並記錄完成日期', async () => {
      const inProgressOrder = {
        ...mockOrder,
        status: 'in_progress' as const,
        startedAt: new Date(),
        completedAt: null,
      };
      const completedOrder = {
        ...inProgressOrder,
        status: 'completed' as const,
        completedAt: new Date(),
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(inProgressOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(completedOrder);

      const dto: UpdateMedicalOrderDto = { status: 'completed' };
      const result = await service.updateMedicalOrder(mockOrderId, dto, mockClinicId);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('無效狀態轉換（completed -> pending）應拋出 BadRequestException', async () => {
      const completedOrder = { ...mockOrder, status: 'completed' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(completedOrder);

      const dto: UpdateMedicalOrderDto = { status: 'pending' };

      await expect(
        service.updateMedicalOrder(mockOrderId, dto, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('無效狀態轉換（cancelled -> in_progress）應拋出 BadRequestException', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(cancelledOrder);

      const dto: UpdateMedicalOrderDto = { status: 'in_progress' };

      await expect(
        service.updateMedicalOrder(mockOrderId, dto, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('已使用數超過總療程數時應拋出 BadRequestException', async () => {
      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);

      const dto: UpdateMedicalOrderDto = { completedSessions: 10 }; // mockOrder.totalSessions = 5

      await expect(
        service.updateMedicalOrder(mockOrderId, dto, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('應該更新藥物名稱和劑量', async () => {
      const updatedOrder = { ...mockOrder, drugOrTreatmentName: '新藥', dosage: '1000mg' };
      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(updatedOrder);

      const dto: UpdateMedicalOrderDto = { drugOrTreatmentName: '新藥', dosage: '1000mg' };
      const result = await service.updateMedicalOrder(mockOrderId, dto, mockClinicId);

      expect(result.drugOrTreatmentName).toBe('新藥');
      expect(result.dosage).toBe('1000mg');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getPatientMedicalOrders
  // ────────────────────────────────────────────────────────────────────
  describe('getPatientMedicalOrders', () => {
    it('應該取得患者所有醫令', async () => {
      const mockQueryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };

      mockMedicalOrderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPatientMedicalOrders(mockPatientId, mockClinicId);

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe(mockPatientId);
    });

    it('應該支援狀態過濾', async () => {
      const mockQueryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      };

      mockMedicalOrderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getPatientMedicalOrders(mockPatientId, mockClinicId, 'pending');

      // 狀態過濾時應額外呼叫 andWhere
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('無醫令時應回傳空陣列', async () => {
      const mockQueryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockMedicalOrderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPatientMedicalOrders(mockPatientId, mockClinicId);

      expect(result).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // cancelMedicalOrder
  // ────────────────────────────────────────────────────────────────────
  describe('cancelMedicalOrder', () => {
    it('應該成功取消 pending 醫令', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' as const };
      const cancelledOrder = { ...pendingOrder, status: 'cancelled' as const };

      mockMedicalOrderRepo.findOne.mockResolvedValue(pendingOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(cancelledOrder);

      const result = await service.cancelMedicalOrder(mockOrderId, mockClinicId);

      expect(result.status).toBe('cancelled');
    });

    it('應該成功取消 in_progress 醫令', async () => {
      const inProgressOrder = { ...mockOrder, status: 'in_progress' as const };
      const cancelledOrder = { ...inProgressOrder, status: 'cancelled' as const };

      mockMedicalOrderRepo.findOne.mockResolvedValue(inProgressOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(cancelledOrder);

      const result = await service.cancelMedicalOrder(mockOrderId, mockClinicId);

      expect(result.status).toBe('cancelled');
    });

    it('已完成的醫令不能取消，應拋出 BadRequestException', async () => {
      const completedOrder = { ...mockOrder, status: 'completed' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(completedOrder);

      await expect(
        service.cancelMedicalOrder(mockOrderId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('已取消的醫令不能再次取消，應拋出 BadRequestException', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(cancelledOrder);

      await expect(
        service.cancelMedicalOrder(mockOrderId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // recordMedicalOrderUsage
  // ────────────────────────────────────────────────────────────────────
  describe('recordMedicalOrderUsage', () => {
    it('應該記錄使用進度並自動從 pending 轉換到 in_progress', async () => {
      const pendingOrder = {
        ...mockOrder,
        status: 'pending' as const,
        completedSessions: 0,
        totalSessions: 5,
        startedAt: null,
      };
      const updatedOrder = {
        ...pendingOrder,
        status: 'in_progress' as const,
        completedSessions: 2,
        startedAt: new Date(),
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(pendingOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(updatedOrder);

      const result = await service.recordMedicalOrderUsage(mockOrderId, mockClinicId, 2);

      expect(result.completedSessions).toBe(2);
      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeDefined();
    });

    it('全部使用完畢時應自動轉換狀態為 completed', async () => {
      const inProgressOrder = {
        ...mockOrder,
        status: 'in_progress' as const,
        completedSessions: 4,
        totalSessions: 5,
        startedAt: new Date(),
        completedAt: null,
      };
      const completedOrder = {
        ...inProgressOrder,
        completedSessions: 5,
        status: 'completed' as const,
        completedAt: new Date(),
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(inProgressOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(completedOrder);

      const result = await service.recordMedicalOrderUsage(mockOrderId, mockClinicId, 1);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('使用次數超過剩餘療程數應拋出 BadRequestException', async () => {
      const inProgressOrder = {
        ...mockOrder,
        status: 'in_progress' as const,
        completedSessions: 3,
        totalSessions: 5,
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(inProgressOrder);

      await expect(
        service.recordMedicalOrderUsage(mockOrderId, mockClinicId, 3), // 剩餘 2，使用 3 超出
      ).rejects.toThrow(BadRequestException);
    });

    it('已取消的醫令不能記錄使用進度', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(cancelledOrder);

      await expect(
        service.recordMedicalOrderUsage(mockOrderId, mockClinicId, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('已完成的醫令不能記錄使用進度', async () => {
      const completedOrder = { ...mockOrder, status: 'completed' as const };
      mockMedicalOrderRepo.findOne.mockResolvedValue(completedOrder);

      await expect(
        service.recordMedicalOrderUsage(mockOrderId, mockClinicId, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getProgressPercent
  // ────────────────────────────────────────────────────────────────────
  describe('getProgressPercent', () => {
    it('應計算正確的進度百分比', () => {
      const order = { ...mockOrder, completedSessions: 2, totalSessions: 5 } as MedicalOrder;
      const percent = service.getProgressPercent(order);
      expect(percent).toBe(40);
    });

    it('0 / 5 時進度應為 0%', () => {
      const order = { ...mockOrder, completedSessions: 0, totalSessions: 5 } as MedicalOrder;
      expect(service.getProgressPercent(order)).toBe(0);
    });

    it('5 / 5 時進度應為 100%', () => {
      const order = { ...mockOrder, completedSessions: 5, totalSessions: 5 } as MedicalOrder;
      expect(service.getProgressPercent(order)).toBe(100);
    });

    it('totalSessions 為 0 時進度應為 0%（防止除以 0）', () => {
      const order = { ...mockOrder, completedSessions: 0, totalSessions: 0 } as MedicalOrder;
      expect(service.getProgressPercent(order)).toBe(0);
    });
  });
});
