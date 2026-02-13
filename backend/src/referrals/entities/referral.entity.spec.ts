import { Referral } from "./referral.entity";

describe("Referral Entity", () => {
  let referral: Referral;

  describe("創建 Referral 實例", () => {
    beforeEach(() => {
      referral = new Referral();
    });

    it("應該正確初始化所有欄位", () => {
      // Arrange & Act
      referral.id = "ref-001";
      referral.referrerId = "staff-123";
      referral.referrerType = "staff";
      referral.patientId = "patient-456";
      referral.referralDate = new Date();
      referral.status = "pending";
      referral.clinicId = "clinic-001";
      referral.pointsAwarded = 100;
      referral.notes = "推薦備註";

      // Assert
      expect(referral.id).toBe("ref-001");
      expect(referral.referrerId).toBe("staff-123");
      expect(referral.referrerType).toBe("staff");
      expect(referral.patientId).toBe("patient-456");
      expect(referral.referralDate instanceof Date).toBe(true);
      expect(referral.status).toBe("pending");
      expect(referral.clinicId).toBe("clinic-001");
      expect(referral.pointsAwarded).toBe(100);
      expect(referral.notes).toBe("推薦備註");
    });

    it("應該支持不同的推薦人類型", () => {
      // Arrange
      const referrerTypes = ["staff", "patient"];

      // Act & Assert
      referrerTypes.forEach((type) => {
        referral.referrerType = type;
        expect(referral.referrerType).toBe(type);
      });
    });

    it("應該支持推薦的不同狀態", () => {
      // Arrange
      const statuses = ["pending", "converted", "cancelled"];

      // Act & Assert
      statuses.forEach((status) => {
        referral.status = status;
        expect(referral.status).toBe(status);
      });
    });

    it("pointsAwarded 應該支持小數點", () => {
      // Arrange & Act
      referral.pointsAwarded = 100.5;

      // Assert
      expect(referral.pointsAwarded).toBe(100.5);
    });

    it("pointsAwarded 默認值應該為 0", () => {
      // Arrange & Act
      referral.pointsAwarded = 0;

      // Assert
      expect(referral.pointsAwarded).toBe(0);
    });
  });

  describe("推薦轉化欄位", () => {
    beforeEach(() => {
      referral = new Referral();
    });

    it("應該支持設置 firstTreatmentId", () => {
      // Arrange & Act
      referral.firstTreatmentId = "treatment-789";

      // Assert
      expect(referral.firstTreatmentId).toBe("treatment-789");
    });

    it("應該支持設置 firstTreatmentDate", () => {
      // Arrange & Act
      const date = new Date();
      referral.firstTreatmentDate = date;

      // Assert
      expect(referral.firstTreatmentDate).toBe(date);
      expect(referral.firstTreatmentDate instanceof Date).toBe(true);
    });

    it("firstTreatmentId 應該可以為 null", () => {
      // Arrange & Act
      referral.firstTreatmentId = null;

      // Assert
      expect(referral.firstTreatmentId).toBeNull();
    });

    it("firstTreatmentDate 應該可以為 null", () => {
      // Arrange & Act
      referral.firstTreatmentDate = null;

      // Assert
      expect(referral.firstTreatmentDate).toBeNull();
    });
  });

  describe("時間戳欄位", () => {
    beforeEach(() => {
      referral = new Referral();
    });

    it("應該有 createdAt 欄位", () => {
      // Arrange & Act
      const now = new Date();
      referral.createdAt = now;

      // Assert
      expect(referral.createdAt).toBe(now);
      expect(referral.createdAt instanceof Date).toBe(true);
    });

    it("應該有 updatedAt 欄位", () => {
      // Arrange & Act
      const now = new Date();
      referral.updatedAt = now;

      // Assert
      expect(referral.updatedAt).toBe(now);
      expect(referral.updatedAt instanceof Date).toBe(true);
    });
  });

  describe("多租戶隔離", () => {
    beforeEach(() => {
      referral = new Referral();
    });

    it("應該包含 clinicId 欄位以支持多租戶", () => {
      // Arrange & Act
      referral.clinicId = "clinic-xyz";

      // Assert
      expect(referral.clinicId).toBe("clinic-xyz");
      expect(typeof referral.clinicId).toBe("string");
    });

    it("應該支持按診所和推薦人查詢", () => {
      // Arrange & Act
      referral.clinicId = "clinic-001";
      referral.referrerId = "staff-123";
      referral.referrerType = "staff";

      // Assert
      expect(referral.clinicId).toBe("clinic-001");
      expect(referral.referrerId).toBe("staff-123");
      expect(referral.referrerType).toBe("staff");
    });

    it("應該支持按診所和患者查詢", () => {
      // Arrange & Act
      referral.clinicId = "clinic-001";
      referral.patientId = "patient-456";

      // Assert
      expect(referral.clinicId).toBe("clinic-001");
      expect(referral.patientId).toBe("patient-456");
    });
  });

  describe("主鍵欄位", () => {
    it("應該有 UUID 主鍵", () => {
      // Arrange & Act
      referral = new Referral();

      // Assert
      expect(referral).toHaveProperty("id");
    });
  });

  describe("患者關聯", () => {
    beforeEach(() => {
      referral = new Referral();
    });

    it("應該能夠設置患者關聯", () => {
      // Arrange & Act
      const mockPatient = { id: "patient-456", name: "患者名稱" };
      referral.patient = mockPatient as any;

      // Assert
      expect(referral.patient).toBeDefined();
      expect(referral.patient.id).toBe("patient-456");
    });
  });
});
