import { validate } from "class-validator";
import { ConvertReferralDto } from "./convert-referral.dto";

describe("ConvertReferralDto", () => {
  describe("驗證規則", () => {
    it("應該驗證有效的轉化推薦 DTO", async () => {
      // Arrange
      const dto = new ConvertReferralDto();
      dto.treatmentId = "treatment-789";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("treatmentId 不能為空", async () => {
      // Arrange
      const dto = new ConvertReferralDto();
      dto.treatmentId = "";
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("treatmentId");
    });

    it("clinicId 不能為空", async () => {
      // Arrange
      const dto = new ConvertReferralDto();
      dto.treatmentId = "treatment-789";
      dto.clinicId = "";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("clinicId");
    });

    it("treatmentId 應該符合長度限制", async () => {
      // Arrange
      const dto = new ConvertReferralDto();
      dto.treatmentId = "a".repeat(33); // 超過 32 個字符
      dto.clinicId = "clinic-001";

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it("clinicId 應該符合長度限制", async () => {
      // Arrange
      const dto = new ConvertReferralDto();
      dto.treatmentId = "treatment-789";
      dto.clinicId = "a".repeat(33); // 超過 32 個字符

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
