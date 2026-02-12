"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsConfigService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const points_config_entity_1 = require("../entities/points-config.entity");
let PointsConfigService = class PointsConfigService {
    configRepository;
    constructor(configRepository) {
        this.configRepository = configRepository;
    }
    async loadConfig(configKey, clinicId) {
        const config = await this.configRepository.findOne({
            where: {
                configKey,
                clinicId,
                isActive: true,
            },
        });
        if (!config) {
            throw new common_1.NotFoundException(`配置 ${configKey} 不存在於診所 ${clinicId}`);
        }
        return config;
    }
    async getAll(clinicId) {
        return await this.configRepository.find({
            where: { clinicId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }
    async createConfig(configKey, configValue, description, unit, clinicId) {
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
    async updateConfig(configId, clinicId, updateData) {
        const config = await this.configRepository.findOne({
            where: {
                id: configId,
                clinicId,
            },
        });
        if (!config) {
            throw new common_1.NotFoundException(`配置 ${configId} 不存在或無權限訪問`);
        }
        Object.assign(config, updateData);
        return await this.configRepository.save(config);
    }
    async disableConfig(configId, clinicId) {
        const config = await this.configRepository.findOne({
            where: {
                id: configId,
                clinicId,
            },
        });
        if (!config) {
            throw new common_1.NotFoundException(`配置 ${configId} 不存在或無權限訪問`);
        }
        config.isActive = false;
        return await this.configRepository.save(config);
    }
    async getConfigByKey(configKey, clinicId) {
        const config = await this.loadConfig(configKey, clinicId);
        return config.configValue;
    }
};
exports.PointsConfigService = PointsConfigService;
exports.PointsConfigService = PointsConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(points_config_entity_1.PointsConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PointsConfigService);
//# sourceMappingURL=points-config.service.js.map