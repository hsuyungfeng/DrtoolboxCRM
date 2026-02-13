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
exports.RevenueAdjustmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const revenue_adjustment_entity_1 = require("../entities/revenue-adjustment.entity");
const revenue_record_entity_1 = require("../entities/revenue-record.entity");
const staff_service_1 = require("../../staff/services/staff.service");
let RevenueAdjustmentService = class RevenueAdjustmentService {
    adjustmentRepo;
    recordRepo;
    dataSource;
    staffService;
    constructor(adjustmentRepo, recordRepo, dataSource, staffService) {
        this.adjustmentRepo = adjustmentRepo;
        this.recordRepo = recordRepo;
        this.dataSource = dataSource;
        this.staffService = staffService;
    }
    async create(createDto, clinicId) {
        if (createDto.clinicId !== clinicId) {
            throw new common_1.ForbiddenException("診所 ID 不匹配");
        }
        const revenueRecord = await this.recordRepo.findOne({
            where: { id: createDto.revenueRecordId, clinicId },
        });
        if (!revenueRecord) {
            throw new common_1.NotFoundException("分潤記錄不存在");
        }
        if (revenueRecord.lockedAt) {
            throw new common_1.BadRequestException("分潤記錄已鎖定，無法調整");
        }
        const newTotal = revenueRecord.amount + createDto.adjustmentAmount;
        if (newTotal < 0) {
            throw new common_1.BadRequestException("調整後分潤金額不能為負數");
        }
        const adjustment = this.adjustmentRepo.create({
            ...createDto,
            clinicId,
        });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction("SERIALIZABLE");
        try {
            const savedAdjustment = await queryRunner.manager.save(adjustment);
            revenueRecord.amount = newTotal;
            revenueRecord.status = "adjusted";
            await queryRunner.manager.save(revenueRecord);
            await queryRunner.commitTransaction();
            return savedAdjustment;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw new common_1.BadRequestException(`創建調整失敗: ${error.message}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(clinicId, filters) {
        const queryBuilder = this.adjustmentRepo
            .createQueryBuilder("adjustment")
            .where("adjustment.clinicId = :clinicId", { clinicId })
            .leftJoinAndSelect("adjustment.revenueRecord", "revenueRecord")
            .orderBy("adjustment.createdAt", "DESC");
        if (filters?.revenueRecordId) {
            queryBuilder.andWhere("adjustment.revenueRecordId = :revenueRecordId", {
                revenueRecordId: filters.revenueRecordId,
            });
        }
        if (filters?.createdBy) {
            queryBuilder.andWhere("adjustment.createdBy = :createdBy", {
                createdBy: filters.createdBy,
            });
        }
        if (filters?.startDate) {
            queryBuilder.andWhere("adjustment.createdAt >= :startDate", {
                startDate: filters.startDate,
            });
        }
        if (filters?.endDate) {
            queryBuilder.andWhere("adjustment.createdAt <= :endDate", {
                endDate: filters.endDate,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id, clinicId) {
        const adjustment = await this.adjustmentRepo.findOne({
            where: { id, clinicId },
            relations: ["revenueRecord"],
        });
        if (!adjustment) {
            throw new common_1.NotFoundException("分潤調整記錄不存在");
        }
        return adjustment;
    }
    async update(id, updateDto, clinicId) {
        const adjustment = await this.findOne(id, clinicId);
        if (updateDto.adjustmentAmount !== undefined) {
            throw new common_1.BadRequestException("不允許直接修改調整金額，請創建新的調整記錄");
        }
        if (updateDto.reviewStatus) {
            adjustment.reviewStatus = updateDto.reviewStatus;
        }
        if (updateDto.reviewNotes) {
            adjustment.reviewNotes = updateDto.reviewNotes;
        }
        if (updateDto.reviewedBy) {
            adjustment.reviewedBy = updateDto.reviewedBy;
        }
        if (updateDto.reviewedAt) {
            adjustment.reviewedAt = new Date(updateDto.reviewedAt);
        }
        if (updateDto.reason) {
            adjustment.reason = updateDto.reason;
        }
        if (updateDto.metadata) {
            adjustment.metadata = updateDto.metadata;
        }
        return this.adjustmentRepo.save(adjustment);
    }
    async remove(id, clinicId) {
        const adjustment = await this.findOne(id, clinicId);
        if (adjustment.reviewStatus === "approved") {
            throw new common_1.BadRequestException("已審核通過的調整記錄不能刪除");
        }
        const revenueRecord = await this.recordRepo.findOne({
            where: { id: adjustment.revenueRecordId, clinicId },
        });
        if (revenueRecord) {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction("SERIALIZABLE");
            try {
                revenueRecord.amount -= adjustment.adjustmentAmount;
                const adjustmentCount = await this.adjustmentRepo.count({
                    where: { revenueRecordId: adjustment.revenueRecordId, clinicId },
                });
                if (adjustmentCount === 1) {
                    revenueRecord.status = "calculated";
                }
                await queryRunner.manager.save(revenueRecord);
                await queryRunner.manager.remove(adjustment);
                await queryRunner.commitTransaction();
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException(`刪除調整失敗: ${error.message}`);
            }
            finally {
                await queryRunner.release();
            }
        }
        else {
            await this.adjustmentRepo.remove(adjustment);
        }
    }
    async review(id, clinicId, reviewData) {
        const adjustment = await this.findOne(id, clinicId);
        if (adjustment.reviewStatus) {
            throw new common_1.BadRequestException("此調整記錄已經審核過");
        }
        adjustment.reviewStatus = reviewData.status;
        if (reviewData.notes !== undefined) {
            adjustment.reviewNotes = reviewData.notes;
        }
        adjustment.reviewedBy = reviewData.reviewedBy;
        adjustment.reviewedAt = new Date();
        return this.adjustmentRepo.save(adjustment);
    }
    async findByRevenueRecordId(revenueRecordId, clinicId) {
        return this.adjustmentRepo.find({
            where: { revenueRecordId, clinicId },
            order: { createdAt: "DESC" },
            relations: ["revenueRecord"],
        });
    }
    async getTotalAdjustmentAmount(revenueRecordId, clinicId) {
        const result = await this.adjustmentRepo
            .createQueryBuilder("adjustment")
            .select("SUM(adjustment.adjustmentAmount)", "total")
            .where("adjustment.revenueRecordId = :revenueRecordId", {
            revenueRecordId,
        })
            .andWhere("adjustment.clinicId = :clinicId", { clinicId })
            .andWhere("adjustment.reviewStatus = :status", { status: "approved" })
            .getRawOne();
        return parseFloat(result.total) || 0;
    }
};
exports.RevenueAdjustmentService = RevenueAdjustmentService;
exports.RevenueAdjustmentService = RevenueAdjustmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(revenue_adjustment_entity_1.RevenueAdjustment)),
    __param(1, (0, typeorm_1.InjectRepository)(revenue_record_entity_1.RevenueRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        staff_service_1.StaffService])
], RevenueAdjustmentService);
//# sourceMappingURL=revenue-adjustment.service.js.map