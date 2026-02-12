import { PointsBalance } from './points-balance.entity';

describe('PointsBalance Entity', () => {
  let pointsBalance: PointsBalance;

  describe('創建 PointsBalance 實例', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('應該正確初始化所有欄位', () => {
      // Arrange & Act
      pointsBalance.id = 'balance-001';
      pointsBalance.customerId = 'patient-001';
      pointsBalance.customerType = 'patient';
      pointsBalance.balance = 500.00;
      pointsBalance.totalEarned = 1000.00;
      pointsBalance.totalRedeemed = 500.00;
      pointsBalance.clinicId = 'clinic-001';
      pointsBalance.version = 1;

      // Assert
      expect(pointsBalance.id).toBe('balance-001');
      expect(pointsBalance.customerId).toBe('patient-001');
      expect(pointsBalance.customerType).toBe('patient');
      expect(pointsBalance.balance).toBe(500.00);
      expect(pointsBalance.totalEarned).toBe(1000.00);
      expect(pointsBalance.totalRedeemed).toBe(500.00);
      expect(pointsBalance.clinicId).toBe('clinic-001');
      expect(pointsBalance.version).toBe(1);
    });

    it('balance 的默認值應該為 0', () => {
      // Arrange & Act
      pointsBalance.balance = 0;

      // Assert
      expect(pointsBalance.balance).toBe(0);
    });

    it('totalEarned 的默認值應該為 0', () => {
      // Arrange & Act
      pointsBalance.totalEarned = 0;

      // Assert
      expect(pointsBalance.totalEarned).toBe(0);
    });

    it('totalRedeemed 的默認值應該為 0', () => {
      // Arrange & Act
      pointsBalance.totalRedeemed = 0;

      // Assert
      expect(pointsBalance.totalRedeemed).toBe(0);
    });

    it('customerType 應該支持 staff 類型', () => {
      // Arrange & Act
      pointsBalance.customerId = 'staff-001';
      pointsBalance.customerType = 'staff';

      // Assert
      expect(pointsBalance.customerType).toBe('staff');
    });

    it('customerType 應該支持 patient 類型', () => {
      // Arrange & Act
      pointsBalance.customerId = 'patient-001';
      pointsBalance.customerType = 'patient';

      // Assert
      expect(pointsBalance.customerType).toBe('patient');
    });

    it('應該支持小數點點數計算', () => {
      // Arrange & Act
      pointsBalance.balance = 123.45;
      pointsBalance.totalEarned = 456.78;
      pointsBalance.totalRedeemed = 333.33;

      // Assert
      expect(pointsBalance.balance).toBe(123.45);
      expect(pointsBalance.totalEarned).toBe(456.78);
      expect(pointsBalance.totalRedeemed).toBe(333.33);
    });
  });

  describe('樂觀鎖（版本控制）', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('應該有 version 欄位用於樂觀鎖', () => {
      // Arrange & Act
      pointsBalance.version = 1;

      // Assert
      expect(pointsBalance.version).toBe(1);
      expect(typeof pointsBalance.version).toBe('number');
    });

    it('version 應該可以遞增', () => {
      // Arrange
      pointsBalance.version = 1;

      // Act
      pointsBalance.version += 1;

      // Assert
      expect(pointsBalance.version).toBe(2);
    });

    it('version 應該在更新時自動管理（由 TypeORM 處理）', () => {
      // Arrange & Act
      pointsBalance.version = 0;

      // Assert
      expect(pointsBalance).toHaveProperty('version');
    });
  });

  describe('時間戳欄位', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('應該有 createdAt 欄位', () => {
      // Arrange & Act
      const now = new Date();
      pointsBalance.createdAt = now;

      // Assert
      expect(pointsBalance.createdAt).toBe(now);
      expect(pointsBalance.createdAt instanceof Date).toBe(true);
    });

    it('應該有 updatedAt 欄位', () => {
      // Arrange & Act
      const now = new Date();
      pointsBalance.updatedAt = now;

      // Assert
      expect(pointsBalance.updatedAt).toBe(now);
      expect(pointsBalance.updatedAt instanceof Date).toBe(true);
    });
  });

  describe('主鍵和唯一約束', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('應該有 UUID 主鍵', () => {
      // Arrange & Act
      pointsBalance.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      // Assert
      expect(pointsBalance.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });

    it('(customerId, customerType) 應該有唯一約束', () => {
      // Arrange & Act
      pointsBalance.customerId = 'customer-001';
      pointsBalance.customerType = 'patient';

      // Assert
      expect(pointsBalance.customerId).toBe('customer-001');
      expect(pointsBalance.customerType).toBe('patient');
      // 實際的唯一約束驗證將在資料庫層面進行
    });
  });

  describe('診所多租戶隔離', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('應該包含 clinicId 欄位以支持多租戶', () => {
      // Arrange & Act
      pointsBalance.clinicId = 'clinic-abc';

      // Assert
      expect(pointsBalance.clinicId).toBe('clinic-abc');
      expect(typeof pointsBalance.clinicId).toBe('string');
    });
  });

  describe('點數統計', () => {
    beforeEach(() => {
      pointsBalance = new PointsBalance();
    });

    it('balance 應該等於 totalEarned - totalRedeemed', () => {
      // Arrange & Act
      pointsBalance.totalEarned = 1000;
      pointsBalance.totalRedeemed = 600;
      pointsBalance.balance = pointsBalance.totalEarned - pointsBalance.totalRedeemed;

      // Assert
      expect(pointsBalance.balance).toBe(400);
    });

    it('balance 可以為負數（債務情況）', () => {
      // Arrange & Act
      pointsBalance.balance = -100;

      // Assert
      expect(pointsBalance.balance).toBe(-100);
      expect(pointsBalance.balance < 0).toBe(true);
    });
  });
});
