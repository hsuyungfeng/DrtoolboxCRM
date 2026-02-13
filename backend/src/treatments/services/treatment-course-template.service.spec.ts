import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TreatmentCourseTemplateService } from "./treatment-course-template.service";
import { TreatmentCourseTemplate } from "../entities/treatment-course-template.entity";
import Decimal from "decimal.js";

describe("TreatmentCourseTemplateService", () => {
  let service: TreatmentCourseTemplateService;
  let repository: jest.Mocked<Repository<TreatmentCourseTemplate>>;

  const mockClinicId = "clinic-001";
  const mockTemplateId = "tmpl-001";

  const mockTemplate: TreatmentCourseTemplate = {
    id: mockTemplateId,
    name: "10次美容套餐",
    description: "完整美容療程套餐",
    totalSessions: 10,
    totalPrice: new Decimal("5000.00"),
    stageConfig: [
      { stageName: "第一階段", sessionStart: 1, sessionEnd: 3 },
      { stageName: "第二階段", sessionStart: 4, sessionEnd: 7 },
      { stageName: "第三階段", sessionStart: 8, sessionEnd: 10 },
    ],
    clinicId: mockClinicId,
    isActive: true,
    createdAt: new Date("2026-02-13T10:00:00"),
    updatedAt: new Date("2026-02-13T10:00:00"),
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

  it("應該被定義", () => {
    expect(service).toBeDefined();
  });

  describe("getActiveTemplates", () => {
    it("應該返回診所所有活躍模板", async () => {
      const templates = [mockTemplate];
      repository.find.mockResolvedValue(templates);

      const result = await service.getActiveTemplates(mockClinicId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("10次美容套餐");
      expect(result[0].isActive).toBe(true);
      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId, isActive: true },
        order: { createdAt: "DESC" },
      });
    });

    it("應該在沒有活躍模板時返回空陣列", async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getActiveTemplates(mockClinicId);

      expect(result).toEqual([]);
    });

    it("應該只返回指定診所的模板", async () => {
      const otherClinicId = "clinic-002";
      repository.find.mockResolvedValue([]);

      await service.getActiveTemplates(otherClinicId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: otherClinicId, isActive: true },
        order: { createdAt: "DESC" },
      });
    });
  });

  describe("getTemplateById", () => {
    it("應該按 ID 和 clinicId 返回模板", async () => {
      repository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById(
        mockTemplateId,
        mockClinicId,
      );

      expect(result).toEqual(mockTemplate);
      expect(result?.id).toBe(mockTemplateId);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplateId, clinicId: mockClinicId },
      });
    });

    it("應該在模板不存在時返回 null", async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateById("nonexistent", mockClinicId);

      expect(result).toBeNull();
    });

    it("應該驗證多租戶隔離 - 不同診所無法查詢他人模板", async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateById(
        mockTemplateId,
        "other-clinic",
      );

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplateId, clinicId: "other-clinic" },
      });
    });
  });

  describe("createTemplate", () => {
    it("應該創建並返回新模板", async () => {
      const createData: Partial<TreatmentCourseTemplate> = {
        name: "10次美容套餐",
        description: "完整美容療程套餐",
        totalSessions: 10,
        totalPrice: new Decimal("5000.00"),
        stageConfig: mockTemplate.stageConfig,
        clinicId: mockClinicId,
      };

      repository.save.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(createData);

      expect(result.id).toBe(mockTemplateId);
      expect(result.name).toBe("10次美容套餐");
      expect(repository.save).toHaveBeenCalledWith(createData);
    });

    it("應該正確處理 Decimal 類型的 totalPrice", async () => {
      const createData: Partial<TreatmentCourseTemplate> = {
        name: "測試套餐",
        totalPrice: new Decimal("1000.50"),
        clinicId: mockClinicId,
        totalSessions: 5,
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 5 }],
      };

      repository.save.mockResolvedValue({
        ...mockTemplate,
        ...createData,
      });

      const result = await service.createTemplate(createData);

      expect(result.totalPrice).toEqual(new Decimal("1000.50"));
    });
  });

  describe("createTemplate - 異常情況", () => {
    it("應該在缺少 clinicId 時拋出異常", async () => {
      const data = {
        name: "模板",
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 clinicId 為空字符串時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: "",
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在缺少名稱時拋出異常", async () => {
      const data = {
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在名稱為空字符串時拋出異常", async () => {
      const data = {
        name: "",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 totalSessions 為 0 或負數時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 0,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 totalPrice 為 0 時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("0"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 totalPrice 為負數時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("-100"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在缺少 stageConfig 時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
      };

      await expect(service.createTemplate(data as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 stageConfig 為空陣列時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [],
      };

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在數據庫錯誤時拋出異常", async () => {
      const data = {
        name: "模板",
        clinicId: mockClinicId,
        totalSessions: 10,
        totalPrice: new Decimal("5000"),
        stageConfig: [{ stageName: "階段1", sessionStart: 1, sessionEnd: 10 }],
      };

      repository.save.mockRejectedValue(new Error("數據庫連接失敗"));

      await expect(service.createTemplate(data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("updateTemplate", () => {
    it("應該更新並返回模板", async () => {
      const updateData: Partial<TreatmentCourseTemplate> = {
        name: "更新的套餐名稱",
        description: "更新的描述",
      };

      const updatedTemplate = { ...mockTemplate, ...updateData };
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValueOnce(updatedTemplate);

      const result = await service.updateTemplate(
        mockTemplateId,
        mockClinicId,
        updateData,
      );

      expect(result.name).toBe("更新的套餐名稱");
      expect(repository.update).toHaveBeenCalledWith(
        { id: mockTemplateId, clinicId: mockClinicId },
        updateData,
      );
    });

    it("應該驗證多租戶隔離 - 只能更新自己診所的模板", async () => {
      const updateData = { name: "新名稱" };
      repository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateTemplate("tmpl-001", "other-clinic", updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateTemplate - 異常情況", () => {
    it("應該在 templateId 為空時拋出異常", async () => {
      const updateData = { name: "新名稱" };

      await expect(
        service.updateTemplate("", mockClinicId, updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該在 clinicId 為空時拋出異常", async () => {
      const updateData = { name: "新名稱" };

      await expect(
        service.updateTemplate(mockTemplateId, "", updateData),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該在模板不存在時拋出異常", async () => {
      const updateData = { name: "新名稱" };
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTemplate("non-existent", mockClinicId, updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在更新失敗時拋出異常", async () => {
      const updateData = { name: "新名稱" };
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.updateTemplate(mockTemplateId, mockClinicId, updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在更新後無法檢索模板時拋出異常", async () => {
      const updateData = { name: "新名稱" };
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateTemplate(mockTemplateId, mockClinicId, updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在數據庫錯誤時拋出異常", async () => {
      const updateData = { name: "新名稱" };
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockRejectedValue(new Error("數據庫連接失敗"));

      await expect(
        service.updateTemplate(mockTemplateId, mockClinicId, updateData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteTemplate", () => {
    it("應該軟刪除模板（將 isActive 設為 false）", async () => {
      repository.findOne.mockResolvedValue(mockTemplate);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.deleteTemplate(mockTemplateId, mockClinicId);

      expect(repository.update).toHaveBeenCalledWith(
        { id: mockTemplateId, clinicId: mockClinicId },
        { isActive: false },
      );
    });

    it("應該驗證多租戶隔離 - 只能刪除自己診所的模板", async () => {
      repository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.deleteTemplate(mockTemplateId, "other-clinic"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteTemplate - 異常情況", () => {
    it("應該在 templateId 為空時拋出異常", async () => {
      await expect(service.deleteTemplate("", mockClinicId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在 clinicId 為空時拋出異常", async () => {
      await expect(service.deleteTemplate(mockTemplateId, "")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在模板不存在時拋出異常", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteTemplate("non-existent", mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在刪除失敗時拋出異常", async () => {
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.deleteTemplate(mockTemplateId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在數據庫錯誤時拋出異常", async () => {
      repository.findOne.mockResolvedValueOnce(mockTemplate);
      repository.update.mockRejectedValue(new Error("數據庫連接失敗"));

      await expect(
        service.deleteTemplate(mockTemplateId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("多租戶隔離驗證", () => {
    it("應該確保同一模板 ID 在不同診所之間不會衝突", async () => {
      const clinic1Template = { ...mockTemplate, clinicId: "clinic-001" };
      const clinic2Template = { ...mockTemplate, clinicId: "clinic-002" };

      repository.findOne
        .mockResolvedValueOnce(clinic1Template)
        .mockResolvedValueOnce(clinic2Template);

      const result1 = await service.getTemplateById(
        mockTemplateId,
        "clinic-001",
      );
      const result2 = await service.getTemplateById(
        mockTemplateId,
        "clinic-002",
      );

      expect(result1?.clinicId).toBe("clinic-001");
      expect(result2?.clinicId).toBe("clinic-002");
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
