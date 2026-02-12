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
exports.PointsTransactionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const points_transaction_entity_1 = require("../entities/points-transaction.entity");
const points_balance_entity_1 = require("../entities/points-balance.entity");
let PointsTransactionService = class PointsTransactionService {
    transactionRepository;
    balanceRepository;
    constructor(transactionRepository, balanceRepository) {
        this.transactionRepository = transactionRepository;
        this.balanceRepository = balanceRepository;
    }
    async createTransaction(customerId, customerType, type, amount, balance, source, clinicId, referralId, treatmentId, notes) {
        const transaction = this.transactionRepository.create({
            customerId,
            customerType,
            type,
            amount,
            balance,
            source,
            clinicId,
            referralId,
            treatmentId,
            notes,
        });
        return await this.transactionRepository.save(transaction);
    }
    async getTransactionHistory(customerId, customerType, clinicId, limit = 20) {
        return await this.transactionRepository.find({
            where: {
                customerId,
                customerType,
                clinicId,
            },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getBalance(customerId, customerType, clinicId) {
        const balance = await this.balanceRepository.findOne({
            where: {
                customerId,
                customerType,
                clinicId,
            },
        });
        if (!balance) {
            throw new common_1.NotFoundException(`點數餘額不存在 - 客戶 ${customerId}`);
        }
        return balance;
    }
    async getOrCreateBalance(customerId, customerType, clinicId) {
        let balance = await this.balanceRepository.findOne({
            where: {
                customerId,
                customerType,
                clinicId,
            },
        });
        if (!balance) {
            balance = this.balanceRepository.create({
                customerId,
                customerType,
                balance: 0,
                totalEarned: 0,
                totalRedeemed: 0,
                clinicId,
                version: 0,
            });
            balance = await this.balanceRepository.save(balance);
        }
        return balance;
    }
    async updateBalance(balance) {
        return await this.balanceRepository.save(balance);
    }
};
exports.PointsTransactionService = PointsTransactionService;
exports.PointsTransactionService = PointsTransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(points_transaction_entity_1.PointsTransaction)),
    __param(1, (0, typeorm_1.InjectRepository)(points_balance_entity_1.PointsBalance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PointsTransactionService);
//# sourceMappingURL=points-transaction.service.js.map