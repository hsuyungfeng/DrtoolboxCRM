import { validate } from 'class-validator';
import { RedeemPointsDto } from './redeem-points.dto';

describe('RedeemPointsDto', () => {
  describe('驗證正確的 DTO', () => {
    it('應該建立有效的基礎 DTO', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('應該允許帶有可選 treatmentId 的 DTO', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 100;
      dto.clinicId = 'clinic-001';
      dto.treatmentId = 'treat-123';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('應該允許帶有可選 notes 的 DTO', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'staff-001';
      dto.customerType = 'staff';
      dto.amount = 75;
      dto.clinicId = 'clinic-001';
      dto.notes = '用於療程折扣';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('應該允許同時包含 treatmentId 和 notes 的 DTO', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 200;
      dto.clinicId = 'clinic-001';
      dto.treatmentId = 'treat-456';
      dto.notes = '用於療程 456 的折扣';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('驗證必填欄位', () => {
    it('customerId 為必填', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerType = 'patient';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customerId');
    });

    it('customerType 為必填', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customerType');
    });

    it('amount 為必填', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
    });

    it('clinicId 為必填', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('clinicId');
    });
  });

  describe('驗證欄位類型', () => {
    it('amount 應該是數字', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 'invalid' as any;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amount')).toBe(true);
    });

    it('amount 應該是正數', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = -50; // 負數不允許
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amount')).toBe(true);
    });
  });

  describe('驗證 customerType', () => {
    it('customerType 應該支持 patient', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('customerType 應該支持 staff', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'staff-001';
      dto.customerType = 'staff';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('可選欄位', () => {
    it('treatmentId 應該是可選的', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';
      // treatmentId 未設置

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('notes 應該是可選的', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50;
      dto.clinicId = 'clinic-001';
      // notes 未設置

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('小數點支持', () => {
    it('amount 應該支持最多 2 位小數', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50.99;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('amount 超過 2 位小數應該驗證失敗', async () => {
      // Arrange
      const dto = new RedeemPointsDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 50.999;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amount')).toBe(true);
    });
  });
});
