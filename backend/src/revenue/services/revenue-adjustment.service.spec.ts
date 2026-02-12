import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  Repository,
  DataSource,
  QueryRunner,
  EntityManager,
  SelectQueryBuilder,
} from "typeorm";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { RevenueAdjustmentService } from "./revenue-adjustment.service";
import { RevenueAdjustment } from "../entities/revenue-adjustment.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { StaffService } from "../../staff/services/staff.service";

describe("RevenueAdjustmentService", () => {
  let service: RevenueAdjustmentService;
  let adjustmentRepo: jest.Mocked<Repository<RevenueAdjustment>>;
  let recordRepo: jest.Mocked<Repository<RevenueRecord>>;
  let dataSource: jest.Mocked<DataSource>;
  let staffService: jest.Mocked<StaffService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockClinicId = "clinic_001";
  const mockRecordId = "record_001";
  const mockAdjustmentId = "adjustment_001";
  const mockStaffId = "staff_001";

  const mockRevenueRecord: Partial<RevenueRecord> = {
    id: mockRecordId,
    amount: 1000,
    status: "calculated",
    lockedAt: null,
    clinicId: mockClinicId,
  };

  const mockAdjustment: Partial<RevenueAdjustment> = {
    id: mockAdjustmentId,
    revenueRecordId: mockRecordId,
    adjustmentAmount: 100,
    reason: "測試調整",
    createdBy: mockStaffId,
    clinicId: mockClinicId,
    reviewStatus: "pending",
  };

  beforeEach(async () => {
    // 創建 mock QueryRunner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        remove: jest.fn(),
      } as unknown as EntityManager,
    } as unknown as jest.Mocked<QueryRunner>;

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    } as unknown as SelectQueryBuilder<RevenueAdjustment>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueAdjustmentService,
        {
          provide: getRepositoryToken(RevenueAdjustment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(RevenueRecord),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
        {
          provide: StaffService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RevenueAdjustmentService>(RevenueAdjustmentService);
    adjustmentRepo = module.get(getRepositoryToken(RevenueAdjustment));
    recordRepo = module.get(getRepositoryToken(RevenueRecord));
    dataSource = module.get(DataSource);
    staffService = module.get(StaffService);
  });

  it("應該被定義", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createDto = {
      revenueRecordId: mockRecordId,
      adjustmentAmount: 100,
      reason: "測試調整",
      createdBy: mockStaffId,
      clinicId: mockClinicId,
    };

    it("應該成功創建分潤調整", async () => {
      recordRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockRevenueRecord });
      adjustmentRepo.create = jest
        .fn()
        .mockReturnValue({ ...mockAdjustment });

      const result = await service.create(createDto, mockClinicId);

      expect(queryRunner.startTransaction).toHaveBeenCalledWith("SERIALIZABLE");
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it("應該在診所 ID 不匹配時拋出 ForbiddenException", async () => {
      await expect(
        service.create(createDto, "different_clinic"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("應該在分潤記錄不存在時拋出 NotFoundException", async () => {
      recordRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.create(createDto, mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("應該在分潤記錄已鎖定時拋出 BadRequestException", async () => {
      const lockedRecord = {
        ...mockRevenueRecord,
        lockedAt: new Date(),
      };
      recordRepo.findOne = jest.fn().mockResolvedValue(lockedRecord);

      await expect(service.create(createDto, mockClinicId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("應該在調整後金額為負數時拋出 BadRequestException", async () => {
      const negativeDtoAmount = {
        ...createDto,
        adjustmentAmount: -2000, // 會導致總金額變成負數
      };
      recordRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockRevenueRecord });

      await expect(
        service.create(negativeDtoAmount, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該在事務失敗時回滾", async () => {
      recordRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockRevenueRecord });
      adjustmentRepo.create = jest
        .fn()
        .mockReturnValue({ ...mockAdjustment });
      (queryRunner.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      await expect(service.create(createDto, mockClinicId)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("應該返回所有分潤調整", async () => {
      const mockAdjustments = [mockAdjustment];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAdjustments),
      };
      adjustmentRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockClinicId);

      expect(result).toEqual(mockAdjustments);
    });

    it("應該支持過濾條件", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      adjustmentRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.findAll(mockClinicId, {
        revenueRecordId: mockRecordId,
        createdBy: mockStaffId,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe("findOne", () => {
    it("應該返回單個分潤調整", async () => {
      adjustmentRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockAdjustment });

      const result = await service.findOne(mockAdjustmentId, mockClinicId);

      expect(result).toEqual(mockAdjustment);
    });

    it("應該在找不到時拋出 NotFoundException", async () => {
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.findOne("nonexistent", mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("應該成功更新審核狀態", async () => {
      adjustmentRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockAdjustment });
      adjustmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(
        mockAdjustmentId,
        { reviewStatus: "approved", reviewNotes: "已審核通過" },
        mockClinicId,
      );

      expect(result.reviewStatus).toBe("approved");
    });

    it("應該禁止直接修改調整金額", async () => {
      adjustmentRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockAdjustment });

      await expect(
        service.update(
          mockAdjustmentId,
          { adjustmentAmount: 500 },
          mockClinicId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("remove", () => {
    it("應該成功刪除待審核的調整", async () => {
      const pendingAdjustment = { ...mockAdjustment, reviewStatus: "pending" };
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(pendingAdjustment);
      recordRepo.findOne = jest
        .fn()
        .mockResolvedValue({ ...mockRevenueRecord });
      adjustmentRepo.count = jest.fn().mockResolvedValue(1);

      await service.remove(mockAdjustmentId, mockClinicId);

      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it("應該禁止刪除已審核通過的調整", async () => {
      const approvedAdjustment = {
        ...mockAdjustment,
        reviewStatus: "approved",
      };
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(approvedAdjustment);

      await expect(
        service.remove(mockAdjustmentId, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("review", () => {
    it("應該成功審核分潤調整（批准）", async () => {
      const pendingAdjustment = {
        ...mockAdjustment,
        reviewStatus: null, // 未審核
      };
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(pendingAdjustment);
      adjustmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.review(mockAdjustmentId, mockClinicId, {
        status: "approved",
        notes: "審核通過",
        reviewedBy: "reviewer_001",
      });

      expect(result.reviewStatus).toBe("approved");
      expect(result.reviewedBy).toBe("reviewer_001");
      expect(result.reviewedAt).toBeDefined();
    });

    it("應該成功審核分潤調整（拒絕）", async () => {
      const pendingAdjustment = {
        ...mockAdjustment,
        reviewStatus: null,
      };
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(pendingAdjustment);
      adjustmentRepo.save = jest.fn().mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.review(mockAdjustmentId, mockClinicId, {
        status: "rejected",
        notes: "金額有誤",
        reviewedBy: "reviewer_001",
      });

      expect(result.reviewStatus).toBe("rejected");
    });

    it("應該禁止重複審核", async () => {
      const reviewedAdjustment = {
        ...mockAdjustment,
        reviewStatus: "approved", // 已審核
      };
      adjustmentRepo.findOne = jest.fn().mockResolvedValue(reviewedAdjustment);

      await expect(
        service.review(mockAdjustmentId, mockClinicId, {
          status: "rejected",
          reviewedBy: "reviewer_001",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findByRevenueRecordId", () => {
    it("應該返回指定分潤記錄的所有調整", async () => {
      const mockAdjustments = [mockAdjustment];
      adjustmentRepo.find = jest.fn().mockResolvedValue(mockAdjustments);

      const result = await service.findByRevenueRecordId(
        mockRecordId,
        mockClinicId,
      );

      expect(result).toEqual(mockAdjustments);
      expect(adjustmentRepo.find).toHaveBeenCalledWith({
        where: { revenueRecordId: mockRecordId, clinicId: mockClinicId },
        order: { createdAt: "DESC" },
        relations: ["revenueRecord"],
      });
    });
  });

  describe("getTotalAdjustmentAmount", () => {
    it("應該計算已批准調整的總金額", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: "500" }),
      };
      adjustmentRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalAdjustmentAmount(
        mockRecordId,
        mockClinicId,
      );

      expect(result).toBe(500);
    });

    it("應該在沒有調整時返回 0", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      adjustmentRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalAdjustmentAmount(
        mockRecordId,
        mockClinicId,
      );

      expect(result).toBe(0);
    });
  });
});
