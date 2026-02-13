import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentCourseTemplateService } from './treatment-course-template.service';
import { TreatmentCourseTemplate } from '../entities/treatment-course-template.entity';
import Decimal from 'decimal.js';

describe('TreatmentCourseTemplateService', () => {
  let service: TreatmentCourseTemplateService;
  let repository: jest.Mocked<Repository<TreatmentCourseTemplate>>;

  const mockClinicId = 'clinic-001';
  const mockTemplateId = 'tmpl-001';

  const mockTemplate: TreatmentCourseTemplate = {
    id: mockTemplateId,
    name: '10次美容套餐',
    description: '完整美容療程套餐',
    totalSessions: 10,
    totalPrice: new Decimal('5000.00'),
    stageConfig: [
      { stageName: '第一階段', sessionStart: 1, sessionEnd: 3 },
      { stageName: '第二階段', sessionStart: 4, sessionEnd: 7 },
      { stageName: '第三階段', sessionStart: 8, sessionEnd: 10 },
    ],
    clinicId: mockClinicId,
    isActive: true,
    createdAt: new Date('2026-02-13T10:00:00'),
    updatedAt: new Date('2026-02-13T10:00:00'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentCourseTemplateService,
        {
          provide: getRepositoryToken(TreatmentCourseTemplate),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TreatmentCourseTemplateService>(
      TreatmentCourseTemplateService,
    );
    repository = module.get<jest.Mocked<Repository<TreatmentCourseTemplate>>>(
      getRepositoryToken(TreatmentCourseTemplate),
    );
  });

  it('應該被定義', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveTemplates', () => {
    it('應該返回診所所有活躍模板', async () => {
      const templates = [mockTemplate];
      repository.find.mockResolvedValue(templates);

      const result = await service.getActiveTemplates(mockClinicId);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('10次美容套餐');
      expect(result[0]!.isActive).toBe(true);
      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId, isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('應該在沒有活躍模板時返回空陣列', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getActiveTemplates(mockClinicId);

      expect(result).toEqual([]);
    });

    it('應該只返回指定診所的模板', async () => {
      const otherClinicId = 'clinic-002';
      repository.find.mockResolvedValue([]);

      await service.getActiveTemplates(otherClinicId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: otherClinicId, isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTemplateById', () => {
    it('應該按 ID 和 clinicId 返回模板', async () => {
      repository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById(mockTemplateId, mockClinicId);

      expect(result).toEqual(mockTemplate);
      expect(result?.id).toBe(mockTemplateId);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplateId, clinicId: mockClinicId },
      });
    });

    it('應該在模板不存在時返回 null', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateById('nonexistent', mockClinicId);

      expect(result).toBeNull();
    });

    it('應該驗證多租戶隔離 - 不同診所無法查詢他人模板', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateById(
        mockTemplateId,
        'other-clinic',
      );

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplateId, clinicId: 'other-clinic' },
      });
    });
  });

  describe('createTemplate', () => {
    it('應該創建並返回新模板', async () => {
      const createData: Partial<TreatmentCourseTemplate> = {
        name: '10次美容套餐',
        description: '完整美容療程套餐',
        totalSessions: 10,
        totalPrice: new Decimal('5000.00'),
        stageConfig: mockTemplate.stageConfig,
        clinicId: mockClinicId,
      };

      repository.save.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(createData);

      expect(result.id).toBe(mockTemplateId);
      expect(result.name).toBe('10次美容套餐');
      expect(repository.save).toHaveBeenCalledWith(createData);
    });

    it('應該正確處理 Decimal 類型的 totalPrice', async () => {
      const createData: Partial<TreatmentCourseTemplate> = {
        name: '測試套餐',
        totalPrice: new Decimal('1000.50'),
        clinicId: mockClinicId,
        totalSessions: 5,
        stageConfig: [],
      };

      repository.save.mockResolvedValue({
        ...mockTemplate,
        ...createData,
      });

      const result = await service.createTemplate(createData);

      expect(result.totalPrice).toEqual(new Decimal('1000.50'));
    });
  });

  describe('updateTemplate', () => {
    it('應該更新並返回模板', async () => {
      const updateData: Partial<TreatmentCourseTemplate> = {
        name: '更新的套餐名稱',
        description: '更新的描述',
      };

      const updatedTemplate = { ...mockTemplate, ...updateData };
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedTemplate);

      const result = await service.updateTemplate(
        mockTemplateId,
        mockClinicId,
        updateData,
      );

      expect(result?.name).toBe('更新的套餐名稱');
      expect(repository.update).toHaveBeenCalledWith(
        { id: mockTemplateId, clinicId: mockClinicId },
        updateData,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplateId, clinicId: mockClinicId },
      });
    });

    it('應該驗證多租戶隔離 - 只能更新自己診所的模板', async () => {
      const updateData = { name: '新名稱' };
      repository.update.mockResolvedValue({ affected: 0 } as any);

      await service.updateTemplate('tmpl-001', 'other-clinic', updateData);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 'tmpl-001', clinicId: 'other-clinic' },
        updateData,
      );
    });
  });

  describe('deleteTemplate', () => {
    it('應該軟刪除模板（將 isActive 設為 false）', async () => {
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.deleteTemplate(mockTemplateId, mockClinicId);

      expect(repository.update).toHaveBeenCalledWith(
        { id: mockTemplateId, clinicId: mockClinicId },
        { isActive: false },
      );
    });

    it('應該驗證多租戶隔離 - 只能刪除自己診所的模板', async () => {
      repository.update.mockResolvedValue({ affected: 0 } as any);

      await service.deleteTemplate(mockTemplateId, 'other-clinic');

      expect(repository.update).toHaveBeenCalledWith(
        { id: mockTemplateId, clinicId: 'other-clinic' },
        { isActive: false },
      );
    });
  });

  describe('多租戶隔離驗證', () => {
    it('應該確保同一模板 ID 在不同診所之間不會衝突', async () => {
      const clinic1Template = { ...mockTemplate, clinicId: 'clinic-001' };
      const clinic2Template = { ...mockTemplate, clinicId: 'clinic-002' };

      repository.findOne
        .mockResolvedValueOnce(clinic1Template)
        .mockResolvedValueOnce(clinic2Template);

      const result1 = await service.getTemplateById(mockTemplateId, 'clinic-001');
      const result2 = await service.getTemplateById(mockTemplateId, 'clinic-002');

      expect(result1?.clinicId).toBe('clinic-001');
      expect(result2?.clinicId).toBe('clinic-002');
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
