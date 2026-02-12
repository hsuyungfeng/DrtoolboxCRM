import { validate } from 'class-validator';
import { CreatePointsTransactionDto } from './create-points-transaction.dto';

describe('CreatePointsTransactionDto', () => {
  describe('驗證正確的 DTO', () => {
    it('應該建立有效的 DTO', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('應該允許帶有可選欄位的 DTO', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'staff-001';
      dto.customerType = 'staff';
      dto.type = 'redeem';
      dto.amount = -50;
      dto.source = 'treatment';
      dto.clinicId = 'clinic-001';
      dto.referralId = 'ref-123';
      dto.treatmentId = 'treat-456';
      dto.notes = '點數兌換備註';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('驗證必填欄位', () => {
    it('customerId 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customerId');
    });

    it('customerType 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customerType');
    });

    it('type 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });

    it('amount 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('amount');
    });

    it('source 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('source');
    });

    it('clinicId 為必填', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';

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
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 'invalid' as any;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'amount')).toBe(true);
    });

    it('customerId 應該是字符串', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 123 as any;
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('可選欄位', () => {
    it('referralId 應該是可選的', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'earn_referral';
      dto.amount = 100;
      dto.source = 'referral';
      dto.clinicId = 'clinic-001';
      // referralId 未設置

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('treatmentId 應該是可選的', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'redeem';
      dto.amount = -50;
      dto.source = 'treatment';
      dto.clinicId = 'clinic-001';
      // treatmentId 未設置

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('notes 應該是可選的', async () => {
      // Arrange
      const dto = new CreatePointsTransactionDto();
      dto.customerId = 'patient-001';
      dto.customerType = 'patient';
      dto.type = 'manual_adjust';
      dto.amount = -100;
      dto.source = 'manual';
      dto.clinicId = 'clinic-001';
      // notes 未設置

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });
});
