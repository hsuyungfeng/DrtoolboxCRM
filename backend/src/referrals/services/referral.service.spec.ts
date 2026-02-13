import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { ReferralService } from "./referral.service";
import { Referral } from "../entities/referral.entity";
import { Patient } from "../../patients/entities/patient.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { PointsService } from "../../points/services/points.service";
import { PointsConfigService } from "../../points/services/points-config.service";
import { CreateReferralDto } from "../dto/create-referral.dto";

describe("ReferralService", () => {
  let service: ReferralService;
  let referralRepository: Repository<Referral>;
  let patientRepository: Repository<Patient>;
  let staffRepository: Repository<Staff>;
  let treatmentRepository: Repository<Treatment>;
  let pointsService: PointsService;
  let pointsConfigService: PointsConfigService;

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

  const mockPatient = {
    id: mockPatientId,
    name: "患者名稱",
    clinicId: mockClinicId,
    referredBy: null,
    referrerType: null,
    pointsBalance: 0,
  };

  const mockStaff = {
    id: mockStaffId,
    name: "Staff Name",
    canBeReferrer: true,
    pointsBalance: 0,
    clinicId: mockClinicId,
    status: "active",
  };

  const mockTreatment = {
    id: mockTreatmentId,
    patientId: mockPatientId,
    name: "Treatment Name",
    totalPrice: 1000,
    totalSessions: 10,
    completedSessions: 0,
    status: "pending",
    startDate: new Date(),
    expectedEndDate: new Date(),
    actualEndDate: null,
    clinicId: mockClinicId,
    pointsRedeemed: 0,
    finalPrice: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(Referral),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Treatment),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: PointsService,
          useValue: {
            awardPoints: jest.fn(),
          },
        },
        {
          provide: PointsConfigService,
          useValue: {
            getConfigByKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    referralRepository = module.get(getRepositoryToken(Referral));
    patientRepository = module.get(getRepositoryToken(Patient));
    staffRepository = module.get(getRepositoryToken(Staff));
    treatmentRepository = module.get(getRepositoryToken(Treatment));
    pointsService = module.get<PointsService>(PointsService);
    pointsConfigService = module.get<PointsConfigService>(PointsConfigService);
  });

  describe("createReferral", () => {
    it("應該成功創建推薦記錄", async () => {
      // Arrange
      const createReferralDto: CreateReferralDto = {
        referrerId: mockStaffId,
        referrerType: "staff",
        patientId: mockPatientId,
        clinicId: mockClinicId,
        notes: "推薦備註",
      };

      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);
      jest
        .spyOn(referralRepository, "create")
        .mockReturnValue(mockReferral as any);
      jest
        .spyOn(referralRepository, "save")
        .mockResolvedValue(mockReferral as any);

      // Act
      const result = await service.createReferral(createReferralDto);

      // Assert
      expect(result).toEqual(mockReferral);
      expect(referralRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerId: mockStaffId,
          referrerType: "staff",
          patientId: mockPatientId,
          clinicId: mockClinicId,
          status: "pending",
        }),
      );
      expect(referralRepository.save).toHaveBeenCalledWith(mockReferral);
    });

    it("應該防止對同一患者創建多個未決推薦", async () => {
      // Arrange
      const createReferralDto: CreateReferralDto = {
        referrerId: mockStaffId,
        referrerType: "staff",
        patientId: mockPatientId,
        clinicId: mockClinicId,
      };

      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(mockReferral as any);

      // Act & Assert
      await expect(service.createReferral(createReferralDto)).rejects.toThrow(
        ConflictException,
      );
      expect(referralRepository.findOne).toHaveBeenCalledWith({
        where: {
          patientId: mockPatientId,
          clinicId: mockClinicId,
          status: "pending",
        },
      });
    });

    it("應該設置推薦日期為當前時間", async () => {
      // Arrange
      const createReferralDto: CreateReferralDto = {
        referrerId: mockStaffId,
        referrerType: "staff",
        patientId: mockPatientId,
        clinicId: mockClinicId,
      };

      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);
      const createSpy = jest
        .spyOn(referralRepository, "create")
        .mockReturnValue(mockReferral as any);
      jest
        .spyOn(referralRepository, "save")
        .mockResolvedValue(mockReferral as any);

      // Act
      await service.createReferral(createReferralDto);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          referralDate: expect.any(Date),
        }),
      );
    });
  });

  describe("getReferralsByReferrer", () => {
    it("應該返回推薦人的所有推薦記錄", async () => {
      // Arrange
      const referrals = [mockReferral, { ...mockReferral, id: "ref-002" }];
      jest
        .spyOn(referralRepository, "find")
        .mockResolvedValue(referrals as any);

      // Act
      const result = await service.getReferralsByReferrer(
        mockStaffId,
        "staff",
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(referrals);
      expect(referralRepository.find).toHaveBeenCalledWith({
        where: {
          referrerId: mockStaffId,
          referrerType: "staff",
          clinicId: mockClinicId,
        },
        order: { createdAt: "DESC" },
      });
    });

    it("應該支持 patient 類型的推薦人", async () => {
      // Arrange
      jest.spyOn(referralRepository, "find").mockResolvedValue([]);

      // Act
      await service.getReferralsByReferrer(
        mockPatientId,
        "patient",
        mockClinicId,
      );

      // Assert
      expect(referralRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            referrerType: "patient",
          }),
        }),
      );
    });

    it("應該強制進行多租戶隔離", async () => {
      // Arrange
      jest.spyOn(referralRepository, "find").mockResolvedValue([]);

      // Act
      await service.getReferralsByReferrer(mockStaffId, "staff", mockClinicId);

      // Assert
      expect(referralRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clinicId: mockClinicId,
          }),
        }),
      );
    });
  });

  describe("getReferralByPatient", () => {
    it("應該返回患者的推薦記錄", async () => {
      // Arrange
      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(mockReferral as any);

      // Act
      const result = await service.getReferralByPatient(
        mockPatientId,
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockReferral);
      expect(referralRepository.findOne).toHaveBeenCalledWith({
        where: {
          patientId: mockPatientId,
          clinicId: mockClinicId,
        },
      });
    });

    it("患者沒有推薦記錄時應該返回 null", async () => {
      // Arrange
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);

      // Act
      const result = await service.getReferralByPatient(
        mockPatientId,
        mockClinicId,
      );

      // Assert
      expect(result).toBeNull();
    });

    it("應該強制進行多租戶隔離", async () => {
      // Arrange
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);

      // Act
      await service.getReferralByPatient(mockPatientId, mockClinicId);

      // Assert
      expect(referralRepository.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          clinicId: mockClinicId,
        }),
      });
    });
  });

  describe("convertReferral", () => {
    it("應該成功轉化推薦並獎勵點數", async () => {
      // Arrange
      const referralWithPatient = { ...mockReferral, patient: mockPatient };
      const convertedReferral = {
        ...referralWithPatient,
        status: "converted",
        firstTreatmentId: mockTreatmentId,
        firstTreatmentDate: expect.any(Date),
        pointsAwarded: 100,
      };

      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(referralWithPatient as any);
      jest.spyOn(treatmentRepository, "count").mockResolvedValue(0); // 無其他治療
      jest.spyOn(pointsConfigService, "getConfigByKey").mockResolvedValue(100);
      jest.spyOn(pointsService, "awardPoints").mockResolvedValue({} as any);
      jest
        .spyOn(staffRepository, "findOne")
        .mockResolvedValue(mockStaff as any);
      jest
        .spyOn(referralRepository, "save")
        .mockResolvedValue(convertedReferral as any);

      // Act
      const result = await service.convertReferral(
        mockReferral.id,
        mockTreatmentId,
        mockClinicId,
      );

      // Assert
      expect(result.status).toBe("converted");
      expect(result.firstTreatmentId).toBe(mockTreatmentId);
      expect(result.pointsAwarded).toBe(100);
      expect(pointsService.awardPoints).toHaveBeenCalled();
    });

    it("推薦不存在時應該拋出 NotFoundException", async () => {
      // Arrange
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.convertReferral(mockReferral.id, mockTreatmentId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("推薦已轉化時應該拋出 BadRequestException", async () => {
      // Arrange
      const convertedReferral = { ...mockReferral, status: "converted" };
      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(convertedReferral as any);

      // Act & Assert
      await expect(
        service.convertReferral(mockReferral.id, mockTreatmentId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it("如果患者已有其他療程則不應該轉化", async () => {
      // Arrange
      const referralWithPatient = { ...mockReferral, patient: mockPatient };
      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(referralWithPatient as any);
      jest.spyOn(treatmentRepository, "count").mockResolvedValue(2); // 已有一個之前的療程

      // Act & Assert
      await expect(
        service.convertReferral(mockReferral.id, mockTreatmentId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該強制進行多租戶隔離", async () => {
      // Arrange
      const findOneSpy = jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(null);

      // Act
      try {
        await service.convertReferral(
          mockReferral.id,
          mockTreatmentId,
          mockClinicId,
        );
      } catch {
        // 預期會拋出異常
      }

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          id: mockReferral.id,
          clinicId: mockClinicId,
        },
        relations: ["patient"],
      });
    });
  });

  describe("getReferralStats", () => {
    it("應該返回推薦統計數據", async () => {
      // Arrange
      jest.spyOn(referralRepository, "count").mockResolvedValue(10);
      jest.spyOn(referralRepository, "find").mockResolvedValue([
        { ...mockReferral, status: "converted", pointsAwarded: 100 },
        {
          ...mockReferral,
          id: "ref-002",
          status: "converted",
          pointsAwarded: 100,
        },
      ] as any);

      // Act
      const result = await service.getReferralStats(mockClinicId);

      // Assert
      expect(result).toHaveProperty("totalReferrals");
      expect(result).toHaveProperty("convertedCount");
      expect(result).toHaveProperty("conversionRate");
      expect(result).toHaveProperty("totalPointsAwarded");
    });

    it("轉化率計算應該正確", async () => {
      // Arrange
      jest.spyOn(referralRepository, "count").mockResolvedValue(10);
      jest.spyOn(referralRepository, "find").mockResolvedValue([
        { ...mockReferral, status: "converted" },
        { ...mockReferral, status: "converted" },
        { ...mockReferral, status: "converted" },
        { ...mockReferral, status: "converted" },
        { ...mockReferral, status: "converted" },
      ] as any);

      // Act
      const result = await service.getReferralStats(mockClinicId);

      // Assert
      expect(result.conversionRate).toBe(50); // 5 out of 10 = 50%
    });

    it("應該強制進行多租戶隔離", async () => {
      // Arrange
      const countSpy = jest
        .spyOn(referralRepository, "count")
        .mockResolvedValue(0);
      const findSpy = jest
        .spyOn(referralRepository, "find")
        .mockResolvedValue([]);

      // Act
      await service.getReferralStats(mockClinicId);

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId },
      });
      expect(findSpy).toHaveBeenCalledWith({
        where: expect.objectContaining({
          clinicId: mockClinicId,
        }),
      });
    });
  });

  describe("deleteReferral", () => {
    it("應該成功取消推薦", async () => {
      // Arrange
      jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(mockReferral as any);
      const saveSpy = jest
        .spyOn(referralRepository, "save")
        .mockResolvedValue({ ...mockReferral, status: "cancelled" } as any);

      // Act
      const result = await service.deleteReferral(
        mockReferral.id,
        mockClinicId,
      );

      // Assert
      expect(result.status).toBe("cancelled");
      expect(saveSpy).toHaveBeenCalled();
    });

    it("推薦不存在時應該拋出 NotFoundException", async () => {
      // Arrange
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteReferral(mockReferral.id, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該強制進行多租戶隔離", async () => {
      // Arrange
      const findOneSpy = jest
        .spyOn(referralRepository, "findOne")
        .mockResolvedValue(null);

      // Act
      try {
        await service.deleteReferral(mockReferral.id, mockClinicId);
      } catch {
        // 預期會拋出異常
      }

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: expect.objectContaining({
          clinicId: mockClinicId,
        }),
      });
    });
  });
});
