import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PointsConfigService } from './points-config.service';
import { PointsConfig } from '../entities/points-config.entity';

describe('PointsConfigService', () => {
  let service: PointsConfigService;
  let configRepo: jest.Mocked<Repository<PointsConfig>>;

  const mockClinicId = 'clinic-001';
  const mockConfig: Partial<PointsConfig> = {
    id: 'config-001',
    clinicId: mockClinicId,
    configKey: 'referral_points_reward',
    configValue: 100,
    description: '推薦客戶成功轉診獲得的點數',
    unit: 'points',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockConfigRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsConfigService,
        {
          provide: getRepositoryToken(PointsConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<PointsConfigService>(PointsConfigService);
    configRepo = module.get<jest.Mocked<Repository<PointsConfig>>>(
      getRepositoryToken(PointsConfig),
    );
  });

  describe('loadConfig', () => {
    it('應該根據 configKey 和 clinicId 取得配置', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(mockConfig as PointsConfig);

      // Act
      const result = await service.loadConfig(
        'referral_points_reward',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockConfig);
      expect(configRepo.findOne).toHaveBeenCalledWith({
        where: {
          configKey: 'referral_points_reward',
          clinicId: mockClinicId,
          isActive: true,
        },
      });
    });

    it('應該在配置不存在時拋出 NotFoundException', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.loadConfig('non_existent_key', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('應該只返回 isActive 為 true 的配置', async () => {
      // Arrange
      const inactiveConfig: Partial<PointsConfig> = {
        ...mockConfig,
        isActive: false,
      };
      configRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.loadConfig('referral_points_reward', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAll', () => {
    it('應該取得診所的所有活躍配置', async () => {
      // Arrange
      const configs = [
        { ...mockConfig, configKey: 'referral_points_reward' },
        {
          ...mockConfig,
          id: 'config-002',
          configKey: 'points_to_currency_rate',
          configValue: 0.1,
        },
      ] as PointsConfig[];
      configRepo.find.mockResolvedValue(configs);

      // Act
      const result = await service.getAll(mockClinicId);

      // Assert
      expect(result).toEqual(configs);
      expect(configRepo.find).toHaveBeenCalledWith({
        where: { clinicId: mockClinicId, isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('應該返回空陣列當沒有配置時', async () => {
      // Arrange
      configRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getAll(mockClinicId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createConfig', () => {
    it('應該建立新配置', async () => {
      // Arrange
      const createDto = {
        configKey: 'max_redeem_percentage',
        configValue: 50,
        description: '最多兌現：本次交易的 50%',
        unit: 'percentage',
        clinicId: mockClinicId,
      };

      const savedConfig: Partial<PointsConfig> = {
        id: 'config-003',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      configRepo.create.mockReturnValue(savedConfig as PointsConfig);
      configRepo.save.mockResolvedValue(savedConfig as PointsConfig);

      // Act
      const result = await service.createConfig(
        createDto.configKey,
        createDto.configValue,
        createDto.description,
        createDto.unit,
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(savedConfig);
      expect(configRepo.create).toHaveBeenCalledWith({
        configKey: createDto.configKey,
        configValue: createDto.configValue,
        description: createDto.description,
        unit: createDto.unit,
        clinicId: mockClinicId,
        isActive: true,
      });
      expect(configRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('應該更新存在的配置', async () => {
      // Arrange
      const configId = 'config-001';
      const updateData = {
        configValue: 150,
        description: '更新後的描述',
      };

      configRepo.findOne.mockResolvedValue(mockConfig as PointsConfig);
      const updatedConfig = { ...mockConfig, ...updateData };
      configRepo.save.mockResolvedValue(updatedConfig as PointsConfig);

      // Act
      const result = await service.updateConfig(configId, mockClinicId, updateData);

      // Assert
      expect(result).toEqual(updatedConfig);
      expect(configRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: configId,
          clinicId: mockClinicId,
        },
      });
      expect(configRepo.save).toHaveBeenCalled();
    });

    it('應該在配置不存在時拋出 NotFoundException', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateConfig('non_existent', mockClinicId, { configValue: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('disableConfig', () => {
    it('應該停用配置', async () => {
      // Arrange
      const configId = 'config-001';
      configRepo.findOne.mockResolvedValue(mockConfig as PointsConfig);
      const disabledConfig = { ...mockConfig, isActive: false };
      configRepo.save.mockResolvedValue(disabledConfig as PointsConfig);

      // Act
      const result = await service.disableConfig(configId, mockClinicId);

      // Assert
      expect(result.isActive).toBe(false);
      expect(configRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: configId,
          clinicId: mockClinicId,
        },
      });
      expect(configRepo.save).toHaveBeenCalled();
    });

    it('應該在配置不存在時拋出 NotFoundException', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.disableConfig('non_existent', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getConfigByKey', () => {
    it('應該根據 configKey 取得配置值', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(mockConfig as PointsConfig);

      // Act
      const result = await service.getConfigByKey(
        'referral_points_reward',
        mockClinicId,
      );

      // Assert
      expect(result).toBe(mockConfig.configValue);
    });

    it('應該在配置不存在時拋出 NotFoundException', async () => {
      // Arrange
      configRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getConfigByKey('non_existent_key', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
