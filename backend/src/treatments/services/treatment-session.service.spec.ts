import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotFoundException } from "@nestjs/common";
import { TreatmentSessionService } from "./treatment-session.service";
import { TreatmentSession } from "../entities/treatment-session.entity";
import { Treatment } from "../entities/treatment.entity";
import { SessionCompletedEvent } from "../../events/session-completed.event";
import { TreatmentCompletedEvent } from "../../events/treatment-completed.event";

describe("TreatmentSessionService", () => {
  let service: TreatmentSessionService;
  let sessionRepo: jest.Mocked<Repository<TreatmentSession>>;
  let treatmentRepo: jest.Mocked<Repository<Treatment>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockClinicId = "clinic_001";
  const mockTreatmentId = "treatment_001";
  const mockSessionId = "session_001";

  const mockTreatment: Partial<Treatment> = {
    id: mockTreatmentId,
    name: "皮膚療程",
    totalPrice: 10000,
    totalSessions: 5,
    completedSessions: 2,
    status: "in_progress",
    clinicId: mockClinicId,
    sessions: [],
  };

  const mockSession: Partial<TreatmentSession> = {
    id: mockSessionId,
    treatmentId: mockTreatmentId,
    sessionIndex: 1,
    status: "scheduled",
    scheduledTime: new Date("2026-02-15T10:00:00"),
    clinicId: mockClinicId,
    notes: "",
    observations: "",
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as unknown as SelectQueryBuilder<TreatmentSession>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentSessionService,
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Treatment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TreatmentSessionService>(TreatmentSessionService);
    sessionRepo = module.get(getRepositoryToken(TreatmentSession));
    treatmentRepo = module.get(getRepositoryToken(Treatment));
    eventEmitter = module.get(EventEmitter2);
  });

  it("應該被定義", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createDto = {
      treatmentId: mockTreatmentId,
      sessionIndex: 1,
      scheduledTime: new Date("2026-02-15T10:00:00"),
      clinicId: mockClinicId,
    };

    it("應該成功創建療程次數", async () => {
      treatmentRepo.findOne = jest.fn().mockResolvedValue(mockTreatment);
      sessionRepo.create = jest.fn().mockReturnValue({ ...mockSession });
      sessionRepo.save = jest.fn().mockResolvedValue({ ...mockSession });

      const result = await service.create(createDto);

      expect(sessionRepo.create).toHaveBeenCalledWith(createDto);
      expect(sessionRepo.save).toHaveBeenCalled();
      expect(result.treatmentId).toBe(mockTreatmentId);
    });

    it("應該在療程不存在時拋出 NotFoundException", async () => {
      treatmentRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAllByTreatment", () => {
    it("應該返回指定療程的所有次數", async () => {
      const mockSessions = [mockSession, { ...mockSession, id: "session_002" }];
      sessionRepo.find = jest.fn().mockResolvedValue(mockSessions);

      const result = await service.findAllByTreatment(
        mockTreatmentId,
        mockClinicId,
      );

      expect(result).toHaveLength(2);
      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { treatmentId: mockTreatmentId, clinicId: mockClinicId },
        order: { sessionIndex: "ASC" },
        relations: ["treatment"],
      });
    });
  });

  describe("findAllByClinic", () => {
    it("應該返回診所的所有療程次數", async () => {
      const mockSessions = [mockSession];
      sessionRepo.find = jest.fn().mockResolvedValue(mockSessions);

      const result = await service.findAllByClinic(mockClinicId);

      expect(result).toEqual(mockSessions);
      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId },
        order: { createdAt: "DESC" },
        relations: ["treatment"],
      });
    });
  });

  describe("findOne", () => {
    it("應該返回單個療程次數", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue({ ...mockSession });

      const result = await service.findOne(mockSessionId);

      expect(result.id).toBe(mockSessionId);
    });

    it("應該在找不到時拋出 NotFoundException", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("應該成功更新療程次數", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue({ ...mockSession });
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(mockSessionId, {
        notes: "更新的備註",
      });

      expect(result.notes).toBe("更新的備註");
    });

    it("應該在狀態更新為 completed 時自動設置 actualTime", async () => {
      const scheduledSession = { ...mockSession, actualTime: null };
      sessionRepo.findOne = jest.fn().mockResolvedValue(scheduledSession);
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(mockSessionId, {
        status: "completed",
      });

      expect(result.actualTime).toBeDefined();
    });
  });

  describe("remove", () => {
    it("應該軟刪除療程次數（設置狀態為 cancelled）", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue({ ...mockSession });
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.remove(mockSessionId);

      expect(sessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" }),
      );
    });
  });

  describe("completeSession", () => {
    it("應該成功完成療程次數並發出事件", async () => {
      const sessionToComplete = { ...mockSession, status: "in_progress" };
      sessionRepo.findOne = jest.fn().mockResolvedValue(sessionToComplete);
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, status: "completed", actualTime: new Date() }),
      );

      // 模擬治療有多個 session
      const treatmentWithSessions = {
        ...mockTreatment,
        sessions: [
          { id: "s1", status: "completed" },
          { id: "s2", status: "completed" },
          { id: mockSessionId, status: "in_progress" }, // 即將完成
        ],
      };
      treatmentRepo.findOne = jest.fn().mockResolvedValue(treatmentWithSessions);
      treatmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.completeSession(
        mockSessionId,
        "完成備註",
        "觀察記錄",
      );

      expect(result.status).toBe("completed");
      expect(result.actualTime).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "session.completed",
        expect.any(SessionCompletedEvent),
      );
    });

    it("應該在所有次數完成時發出 treatment.completed 事件", async () => {
      const sessionToComplete = { ...mockSession, status: "in_progress" };
      sessionRepo.findOne = jest.fn().mockResolvedValue(sessionToComplete);
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, status: "completed", actualTime: new Date() }),
      );

      // 模擬所有 session 都將完成
      const treatmentWithAllCompleted = {
        ...mockTreatment,
        totalSessions: 3,
        completedSessions: 2,
        sessions: [
          { id: "s1", status: "completed" },
          { id: "s2", status: "completed" },
          { id: mockSessionId, status: "completed" }, // 完成後變成 completed
        ],
      };
      treatmentRepo.findOne = jest.fn().mockResolvedValue(treatmentWithAllCompleted);
      treatmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.completeSession(mockSessionId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "session.completed",
        expect.any(SessionCompletedEvent),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "treatment.completed",
        expect.any(TreatmentCompletedEvent),
      );
    });
  });

  describe("findByStatus", () => {
    it("應該返回指定狀態的療程次數", async () => {
      const mockSessions = [mockSession];
      sessionRepo.find = jest.fn().mockResolvedValue(mockSessions);

      const result = await service.findByStatus(mockClinicId, "scheduled");

      expect(result).toEqual(mockSessions);
      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId, status: "scheduled" },
        order: { scheduledTime: "ASC" },
        relations: ["treatment"],
      });
    });
  });

  describe("findUpcomingSessions", () => {
    it("應該返回即將到來的療程次數", async () => {
      const upcomingSessions = [mockSession];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(upcomingSessions),
      };
      sessionRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findUpcomingSessions(mockClinicId, 7);

      expect(result).toEqual(upcomingSessions);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "session.clinicId = :clinicId",
        { clinicId: mockClinicId },
      );
    });

    it("應該使用默認天數 7 天", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      sessionRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.findUpcomingSessions(mockClinicId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe("updateTreatmentCompletionStatus (私有方法通過 completeSession 測試)", () => {
    it("應該正確計算已完成的療程次數", async () => {
      const sessionToComplete = { ...mockSession, status: "in_progress" };
      sessionRepo.findOne = jest.fn().mockResolvedValue(sessionToComplete);
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, status: "completed", actualTime: new Date() }),
      );

      const treatmentWithMixedSessions = {
        ...mockTreatment,
        totalSessions: 5,
        completedSessions: 2,
        sessions: [
          { id: "s1", status: "completed" },
          { id: "s2", status: "completed" },
          { id: mockSessionId, status: "completed" }, // 完成後
          { id: "s4", status: "scheduled" },
          { id: "s5", status: "scheduled" },
        ],
      };
      treatmentRepo.findOne = jest.fn().mockResolvedValue(treatmentWithMixedSessions);
      treatmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.completeSession(mockSessionId);

      // 驗證 treatment.save 被調用並更新了 completedSessions
      expect(treatmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ completedSessions: 3 }),
      );
    });

    it("應該在療程不存在時不拋出錯誤", async () => {
      sessionRepo.findOne = jest.fn().mockResolvedValue({ ...mockSession });
      sessionRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, status: "completed", actualTime: new Date() }),
      );
      treatmentRepo.findOne = jest.fn().mockResolvedValue(null);

      // 不應該拋出錯誤
      await expect(
        service.completeSession(mockSessionId),
      ).resolves.toBeDefined();
    });
  });
});
