import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { PPFCalculationService } from "./ppf-calculation.service";
import { StaffAssignment } from "../entities/staff-assignment.entity";
import Decimal from "decimal.js";

describe("PPFCalculationService", () => {
  let service: PPFCalculationService;
  let assignmentRepository: jest.Mocked<Repository<StaffAssignment>>;

  beforeEach(async () => {
    const mockAssignmentRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PPFCalculationService,
        {
          provide: getRepositoryToken(StaffAssignment),
          useValue: mockAssignmentRepository,
        },
      ],
    }).compile();

    service = module.get<PPFCalculationService>(PPFCalculationService);
    assignmentRepository = module.get(getRepositoryToken(StaffAssignment));
  });

  describe("validateStaffAssignments", () => {
    it("應該驗證單一員工分配 100%", () => {
      // Arrange
      const assignments = [{ ppfPercentage: new Decimal("100") }];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).not.toThrow();
    });

    it("應該驗證多個員工分配總計 100% (60%, 40%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("60") },
        { ppfPercentage: new Decimal("40") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).not.toThrow();
    });

    it("應該驗證三個員工分配總計 100% (30%, 40%, 30%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("30") },
        { ppfPercentage: new Decimal("40") },
        { ppfPercentage: new Decimal("30") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).not.toThrow();
    });

    it("應該拋出異常：空分配數組", () => {
      // Arrange
      const assignments: { ppfPercentage: Decimal }[] = [];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).toThrow(
        BadRequestException,
      );
    });

    it("應該拋出異常：分配總計 < 100% (50%, 40% = 90%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("50") },
        { ppfPercentage: new Decimal("40") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).toThrow(
        BadRequestException,
      );
    });

    it("應該拋出異常：分配總計 > 100% (60%, 50% = 110%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("60") },
        { ppfPercentage: new Decimal("50") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).toThrow(
        BadRequestException,
      );
    });

    it("應該拋出異常：浮點數精度邊界情況 (33.33%, 33.33%, 33.34% = 100.00%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("33.33") },
        { ppfPercentage: new Decimal("33.33") },
        { ppfPercentage: new Decimal("33.34") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).not.toThrow();
    });

    it("應該拋出異常：浮點數精度邊界情況 (33.33%, 33.33%, 33.33% = 99.99%)", () => {
      // Arrange
      const assignments = [
        { ppfPercentage: new Decimal("33.33") },
        { ppfPercentage: new Decimal("33.33") },
        { ppfPercentage: new Decimal("33.33") },
      ];

      // Act & Assert
      expect(() => service.validateStaffAssignments(assignments)).toThrow(
        BadRequestException,
      );
    });
  });

  describe("calculateStaffPPF", () => {
    it("應該正確計算 PPF：5000 × 60% = 3000", () => {
      // Arrange
      const paymentAmount = new Decimal("5000");
      const ppfPercentage = new Decimal("60");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toString()).toBe("3000");
    });

    it("應該正確計算 PPF：1000 × 25% = 250", () => {
      // Arrange
      const paymentAmount = new Decimal("1000");
      const ppfPercentage = new Decimal("25");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toString()).toBe("250");
    });

    it("應該正確計算小數 PPF：5000.50 × 50% = 2500.25", () => {
      // Arrange
      const paymentAmount = new Decimal("5000.50");
      const ppfPercentage = new Decimal("50");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toString()).toBe("2500.25");
    });

    it("應該正確計算小金額：100 × 10% = 10", () => {
      // Arrange
      const paymentAmount = new Decimal("100");
      const ppfPercentage = new Decimal("10");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toString()).toBe("10");
    });

    it("應該正確計算零金額：0 × 50% = 0", () => {
      // Arrange
      const paymentAmount = new Decimal("0");
      const ppfPercentage = new Decimal("50");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toString()).toBe("0");
    });

    it("應該保持 Decimal 精度：1000.99 × 33.33% = 333.629967", () => {
      // Arrange
      const paymentAmount = new Decimal("1000.99");
      const ppfPercentage = new Decimal("33.33");

      // Act
      const result = service.calculateStaffPPF(paymentAmount, ppfPercentage);

      // Assert
      expect(result.toDecimalPlaces(6).toString()).toBe("333.629967");
    });
  });

  describe("distributeToStaff", () => {
    it("應該成功計算和保存單一員工的 PPF", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("5000");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("100"),
          ppfAmount: new Decimal("0"),
        },
      ];

      assignmentRepository.save.mockResolvedValue(
        assignments[0] as StaffAssignment,
      );

      // Act
      const result = await service.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments as StaffAssignment[],
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].ppfAmount).toEqual(new Decimal("5000"));
      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it("應該成功計算和保存多個員工的 PPF", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("10000");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("60"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-002",
          sessionId,
          staffId: "staff-002",
          staffRole: "nurse",
          ppfPercentage: new Decimal("40"),
          ppfAmount: new Decimal("0"),
        },
      ];

      assignmentRepository.save.mockImplementation((a) =>
        Promise.resolve(a as StaffAssignment),
      );

      // Act
      const result = await service.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments as StaffAssignment[],
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].ppfAmount).toEqual(new Decimal("6000"));
      expect(result[1].ppfAmount).toEqual(new Decimal("4000"));
      expect(assignmentRepository.save).toHaveBeenCalledTimes(2);
    });

    it("應該在多員工分配時正確調用 repository.save()", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("5000.50");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("50"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-002",
          sessionId,
          staffId: "staff-002",
          staffRole: "therapist",
          ppfPercentage: new Decimal("50"),
          ppfAmount: new Decimal("0"),
        },
      ];

      assignmentRepository.save.mockImplementation((a) =>
        Promise.resolve(a as StaffAssignment),
      );

      // Act
      await service.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments as StaffAssignment[],
      );

      // Assert
      expect(assignmentRepository.save).toHaveBeenCalledTimes(2);

      // 驗證第一個員工的保存
      const firstCall = (assignmentRepository.save as jest.Mock).mock
        .calls[0][0];
      expect(firstCall.ppfAmount).toEqual(new Decimal("2500.25"));

      // 驗證第二個員工的保存
      const secondCall = (assignmentRepository.save as jest.Mock).mock
        .calls[1][0];
      expect(secondCall.ppfAmount).toEqual(new Decimal("2500.25"));
    });

    it("應該在無效的百分比分配時拋出異常", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("5000");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("50"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-002",
          sessionId,
          staffId: "staff-002",
          staffRole: "nurse",
          ppfPercentage: new Decimal("40"),
          ppfAmount: new Decimal("0"),
        },
      ];

      // Act & Assert
      await expect(
        service.distributeToStaff(
          sessionId,
          paymentAmount,
          assignments as StaffAssignment[],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("應該返回更新後的分配列表，包含正確的 ppfAmount 值", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("3000");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("30"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-002",
          sessionId,
          staffId: "staff-002",
          staffRole: "nurse",
          ppfPercentage: new Decimal("40"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-003",
          sessionId,
          staffId: "staff-003",
          staffRole: "therapist",
          ppfPercentage: new Decimal("30"),
          ppfAmount: new Decimal("0"),
        },
      ];

      assignmentRepository.save.mockImplementation((a) =>
        Promise.resolve(a as StaffAssignment),
      );

      // Act
      const result = await service.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments as StaffAssignment[],
      );

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].ppfAmount).toEqual(new Decimal("900"));
      expect(result[1].ppfAmount).toEqual(new Decimal("1200"));
      expect(result[2].ppfAmount).toEqual(new Decimal("900"));
    });

    it("應該驗證所有員工的 PPF 總和等於支付金額", async () => {
      // Arrange
      const sessionId = "session-001";
      const paymentAmount = new Decimal("5000");
      const assignments: Partial<StaffAssignment>[] = [
        {
          id: "assignment-001",
          sessionId,
          staffId: "staff-001",
          staffRole: "doctor",
          ppfPercentage: new Decimal("60"),
          ppfAmount: new Decimal("0"),
        },
        {
          id: "assignment-002",
          sessionId,
          staffId: "staff-002",
          staffRole: "nurse",
          ppfPercentage: new Decimal("40"),
          ppfAmount: new Decimal("0"),
        },
      ];

      assignmentRepository.save.mockImplementation((a) =>
        Promise.resolve(a as StaffAssignment),
      );

      // Act
      const result = await service.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments as StaffAssignment[],
      );

      // Assert
      const totalPPF = result.reduce(
        (sum, a) => sum.plus(a.ppfAmount),
        new Decimal("0"),
      );
      expect(totalPPF).toEqual(paymentAmount);
    });
  });
});
