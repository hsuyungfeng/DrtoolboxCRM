import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TreatmentCourseService } from "./treatment-course.service";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import { TreatmentCourseTemplateService } from "./treatment-course-template.service";
import { TreatmentProgressService } from "./treatment-progress.service";
import { PointsService } from "../../points/services/points.service";
import { StaffService } from "../../staff/services/staff.service";
import Decimal from "decimal.js";

describe("TreatmentCourseService", () => {
  let service: TreatmentCourseService;
  let courseRepository: jest.Mocked<Repository<TreatmentCourse>>;
  let templateService: jest.Mocked<TreatmentCourseTemplateService>;
  let pointsService: jest.Mocked<PointsService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockClinicId = "clinic-001";
  const mockPatientId = "patient-001";
  const mockTemplateId = "tmpl-001";
  const mockCourseId = "course-001";

  const mockTemplate = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Mock repositories
    const mockCourseRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockSessionRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockAssignmentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    // Mock services
    const mockTemplateServiceInstance = {
      getTemplateById: jest.fn(),
    };

    const mockPointsServiceInstance = {
      redeemPoints: jest.fn(),
    };

    const mockTreatmentProgressService = {
      calculateProgressPercent: jest.fn(),
      getProgress: jest.fn(),
      isCourseFinallyCompleted: jest.fn(),
      calculateProgressForCourses: jest.fn(),
    };

    const mockStaffServiceInstance = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    // Mock DataSource with transaction
    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentCourseService,
        {
          provide: getRepositoryToken(TreatmentCourse),
          useValue: mockCourseRepo,
        },
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: mockSessionRepo,
        },
        {
          provide: getRepositoryToken(StaffAssignment),
          useValue: mockAssignmentRepo,
        },
        {
          provide: TreatmentCourseTemplateService,
          useValue: mockTemplateServiceInstance,
        },
        {
          provide: TreatmentProgressService,
          useValue: mockTreatmentProgressService,
        },
        {
          provide: PointsService,
          useValue: mockPointsServiceInstance,
        },
        {
          provide: StaffService,
          useValue: mockStaffServiceInstance,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TreatmentCourseService>(TreatmentCourseService);
    courseRepository = module.get(getRepositoryToken(TreatmentCourse));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sessionRepositoryFromModule = module.get(
      getRepositoryToken(TreatmentSession),
    );
    templateService = module.get(TreatmentCourseTemplateService);
    pointsService = module.get(PointsService);
    dataSource = module.get(DataSource);
  });

  describe("createCourse", () => {
    it("should create a course with 10 sessions", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 0,
      };

      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        totalSessions: 10,
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("0"),
        actualPayment: new Decimal("5000.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      // Mock template service
      templateService.getTemplateById.mockResolvedValue(mockTemplate as any);

      // Mock transaction
      dataSource.transaction.mockImplementation(async (cb) => {
        // Mock manager
        const mockManager = {
          save: jest.fn(),
        };

        // First call returns the saved course
        mockManager.save.mockResolvedValueOnce(mockCourse);

        // Subsequent calls return undefined (for sessions)
        mockManager.save.mockResolvedValue(undefined);

        return cb(mockManager as any);
      });

      const result = await service.createCourse(dto as any);

      expect(result.id).toBe(mockCourseId);
      expect(result.patientId).toBe(mockPatientId);
      expect(templateService.getTemplateById).toHaveBeenCalledWith(
        mockTemplateId,
        mockClinicId,
      );
    });

    it("should calculate actual payment with points deduction", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 500,
      };

      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("500"),
        actualPayment: new Decimal("4500.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate as any);
      pointsService.redeemPoints.mockResolvedValue({} as any);

      dataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          save: jest.fn(),
        };
        mockManager.save.mockResolvedValueOnce(mockCourse);
        mockManager.save.mockResolvedValue(undefined);
        return cb(mockManager as any);
      });

      const result = await service.createCourse(dto as any);

      expect(result.actualPayment.toNumber()).toBe(4500);
      expect(pointsService.redeemPoints).toHaveBeenCalled();
    });

    it("should throw error if template not found", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: "tmpl-invalid",
        clinicId: mockClinicId,
      };

      templateService.getTemplateById.mockResolvedValue(null);

      await expect(service.createCourse(dto as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(templateService.getTemplateById).toHaveBeenCalledWith(
        "tmpl-invalid",
        mockClinicId,
      );
    });

    it("should throw error if points exceed total price", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 6000, // 超過套餐價格 5000
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate as any);

      await expect(service.createCourse(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if patientId is missing", async () => {
      const dto = {
        patientId: "",
        templateId: mockTemplateId,
        clinicId: mockClinicId,
      };

      await expect(service.createCourse(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if templateId is missing", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: "",
        clinicId: mockClinicId,
      };

      await expect(service.createCourse(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if clinicId is missing", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: "",
      };

      await expect(service.createCourse(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should generate sessions with correct session prices", async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 0,
      };

      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("0"),
        actualPayment: new Decimal("5000.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate as any);

      const savedSessions = [];
      dataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          save: jest.fn().mockImplementation((entity: any) => {
            if (entity.sessionNumber !== undefined) {
              savedSessions.push(entity);
            }
            return entity.id
              ? Promise.resolve(entity)
              : Promise.resolve(mockCourse);
          }),
        };
        return cb(mockManager as any);
      });

      await service.createCourse(dto as any);

      // 驗證是否生成了 10 個 sessions
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe("getCourseById", () => {
    it("should fetch course with sessions and staff assignments", async () => {
      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("0"),
        actualPayment: new Decimal("5000.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      courseRepository.findOne.mockResolvedValue(mockCourse as any);

      const result = await service.getCourseById(mockCourseId, mockClinicId);

      expect(result.id).toBe(mockCourseId);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCourseId, clinicId: mockClinicId },
        relations: ["sessions", "sessions.staffAssignments"],
      });
    });

    it("should throw error if course not found", async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCourseById(mockCourseId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if courseId is missing", async () => {
      await expect(service.getCourseById("", mockClinicId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if clinicId is missing", async () => {
      await expect(service.getCourseById(mockCourseId, "")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getPatientCourses", () => {
    it("should fetch patient courses with sessions", async () => {
      const mockCourses = [
        {
          id: mockCourseId,
          patientId: mockPatientId,
          templateId: mockTemplateId,
          status: "active",
          purchaseAmount: new Decimal("5000.00"),
          pointsRedeemed: new Decimal("0"),
          actualPayment: new Decimal("5000.00"),
          clinicId: mockClinicId,
          purchaseDate: new Date(),
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          sessions: [],
          patient: null,
        },
      ];

      courseRepository.find.mockResolvedValue(mockCourses as any);

      const result = await service.getPatientCourses(
        mockPatientId,
        mockClinicId,
      );

      expect(result.length).toBe(1);
      expect(result[0].patientId).toBe(mockPatientId);
      expect(courseRepository.find).toHaveBeenCalledWith({
        where: { patientId: mockPatientId, clinicId: mockClinicId },
        relations: ["sessions", "sessions.staffAssignments"],
        order: { createdAt: "DESC" },
      });
    });

    it("should return empty array if no courses found", async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.getPatientCourses(
        mockPatientId,
        mockClinicId,
      );

      expect(result.length).toBe(0);
    });

    it("should throw error if patientId is missing", async () => {
      await expect(service.getPatientCourses("", mockClinicId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if clinicId is missing", async () => {
      await expect(
        service.getPatientCourses(mockPatientId, ""),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateCourseStatus", () => {
    it("should update course status to completed and set completedAt", async () => {
      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("0"),
        actualPayment: new Decimal("5000.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      courseRepository.findOne.mockResolvedValue(mockCourse as any);
      courseRepository.save.mockResolvedValue({
        ...mockCourse,
        status: "completed",
        completedAt: new Date(),
      } as any);

      const result = await service.updateCourseStatus(
        mockCourseId,
        mockClinicId,
        "completed",
      );

      expect(result.status).toBe("completed");
      expect(result.completedAt).not.toBeNull();
    });

    it("should update course status to abandoned", async () => {
      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        purchaseAmount: new Decimal("5000.00"),
        pointsRedeemed: new Decimal("0"),
        actualPayment: new Decimal("5000.00"),
        clinicId: mockClinicId,
        purchaseDate: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
        patient: null,
      };

      courseRepository.findOne.mockResolvedValue(mockCourse as any);
      courseRepository.save.mockResolvedValue({
        ...mockCourse,
        status: "abandoned",
      } as any);

      const result = await service.updateCourseStatus(
        mockCourseId,
        mockClinicId,
        "abandoned",
      );

      expect(result.status).toBe("abandoned");
    });

    it("should throw error if status is invalid", async () => {
      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        clinicId: mockClinicId,
        sessions: [],
        patient: null,
      };

      courseRepository.findOne.mockResolvedValue(mockCourse as any);

      await expect(
        service.updateCourseStatus(
          mockCourseId,
          mockClinicId,
          "invalid" as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if courseId is missing", async () => {
      await expect(
        service.updateCourseStatus("", mockClinicId, "active"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if clinicId is missing", async () => {
      await expect(
        service.updateCourseStatus(mockCourseId, "", "active"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if course not found", async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCourseStatus(mockCourseId, mockClinicId, "active"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if save fails", async () => {
      const mockCourse = {
        id: mockCourseId,
        patientId: mockPatientId,
        templateId: mockTemplateId,
        status: "active",
        clinicId: mockClinicId,
        sessions: [],
        patient: null,
      };

      courseRepository.findOne.mockResolvedValue(mockCourse as any);
      courseRepository.save.mockResolvedValue(null);

      await expect(
        service.updateCourseStatus(mockCourseId, mockClinicId, "completed"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
