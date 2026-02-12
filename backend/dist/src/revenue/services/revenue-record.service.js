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
exports.RevenueRecordService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const revenue_record_entity_1 = require("../entities/revenue-record.entity");
const revenue_calculator_service_1 = require("./revenue-calculator.service");
let RevenueRecordService = class RevenueRecordService {
    revenueRecordRepository;
    revenueCalculatorService;
    constructor(revenueRecordRepository, revenueCalculatorService) {
        this.revenueRecordRepository = revenueRecordRepository;
        this.revenueCalculatorService = revenueCalculatorService;
    }
    async findAll(clinicId) {
        return await this.revenueRecordRepository.find({
            where: { clinicId },
            order: { calculatedAt: "DESC" },
            relations: ["treatment", "treatmentSession", "staff"],
        });
    }
    async findByTreatment(treatmentId, clinicId) {
        return await this.revenueRecordRepository.find({
            where: { treatmentId, clinicId },
            order: { calculatedAt: "DESC" },
            relations: ["treatment", "treatmentSession", "staff"],
        });
    }
    async findByStaff(staffId, clinicId) {
        return await this.revenueRecordRepository.find({
            where: { staffId, clinicId },
            order: { calculatedAt: "DESC" },
            relations: ["treatment", "treatmentSession", "staff"],
        });
    }
    async findOne(id) {
        const record = await this.revenueRecordRepository.findOne({
            where: { id },
            relations: ["treatment", "treatmentSession", "staff"],
        });
        if (!record) {
            throw new common_1.NotFoundException(`RevenueRecord with ID ${id} not found`);
        }
        return record;
    }
    async lockRecord(id) {
        const record = await this.findOne(id);
        if (record.lockedAt) {
            throw new Error(`RevenueRecord ${id} is already locked at ${record.lockedAt}`);
        }
        record.lockedAt = new Date();
        record.status = "locked";
        return await this.revenueRecordRepository.save(record);
    }
    async unlockRecord(id) {
        const record = await this.findOne(id);
        record.lockedAt = null;
        record.status = "calculated";
        return await this.revenueRecordRepository.save(record);
    }
    async markAsPaid(id, paidAt) {
        const record = await this.findOne(id);
        record.paidAt = paidAt || new Date();
        record.status = "paid";
        return await this.revenueRecordRepository.save(record);
    }
    async remove(id) {
        const record = await this.findOne(id);
        if (record.lockedAt) {
            throw new common_1.BadRequestException(`無法刪除已鎖定的分潤記錄（鎖定時間：${record.lockedAt.toISOString()}）`);
        }
        if (record.paidAt) {
            throw new common_1.BadRequestException(`無法刪除已支付的分潤記錄（支付時間：${record.paidAt.toISOString()}）`);
        }
        record.status = "cancelled";
        await this.revenueRecordRepository.save(record);
    }
    async calculateForTreatment(treatmentId, clinicId) {
        return await this.revenueCalculatorService.calculateAndCreateRecords({
            treatmentId,
            clinicId,
            calculationDate: new Date(),
        });
    }
    async calculateForSession(treatmentId, sessionId, clinicId) {
        return await this.revenueCalculatorService.calculateAndCreateRecords({
            treatmentId,
            sessionId,
            clinicId,
            calculationDate: new Date(),
        });
    }
    async getSummaryByClinic(clinicId, startDate, endDate) {
        const query = this.revenueRecordRepository
            .createQueryBuilder("record")
            .where("record.clinicId = :clinicId", { clinicId })
            .andWhere("record.status IN (:...statuses)", {
            statuses: ["calculated", "locked", "paid"],
        });
        if (startDate) {
            query.andWhere("record.calculatedAt >= :startDate", { startDate });
        }
        if (endDate) {
            query.andWhere("record.calculatedAt <= :endDate", { endDate });
        }
        const [records, totalAmount] = await Promise.all([
            query.getMany(),
            query.select("SUM(record.amount)", "total").getRawOne(),
        ]);
        const summaryByRole = await query
            .select("record.role, SUM(record.amount) as total, COUNT(*) as count")
            .groupBy("record.role")
            .getRawMany();
        const summaryByStaff = await query
            .select("record.staffId, staff.name, SUM(record.amount) as total, COUNT(*) as count")
            .leftJoin("record.staff", "staff")
            .groupBy("record.staffId, staff.name")
            .getRawMany();
        return {
            totalRecords: records.length,
            totalAmount: totalAmount.total || 0,
            byRole: summaryByRole,
            byStaff: summaryByStaff,
        };
    }
};
exports.RevenueRecordService = RevenueRecordService;
exports.RevenueRecordService = RevenueRecordService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(revenue_record_entity_1.RevenueRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        revenue_calculator_service_1.RevenueCalculatorService])
], RevenueRecordService);
//# sourceMappingURL=revenue-record.service.js.map