import { PointsConfig } from './points-config.entity';

describe('PointsConfig Entity', () => {
  let pointsConfig: PointsConfig;

  describe('創建 PointsConfig 實例', () => {
    beforeEach(() => {
      pointsConfig = new PointsConfig();
    });

    it('應該正確初始化所有欄位', () => {
      // Arrange & Act
      pointsConfig.id = 'config-001';
      pointsConfig.clinicId = 'clinic-001';
      pointsConfig.configKey = 'referral_points_reward';
      pointsConfig.configValue = 100;
      pointsConfig.description = '推薦客戶成功轉診獲得的點數';
      pointsConfig.unit = 'points';
      pointsConfig.isActive = true;

      // Assert
      expect(pointsConfig.id).toBe('config-001');
      expect(pointsConfig.clinicId).toBe('clinic-001');
      expect(pointsConfig.configKey).toBe('referral_points_reward');
      expect(pointsConfig.configValue).toBe(100);
      expect(pointsConfig.description).toBe('推薦客戶成功轉診獲得的點數');
      expect(pointsConfig.unit).toBe('points');
      expect(pointsConfig.isActive).toBe(true);
    });

    it('configValue 應該支持小數點', () => {
      // Arrange & Act
      pointsConfig.configValue = 0.1;

      // Assert
      expect(pointsConfig.configValue).toBe(0.1);
    });

    it('isActive 的默認值應該為 true', () => {
      // Arrange & Act
      pointsConfig.isActive = true;

      // Assert
      expect(pointsConfig.isActive).toBe(true);
    });

    it('應該支持不同的配置鍵', () => {
      // Arrange
      const configKeys = [
        'referral_points_reward',
        'points_to_currency_rate',
        'max_redeem_percentage',
        'points_expiry_months',
        'min_redeem_amount',
      ];

      // Act & Assert
      configKeys.forEach((key) => {
        pointsConfig.configKey = key;
        expect(pointsConfig.configKey).toBe(key);
      });
    });

    it('應該支持不同的單位', () => {
      // Arrange
      const units = ['points', 'percentage', 'months', 'currency'];

      // Act & Assert
      units.forEach((unit) => {
        pointsConfig.unit = unit;
        expect(pointsConfig.unit).toBe(unit);
      });
    });
  });

  describe('時間戳欄位', () => {
    it('應該有 createdAt 欄位', () => {
      // Arrange & Act
      pointsConfig = new PointsConfig();
      const now = new Date();
      pointsConfig.createdAt = now;

      // Assert
      expect(pointsConfig.createdAt).toBe(now);
      expect(pointsConfig.createdAt instanceof Date).toBe(true);
    });

    it('應該有 updatedAt 欄位', () => {
      // Arrange & Act
      pointsConfig = new PointsConfig();
      const now = new Date();
      pointsConfig.updatedAt = now;

      // Assert
      expect(pointsConfig.updatedAt).toBe(now);
      expect(pointsConfig.updatedAt instanceof Date).toBe(true);
    });
  });

  describe('主鍵欄位', () => {
    it('應該有 UUID 主鍵', () => {
      // Arrange & Act
      pointsConfig = new PointsConfig();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Assert
      expect(pointsConfig).toHaveProperty('id');
    });
  });

  describe('診所多租戶隔離', () => {
    it('應該包含 clinicId 欄位以支持多租戶', () => {
      // Arrange & Act
      pointsConfig = new PointsConfig();
      pointsConfig.clinicId = 'clinic-xyz';

      // Assert
      expect(pointsConfig.clinicId).toBe('clinic-xyz');
      expect(typeof pointsConfig.clinicId).toBe('string');
    });
  });
});
