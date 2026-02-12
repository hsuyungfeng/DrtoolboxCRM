import { Repository } from 'typeorm';
import { PointsConfig } from '../entities/points-config.entity';
export declare class PointsConfigService {
    private configRepository;
    constructor(configRepository: Repository<PointsConfig>);
    loadConfig(configKey: string, clinicId: string): Promise<PointsConfig>;
    getAll(clinicId: string): Promise<PointsConfig[]>;
    createConfig(configKey: string, configValue: number, description: string, unit: string, clinicId: string): Promise<PointsConfig>;
    updateConfig(configId: string, clinicId: string, updateData: Partial<PointsConfig>): Promise<PointsConfig>;
    disableConfig(configId: string, clinicId: string): Promise<PointsConfig>;
    getConfigByKey(configKey: string, clinicId: string): Promise<number>;
}
