import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointsConfig } from '../entities/points-config.entity';

@Injectable()
export class PointsConfigService {
  constructor(
    @InjectRepository(PointsConfig)
    private configRepository: Repository<PointsConfig>,
  ) {}

  /**
   * 根據配置鍵取得診所的配置
   */
  async loadConfig(configKey: string, clinicId: string): Promise<PointsConfig> {
    const config = await this.configRepository.findOne({
      where: {
        configKey,
        clinicId,
        isActive: true,
      },
    });

    if (!config) {
      throw new NotFoundException(
        `配置 ${configKey} 不存在於診所 ${clinicId}`,
      );
    }

    return config;
  }

  /**
   * 取得診所的所有活躍配置
   */
  async getAll(clinicId: string): Promise<PointsConfig[]> {
    return await this.configRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 建立新配置
   */
  async createConfig(
    configKey: string,
    configValue: number,
    description: string,
    unit: string,
    clinicId: string,
  ): Promise<PointsConfig> {
    const config = this.configRepository.create({
      configKey,
      configValue,
      description,
      unit,
      clinicId,
      isActive: true,
    });

    return await this.configRepository.save(config);
  }

  /**
   * 更新配置
   */
  async updateConfig(
    configId: string,
    updateData: Partial<PointsConfig>,
  ): Promise<PointsConfig> {
    const config = await this.configRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`配置 ${configId} 不存在`);
    }

    Object.assign(config, updateData);
    return await this.configRepository.save(config);
  }

  /**
   * 停用配置
   */
  async disableConfig(configId: string): Promise<PointsConfig> {
    const config = await this.configRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`配置 ${configId} 不存在`);
    }

    config.isActive = false;
    return await this.configRepository.save(config);
  }

  /**
   * 根據配置鍵取得配置值
   */
  async getConfigByKey(configKey: string, clinicId: string): Promise<number> {
    const config = await this.loadConfig(configKey, clinicId);
    return config.configValue;
  }
}
