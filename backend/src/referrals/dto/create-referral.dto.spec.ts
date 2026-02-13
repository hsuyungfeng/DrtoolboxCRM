import { validate } from "class-validator";
import { CreateReferralDto } from "./create-referral.dto";

describe("CreateReferralDto", () => {
  describe("驗證規則", () => {
    it("應該驗證有效的創建推薦 DTO", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("referrerId 不能為空", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "";
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("referrerId");
    });

    it('referrerType 必須是 "staff" 或 "patient"', async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "invalid";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("referrerType");
    });

    it("patientId 不能為空", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "staff";
      dto.patientId = "";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("patientId");
    });

    it("clinicId 不能為空", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("clinicId");
    });

    it("notes 是可選的", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";
      dto.notes = "推薦備註";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("應該支持 patient 類型的推薦人", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "patient-123";
      dto.referrerType = "patient";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe("字段長度驗證", () => {
    it("referrerId 應該符合長度限制", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "a".repeat(33); // 超過 32 個字符
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it("notes 可以是長文本", async () => {
      // Arrange
      const dto = new CreateReferralDto();
      dto.referrerId = "staff-123";
      dto.referrerType = "staff";
      dto.patientId = "patient-456";
      dto.clinicId = "clinic-001";
      dto.notes = "這是一個很長的推薦備註".repeat(100);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });
});
