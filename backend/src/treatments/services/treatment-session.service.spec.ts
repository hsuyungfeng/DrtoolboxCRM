import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { TreatmentSessionService } from "./treatment-session.service";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { TreatmentCourse } from "../entities/treatment-course.entity";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import { PPFCalculationService } from "./ppf-calculation.service";
import Decimal from "decimal.js";

describe("TreatmentSessionService - Task 8", () => {
  let service: TreatmentSessionService;
  let sessionRepository: jest.Mocked<Repository<TreatmentSession>>;
  let courseRepository: jest.Mocked<Repository<TreatmentCourse>>;
  let assignmentRepository: jest.Mocked<Repository<StaffAssignment>>;
  let ppfCalculationService: jest.Mocked<PPFCalculationService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let dataSource: jest.Mocked<DataSource>;

  const mockClinicId = "clinic-001";
  const mockPatientId = "patient-001";
  const mockSessionId = "session-001";
  const mockCourseId = "course-001";
  const mockStaffId1 = "staff-001";
  const mockStaffId2 = "staff-002";

  const mockTreatmentCourse: Partial<TreatmentCourse> = {
    id: mockCourseId,
    patientId: mockPatientId,
    clinicId: mockClinicId,
    status: "active",
    purchaseAmount: new Decimal("10000"),
    pointsRedeemed: new Decimal("0"),
    actualPayment: new Decimal("10000"),
    purchaseDate: new Date("2026-01-01"),
    completedAt: null,
    sessions: [],
  };

  const mockSession: Partial<TreatmentSession> = {
    id: mockSessionId,
    treatmentCourseId: mockCourseId,
    clinicId: mockClinicId,
    sessionNumber: 1,
    completionStatus: "pending",
    scheduledDate: new Date("2026-02-15"),
    therapistNotes: "",
    patientFeedback: "",
    staffAssignments: [],
  };

  beforeEach(async () => {
    const mockTransactionManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSourceInstance = {
      transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback(mockTransactionManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentSessionService,
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TreatmentCourse),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffAssignment),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PPFCalculationService,
          useValue: {
            validateStaffAssignments: jest.fn(),
            distributeToStaff: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSourceInstance,
        },
      ],
    }).compile();

    service = module.get<TreatmentSessionService>(TreatmentSessionService);
    sessionRepository = module.get(getRepositoryToken(TreatmentSession));
    courseRepository = module.get(getRepositoryToken(TreatmentCourse));
    assignmentRepository = module.get(getRepositoryToken(StaffAssignment));
    ppfCalculationService = module.get(PPFCalculationService);
    eventEmitter = module.get(EventEmitter2);
    dataSource = module.get(DataSource);
  });

  describe("updateSession", () => {
    it("應該成功更新 therapistNotes", async () => {
      const updateDto = { therapistNotes: "新的治療師備註" };
      sessionRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockSession });
      sessionRepository.save = jest
        .fn()
        .mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.therapistNotes).toBe("新的治療師備註");
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it("應該成功更新 patientFeedback", async () => {
      const updateDto = { patientFeedback: "患者反饋" };
      sessionRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockSession });
      sessionRepository.save = jest
        .fn()
        .mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.patientFeedback).toBe("患者反饋");
    });

    it("應該成功更新 scheduledDate", async () => {
      const newDate = new Date("2026-03-01");
      const updateDto = { scheduledDate: newDate };
      sessionRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockSession });
      sessionRepository.save = jest
        .fn()
        .mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.scheduledDate).toEqual(newDate);
    });

    it("應該同時更新多個欄位", async () => {
      const updateDto = {
        therapistNotes: "備註",
        patientFeedback: "反饋",
        scheduledDate: new Date("2026-03-01"),
      };
      sessionRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockSession });
      sessionRepository.save = jest
        .fn()
        .mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.therapistNotes).toBe("備註");
      expect(result.patientFeedback).toBe("反饋");
      expect(result.scheduledDate).toEqual(new Date("2026-03-01"));
    });

    it("應該在 session 不存在時拋出 NotFoundException", async () => {
      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateSession(mockSessionId, {}, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在 clinicId 不匹配時拋出 NotFoundException", async () => {
      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateSession(mockSessionId, {}, "wrong-clinic"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("completeSession - Basic", () => {
    it("應該成功完成 pending session", async () => {
      const startTime = new Date("2026-02-15T10:00:00");
      const endTime = new Date("2026-02-15T11:00:00");
      const updateDto = {
        actualStartTime: startTime,
        actualEndTime: endTime,
        therapistNotes: "療程完成",
      };

      const sessionWithRelations = {
        ...mockSession,
        treatmentCourse: { ...mockTreatmentCourse, sessions: [] },
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(sessionWithRelations),
        find: jest
          .fn()
          .mockResolvedValue([
            { ...mockSession, completionStatus: "completed" },
          ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
            actualStartTime: startTime,
            actualEndTime: endTime,
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      const result = await service.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.completionStatus).toBe("completed");
      expect(result.actualStartTime).toEqual(startTime);
      expect(result.actualEndTime).toEqual(endTime);
    });

    it("應該在 session 不存在時拋出 NotFoundException", async () => {
      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await expect(
        service.completeSession(mockSessionId, {}, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it("應該在 session 已完成時拋出 BadRequestException", async () => {
      const completedSession = {
        ...mockSession,
        completionStatus: "completed",
        treatmentCourse: mockTreatmentCourse,
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(completedSession),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await expect(
        service.completeSession(mockSessionId, {}, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該在 session 已取消時拋出 BadRequestException", async () => {
      const cancelledSession = {
        ...mockSession,
        completionStatus: "cancelled",
        treatmentCourse: mockTreatmentCourse,
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(cancelledSession),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await expect(
        service.completeSession(mockSessionId, {}, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("completeSession - Staff Assignments", () => {
    it("應該成功創建員工分配並計算 PPF", async () => {
      const staffAssignments = [
        {
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("100"),
        },
      ];

      const startTime = new Date("2026-02-15T10:00:00");
      const updateDto = {
        actualStartTime: startTime,
        actualEndTime: new Date("2026-02-15T11:00:00"),
        staffAssignments,
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        actualPayment: new Decimal("10000"),
        sessions: [
          mockSession,
          { ...mockSession, id: "s2" },
          { ...mockSession, id: "s3" },
        ],
      };

      const sessionWithRelations = {
        ...mockSession,
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const createdAssignments = [
        {
          id: "assign-001",
          sessionId: mockSessionId,
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("100"),
          ppfAmount: new Decimal("3333.33"),
        },
      ];

      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(sessionWithRelations)
          .mockResolvedValueOnce(courseWithSessions),
        find: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
            staffAssignments: createdAssignments,
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      ppfCalculationService.validateStaffAssignments = jest
        .fn()
        .mockReturnValue(true);
      ppfCalculationService.distributeToStaff = jest
        .fn()
        .mockResolvedValue(createdAssignments);

      const result = await service.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(ppfCalculationService.validateStaffAssignments).toHaveBeenCalled();
      expect(ppfCalculationService.distributeToStaff).toHaveBeenCalled();
      expect(result.staffAssignments).toHaveLength(1);
    });

    it("應該在 PPF 百分比無效時拋出 BadRequestException", async () => {
      const staffAssignments = [
        {
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("60"),
        },
        {
          staffId: mockStaffId2,
          staffRole: "協助",
          ppfPercentage: new Decimal("30"),
        },
      ];

      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        staffAssignments,
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue({
          ...mockSession,
          treatmentCourse: mockTreatmentCourse,
        }),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      ppfCalculationService.validateStaffAssignments = jest
        .fn()
        .mockImplementation(() => {
          throw new BadRequestException("員工分配百分比之和必須為 100%");
        });

      await expect(
        service.completeSession(mockSessionId, updateDto, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該刪除舊的員工分配並創建新的", async () => {
      const staffAssignments = [
        {
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("100"),
        },
      ];

      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        staffAssignments,
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        actualPayment: new Decimal("10000"),
        sessions: [mockSession],
      };

      const sessionWithRelations = {
        ...mockSession,
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const createdAssignments = [
        {
          id: "assign-new",
          sessionId: mockSessionId,
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("100"),
          ppfAmount: new Decimal("10000"),
        },
      ];

      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(sessionWithRelations)
          .mockResolvedValueOnce(courseWithSessions),
        find: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
            staffAssignments: createdAssignments,
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      ppfCalculationService.validateStaffAssignments = jest
        .fn()
        .mockReturnValue(true);
      ppfCalculationService.distributeToStaff = jest
        .fn()
        .mockResolvedValue(createdAssignments);

      const result = await service.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(mockTransactionManager.delete).toHaveBeenCalled();
      expect(result.staffAssignments).toEqual(createdAssignments);
    });

    it("應該為多個員工正確計算 PPF", async () => {
      const staffAssignments = [
        {
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("60"),
        },
        {
          staffId: mockStaffId2,
          staffRole: "協助",
          ppfPercentage: new Decimal("40"),
        },
      ];

      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        staffAssignments,
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        actualPayment: new Decimal("10000"),
        sessions: [mockSession, { ...mockSession, id: "s2" }],
      };

      const sessionWithRelations = {
        ...mockSession,
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const createdAssignments = [
        {
          id: "assign-001",
          sessionId: mockSessionId,
          staffId: mockStaffId1,
          staffRole: "主治",
          ppfPercentage: new Decimal("60"),
          ppfAmount: new Decimal("3000"),
        },
        {
          id: "assign-002",
          sessionId: mockSessionId,
          staffId: mockStaffId2,
          staffRole: "協助",
          ppfPercentage: new Decimal("40"),
          ppfAmount: new Decimal("2000"),
        },
      ];

      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(sessionWithRelations)
          .mockResolvedValueOnce(courseWithSessions),
        find: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
            staffAssignments: createdAssignments,
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      ppfCalculationService.validateStaffAssignments = jest
        .fn()
        .mockReturnValue(true);
      ppfCalculationService.distributeToStaff = jest
        .fn()
        .mockResolvedValue(createdAssignments);

      const result = await service.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.staffAssignments).toHaveLength(2);
      expect(result.staffAssignments[0].ppfAmount).toEqual(new Decimal("3000"));
      expect(result.staffAssignments[1].ppfAmount).toEqual(new Decimal("2000"));
    });
  });

  describe("completeSession - Event Emission", () => {
    it("應該發出 session.completed 事件", async () => {
      const startTime = new Date();
      const updateDto = {
        actualStartTime: startTime,
        actualEndTime: new Date(),
      };

      const sessionWithRelations = {
        ...mockSession,
        treatmentCourseId: mockCourseId,
        treatmentCourse: { ...mockTreatmentCourse, sessions: [mockSession] },
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValueOnce(sessionWithRelations),
        find: jest
          .fn()
          .mockResolvedValue([
            { ...mockSession, completionStatus: "completed" },
          ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
            id: mockSessionId,
            treatmentCourseId: mockCourseId,
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await service.completeSession(mockSessionId, updateDto, mockClinicId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "session.completed",
        expect.objectContaining({
          sessionId: mockSessionId,
          treatmentCourseId: mockCourseId,
          patientId: mockPatientId,
        }),
      );
    });
  });

  describe("completeSession - Course Completion", () => {
    it("應該在所有 sessions 完成時更新 course 狀態為 completed", async () => {
      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        sessions: [
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "completed" },
          { ...mockSession, id: "s3", completionStatus: "completed" },
        ],
      };

      const sessionWithRelations = {
        ...mockSession,
        completionStatus: "pending",
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(sessionWithRelations)
          .mockResolvedValueOnce(courseWithSessions),
        find: jest.fn().mockResolvedValue([
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "completed" },
          { ...mockSession, id: "s3", completionStatus: "completed" },
        ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            status: "completed",
            completedAt: new Date(),
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await service.completeSession(mockSessionId, updateDto, mockClinicId);

      expect(mockTransactionManager.save).toHaveBeenCalled();
    });

    it("應該在有未完成 sessions 時保持 course 狀態為 active", async () => {
      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        status: "active",
        sessions: [
          mockSession,
          { ...mockSession, id: "s2", completionStatus: "pending" },
        ],
      };

      const sessionWithRelations = {
        ...mockSession,
        completionStatus: "pending",
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValueOnce(sessionWithRelations),
        find: jest.fn().mockResolvedValue([
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "pending" },
        ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await service.completeSession(mockSessionId, updateDto, mockClinicId);

      // Course should not be updated since not all sessions are complete
      const saveCalls = mockTransactionManager.save.mock.calls;
      const courseSaveCalls = saveCalls.filter(
        (call) => call[1]?.id === mockCourseId || call[0]?.id === mockCourseId,
      );
      expect(courseSaveCalls.length).toBe(0);
    });

    it("最後一個 session 完成時應 emit course.completed", async () => {
      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        id: mockCourseId,
        sessions: [
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "completed" },
          { ...mockSession, id: "s3", completionStatus: "completed" },
        ],
      };

      const sessionWithRelations = {
        ...mockSession,
        completionStatus: "pending",
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(sessionWithRelations)
          .mockResolvedValueOnce(courseWithSessions),
        find: jest.fn().mockResolvedValue([
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "completed" },
          { ...mockSession, id: "s3", completionStatus: "completed" },
        ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            status: "completed",
            completedAt: new Date(),
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      eventEmitter.emit = jest.fn();
      await service.completeSession(mockSessionId, updateDto, mockClinicId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'course.completed',
        expect.objectContaining({
          courseId: expect.any(String),
          patientId: expect.any(String),
          clinicId: expect.any(String),
        }),
      );
    });

    it("非最後一個 session 完成時不應 emit course.completed", async () => {
      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
      };

      const courseWithSessions = {
        ...mockTreatmentCourse,
        status: "active",
        sessions: [
          mockSession,
          { ...mockSession, id: "s2", completionStatus: "pending" },
        ],
      };

      const sessionWithRelations = {
        ...mockSession,
        completionStatus: "pending",
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValueOnce(sessionWithRelations),
        find: jest.fn().mockResolvedValue([
          { ...mockSession, completionStatus: "completed" },
          { ...mockSession, id: "s2", completionStatus: "pending" },
        ]),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            completionStatus: "completed",
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      eventEmitter.emit = jest.fn();
      await service.completeSession(mockSessionId, updateDto, mockClinicId);

      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'course.completed',
        expect.anything(),
      );
    });

    it("應該在完成 10 個 sessions 的複雜情景中更新 course", async () => {
      const updateDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
      };

      const sessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        completionStatus: i < 9 ? "completed" : "pending",
      }));

      const courseWithSessions = {
        ...mockTreatmentCourse,
        sessions,
      };

      const sessionWithRelations = {
        ...mockSession,
        id: "session-9",
        completionStatus: "pending",
        treatmentCourse: courseWithSessions,
        staffAssignments: [],
      };

      // After completing session-9, all should be done
      const allCompletedSessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        completionStatus: "completed",
      }));

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValueOnce(sessionWithRelations),
        find: jest.fn().mockResolvedValue(allCompletedSessions),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({
            ...entity,
            status: "completed",
            completedAt: new Date(),
          }),
        ),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return callback(mockTransactionManager);
        },
      );

      await service.completeSession("session-9", updateDto, mockClinicId);

      expect(mockTransactionManager.save).toHaveBeenCalled();
    });
  });

  describe("getStaffSessions", () => {
    it("應該返回員工的所有 sessions", async () => {
      const staffAssignments = [
        { sessionId: "session-1", session: mockSession },
        {
          sessionId: "session-2",
          session: { ...mockSession, id: "session-2" },
        },
      ];

      assignmentRepository.find = jest.fn().mockResolvedValue(staffAssignments);

      const result = await service.getStaffSessions(mockStaffId1, mockClinicId);

      expect(result).toHaveLength(2);
      expect(assignmentRepository.find).toHaveBeenCalled();
    });

    it("應該按 completionStatus 過濾 sessions", async () => {
      const staffAssignments = [
        {
          sessionId: "session-1",
          session: { ...mockSession, completionStatus: "completed" },
        },
      ];

      assignmentRepository.find = jest.fn().mockResolvedValue(staffAssignments);

      const result = await service.getStaffSessions(
        mockStaffId1,
        mockClinicId,
        { status: "completed" },
      );

      expect(result).toHaveLength(1);
    });

    it("應該按日期範圍過濾 sessions", async () => {
      const startDate = new Date("2026-02-01");
      const endDate = new Date("2026-02-28");

      const staffAssignments = [
        {
          sessionId: "session-1",
          session: { ...mockSession, scheduledDate: new Date("2026-02-15") },
        },
      ];

      assignmentRepository.find = jest.fn().mockResolvedValue(staffAssignments);

      const result = await service.getStaffSessions(
        mockStaffId1,
        mockClinicId,
        { startDate, endDate },
      );

      expect(result).toHaveLength(1);
    });

    it("應該在沒有 sessions 時返回空陣列", async () => {
      assignmentRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.getStaffSessions(mockStaffId1, mockClinicId);

      expect(result).toEqual([]);
    });

    it("應該按 scheduledDate 降序排列", async () => {
      const staffAssignments = [
        {
          sessionId: "session-1",
          session: { ...mockSession, scheduledDate: new Date("2026-02-10") },
        },
        {
          sessionId: "session-2",
          session: {
            ...mockSession,
            id: "session-2",
            scheduledDate: new Date("2026-02-15"),
          },
        },
        {
          sessionId: "session-3",
          session: {
            ...mockSession,
            id: "session-3",
            scheduledDate: new Date("2026-02-20"),
          },
        },
      ];

      assignmentRepository.find = jest.fn().mockResolvedValue(staffAssignments);

      const result = await service.getStaffSessions(mockStaffId1, mockClinicId);

      expect(result[0].scheduledDate).toEqual(new Date("2026-02-20"));
      expect(result[1].scheduledDate).toEqual(new Date("2026-02-15"));
      expect(result[2].scheduledDate).toEqual(new Date("2026-02-10"));
    });
  });
});
