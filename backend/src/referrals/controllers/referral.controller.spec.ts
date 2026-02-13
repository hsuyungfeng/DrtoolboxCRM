import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ReferralController } from "./referral.controller";
import { ReferralService } from "../services/referral.service";
import { CreateReferralDto } from "../dto/create-referral.dto";
import { ConvertReferralDto } from "../dto/convert-referral.dto";

describe("ReferralController", () => {
  let controller: ReferralController;
  let service: ReferralService;

  const mockClinicId = "clinic-001";
  const mockStaffId = "staff-123";
  const mockPatientId = "patient-456";
  const mockTreatmentId = "treatment-789";

  const mockReferral = {
    id: "ref-001",
    referrerId: mockStaffId,
    referrerType: "staff",
    patientId: mockPatientId,
    referralDate: new Date(),
    status: "pending",
    firstTreatmentId: null,
    firstTreatmentDate: null,
    pointsAwarded: 0,
    clinicId: mockClinicId,
    notes: "推薦備註",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReq = {
    user: {
      userId: "user-001",
      clinicId: mockClinicId,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralController],
      providers: [
        {
          provide: ReferralService,
          useValue: {
            createReferral: jest.fn(),
            getReferralsByReferrer: jest.fn(),
            getReferralByPatient: jest.fn(),
            convertReferral: jest.fn(),
            getReferralStats: jest.fn(),
            deleteReferral: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReferralController>(ReferralController);
    service = module.get<ReferralService>(ReferralService);
  });

  describe("create", () => {
    it("應該成功創建推薦記錄", async () => {
      // Arrange
      const createDto: CreateReferralDto = {
        referrerId: mockStaffId,
        referrerType: "staff",
        patientId: mockPatientId,
        clinicId: mockClinicId,
        notes: "推薦備註",
      };

      jest
        .spyOn(service, "createReferral")
        .mockResolvedValue(mockReferral as any);

      // Act
      const result = await controller.create(createDto, mockReq);

      // Assert
      expect(result).toEqual(mockReferral);
      expect(service.createReferral).toHaveBeenCalledWith(createDto);
    });

    it("應驗證診所 ID 一致性", async () => {
      // Arrange
      const createDto: CreateReferralDto = {
        referrerId: mockStaffId,
        referrerType: "staff",
        patientId: mockPatientId,
        clinicId: mockClinicId,
        notes: "推薦備註",
      };

      jest
        .spyOn(service, "createReferral")
        .mockResolvedValue(mockReferral as any);

      // Act
      await controller.create(createDto, mockReq);

      // Assert - validateClinicId 被調用
      expect(service.createReferral).toHaveBeenCalledWith(createDto);
    });
  });

  describe("getReferralsByReferrer", () => {
    it("應該返回推薦人的所有推薦記錄", async () => {
      // Arrange
      const referrals = [mockReferral, { ...mockReferral, id: "ref-002" }];
      jest
        .spyOn(service, "getReferralsByReferrer")
        .mockResolvedValue(referrals as any);

      // Act
      const result = await controller.getReferralsByReferrer(
        mockStaffId,
        "staff",
        mockReq,
      );

      // Assert
      expect(result).toEqual(referrals);
      expect(service.getReferralsByReferrer).toHaveBeenCalledWith(
        mockStaffId,
        "staff",
        mockClinicId,
      );
    });
  });

  describe("getReferralByPatient", () => {
    it("應該返回患者的推薦記錄", async () => {
      // Arrange
      jest
        .spyOn(service, "getReferralByPatient")
        .mockResolvedValue(mockReferral as any);

      // Act
      const result = await controller.getReferralByPatient(
        mockPatientId,
        mockReq,
      );

      // Assert
      expect(result).toEqual(mockReferral);
      expect(service.getReferralByPatient).toHaveBeenCalledWith(
        mockPatientId,
        mockClinicId,
      );
    });

    it("患者沒有推薦時應該返回 null", async () => {
      // Arrange
      jest.spyOn(service, "getReferralByPatient").mockResolvedValue(null);

      // Act
      const result = await controller.getReferralByPatient(
        mockPatientId,
        mockReq,
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("convert", () => {
    it("應該成功轉化推薦", async () => {
      // Arrange
      const convertDto: ConvertReferralDto = {
        treatmentId: mockTreatmentId,
        clinicId: mockClinicId,
      };

      const convertedReferral = { ...mockReferral, status: "converted" };
      jest
        .spyOn(service, "convertReferral")
        .mockResolvedValue(convertedReferral as any);

      // Act
      const result = await controller.convert(
        mockReferral.id,
        convertDto,
        mockReq,
      );

      // Assert
      expect(result).toEqual(convertedReferral);
      expect(service.convertReferral).toHaveBeenCalledWith(
        mockReferral.id,
        mockTreatmentId,
        mockClinicId,
      );
    });

    it("應驗證診所 ID 一致性", async () => {
      // Arrange
      const convertDto: ConvertReferralDto = {
        treatmentId: mockTreatmentId,
        clinicId: mockClinicId,
      };

      const convertedReferral = { ...mockReferral, status: "converted" };
      jest
        .spyOn(service, "convertReferral")
        .mockResolvedValue(convertedReferral as any);

      // Act
      await controller.convert(mockReferral.id, convertDto, mockReq);

      // Assert - validateClinicId 被調用
      expect(service.convertReferral).toHaveBeenCalledWith(
        mockReferral.id,
        mockTreatmentId,
        mockClinicId,
      );
    });
  });

  describe("delete", () => {
    it("應該成功取消推薦", async () => {
      // Arrange
      const cancelledReferral = { ...mockReferral, status: "cancelled" };
      jest
        .spyOn(service, "deleteReferral")
        .mockResolvedValue(cancelledReferral as any);

      // Act
      const result = await controller.delete(mockReferral.id, mockReq);

      // Assert
      expect(result).toEqual(cancelledReferral);
      expect(service.deleteReferral).toHaveBeenCalledWith(
        mockReferral.id,
        mockClinicId,
      );
    });
  });

  describe("getStats", () => {
    it("應該返回推薦統計數據", async () => {
      // Arrange
      const mockStats = {
        totalReferrals: 10,
        convertedCount: 5,
        pendingCount: 3,
        cancelledCount: 2,
        conversionRate: 50,
        totalPointsAwarded: 500,
      };

      jest.spyOn(service, "getReferralStats").mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStats(mockReq);

      // Assert
      expect(result).toEqual(mockStats);
      expect(service.getReferralStats).toHaveBeenCalledWith(mockClinicId);
    });
  });
});
