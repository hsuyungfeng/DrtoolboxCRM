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
var ReferralService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const referral_entity_1 = require("../entities/referral.entity");
const patient_entity_1 = require("../../patients/entities/patient.entity");
const staff_entity_1 = require("../../staff/entities/staff.entity");
const treatment_entity_1 = require("../../treatments/entities/treatment.entity");
const points_service_1 = require("../../points/services/points.service");
const points_config_service_1 = require("../../points/services/points-config.service");
let ReferralService = ReferralService_1 = class ReferralService {
    referralRepository;
    patientRepository;
    staffRepository;
    treatmentRepository;
    pointsService;
    pointsConfigService;
    logger = new common_1.Logger(ReferralService_1.name);
    constructor(referralRepository, patientRepository, staffRepository, treatmentRepository, pointsService, pointsConfigService) {
        this.referralRepository = referralRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.treatmentRepository = treatmentRepository;
        this.pointsService = pointsService;
        this.pointsConfigService = pointsConfigService;
    }
    async createReferral(createReferralDto) {
        const { referrerId, referrerType, patientId, clinicId, notes } = createReferralDto;
        const existingReferral = await this.referralRepository.findOne({
            where: {
                patientId,
                clinicId,
                status: 'pending',
            },
        });
        if (existingReferral) {
            throw new common_1.ConflictException(`患者 ${patientId} 已有一個未決推薦記錄`);
        }
        const referral = this.referralRepository.create({
            referrerId,
            referrerType,
            patientId,
            clinicId,
            referralDate: new Date(),
            status: 'pending',
            notes,
            pointsAwarded: 0,
        });
        const savedReferral = await this.referralRepository.save(referral);
        this.logger.log(`成功創建推薦記錄：${savedReferral.id}（推薦人：${referrerId}，患者：${patientId}）`);
        return savedReferral;
    }
    async getReferralsByReferrer(referrerId, referrerType, clinicId) {
        return await this.referralRepository.find({
            where: {
                referrerId,
                referrerType,
                clinicId,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async getReferralByPatient(patientId, clinicId) {
        return await this.referralRepository.findOne({
            where: {
                patientId,
                clinicId,
            },
        });
    }
    async convertReferral(referralId, treatmentId, clinicId) {
        const referral = await this.referralRepository.findOne({
            where: {
                id: referralId,
                clinicId,
            },
            relations: ['patient'],
        });
        if (!referral) {
            throw new common_1.NotFoundException(`推薦記錄 ${referralId} 不存在`);
        }
        if (referral.status !== 'pending') {
            throw new common_1.BadRequestException(`推薦記錄已處於 "${referral.status}" 狀態，無法再次轉化`);
        }
        const existingTreatmentCount = await this.treatmentRepository.count({
            where: [
                {
                    patientId: referral.patientId,
                    clinicId,
                    status: 'completed',
                },
                {
                    patientId: referral.patientId,
                    clinicId,
                    status: 'in_progress',
                },
            ],
        });
        if (existingTreatmentCount > 0) {
            throw new common_1.BadRequestException(`患者 ${referral.patientId} 已有其他療程，此推薦不符合首次療程條件`);
        }
        const rewardPoints = await this.pointsConfigService.getConfigByKey('referral_points_reward', clinicId);
        await this.validateReferrer(referral.referrerId, referral.referrerType, clinicId);
        try {
            await this.pointsService.awardPoints(referral.referrerId, rewardPoints, 'referral', clinicId, referralId);
        }
        catch (error) {
            this.logger.error(`獎勵推薦人點數失敗：${error.message}`);
            throw new common_1.BadRequestException(`無法獎勵推薦人點數：${error.message}`);
        }
        referral.status = 'converted';
        referral.firstTreatmentId = treatmentId;
        referral.firstTreatmentDate = new Date();
        referral.pointsAwarded = rewardPoints;
        const savedReferral = await this.referralRepository.save(referral);
        this.logger.log(`成功轉化推薦記錄：${referralId}（推薦人：${referral.referrerId}，獎勵：${rewardPoints} 點）`);
        return savedReferral;
    }
    async getReferralStats(clinicId) {
        const totalReferrals = await this.referralRepository.count({
            where: { clinicId },
        });
        const referrals = await this.referralRepository.find({
            where: { clinicId },
        });
        const convertedCount = referrals.filter((r) => r.status === 'converted').length;
        const pendingCount = referrals.filter((r) => r.status === 'pending').length;
        const cancelledCount = referrals.filter((r) => r.status === 'cancelled').length;
        const conversionRate = totalReferrals > 0 ? (convertedCount / totalReferrals) * 100 : 0;
        const totalPointsAwarded = referrals.reduce((sum, r) => sum + Number(r.pointsAwarded), 0);
        return {
            totalReferrals,
            convertedCount,
            pendingCount,
            cancelledCount,
            conversionRate,
            totalPointsAwarded,
        };
    }
    async deleteReferral(referralId, clinicId) {
        const referral = await this.referralRepository.findOne({
            where: {
                id: referralId,
                clinicId,
            },
        });
        if (!referral) {
            throw new common_1.NotFoundException(`推薦記錄 ${referralId} 不存在`);
        }
        referral.status = 'cancelled';
        const savedReferral = await this.referralRepository.save(referral);
        this.logger.log(`成功取消推薦記錄：${referralId}`);
        return savedReferral;
    }
    async validateReferrer(referrerId, referrerType, clinicId) {
        if (referrerType === 'staff') {
            const staff = await this.staffRepository.findOne({
                where: {
                    id: referrerId,
                    clinicId,
                },
            });
            if (!staff) {
                throw new common_1.NotFoundException(`員工推薦人 ${referrerId} 不存在`);
            }
            if (!staff.canBeReferrer) {
                throw new common_1.BadRequestException(`員工 ${referrerId} 無權作為推薦人`);
            }
            if (staff.status !== 'active') {
                throw new common_1.BadRequestException(`員工 ${referrerId} 狀態非活躍`);
            }
        }
        else if (referrerType === 'patient') {
            const patient = await this.patientRepository.findOne({
                where: {
                    id: referrerId,
                    clinicId,
                },
            });
            if (!patient) {
                throw new common_1.NotFoundException(`患者推薦人 ${referrerId} 不存在`);
            }
            if (patient.status !== 'active') {
                throw new common_1.BadRequestException(`患者 ${referrerId} 狀態非活躍`);
            }
        }
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = ReferralService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __param(1, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __param(2, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __param(3, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        points_service_1.PointsService,
        points_config_service_1.PointsConfigService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map