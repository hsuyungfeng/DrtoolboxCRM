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
var PointsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const points_config_service_1 = require("./points-config.service");
const points_transaction_service_1 = require("./points-transaction.service");
let PointsService = PointsService_1 = class PointsService {
    configService;
    transactionService;
    logger = new common_1.Logger(PointsService_1.name);
    constructor(configService, transactionService) {
        this.configService = configService;
        this.transactionService = transactionService;
    }
    async awardPoints(customerId, amount, source, clinicId, referralId, maxRetries = 3) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('獎勵點數必須大於 0');
        }
        let lastError = new Error('Unknown error');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const balance = await this.transactionService.getOrCreateBalance(customerId, this.getCustomerTypeFromId(customerId), clinicId);
                const newBalance = Number(balance.balance) + amount;
                const newTotalEarned = Number(balance.totalEarned) + amount;
                balance.balance = newBalance;
                balance.totalEarned = newTotalEarned;
                const transactionType = this.getTransactionTypeBySource(source);
                const transaction = await this.transactionService.updateBalanceAndCreateTransaction(balance, {
                    customerId,
                    customerType: balance.customerType,
                    type: transactionType,
                    amount,
                    source,
                    clinicId,
                    referralId,
                });
                this.logger.log(`成功獎勵 ${amount} 點給 ${customerId}（嘗試 ${attempt}/${maxRetries}）`);
                return transaction;
            }
            catch (error) {
                lastError = error;
                if (this.isOptimisticLockError(error) &&
                    attempt < maxRetries) {
                    const delay = (Math.pow(2, attempt) - 1) * 100;
                    this.logger.warn(`樂觀鎖衝突，${delay}ms 後進行第 ${attempt + 1} 次重試`);
                    await this.sleep(delay);
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.ConflictException(`經過 ${maxRetries} 次重試後仍無法更新點數餘額：${lastError.message}`);
    }
    async redeemPoints(customerId, amount, clinicId, treatmentId, maxRetries = 3) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('兌換點數必須大於 0');
        }
        let lastError = new Error('Unknown error');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const latestBalance = await this.transactionService.getBalance(customerId, this.getCustomerTypeFromId(customerId), clinicId);
                if (Number(latestBalance.balance) < amount) {
                    throw new common_1.BadRequestException(`點數不足。目前餘額：${latestBalance.balance}，需要：${amount}`);
                }
                const newBalance = Number(latestBalance.balance) - amount;
                const newTotalRedeemed = Number(latestBalance.totalRedeemed) + amount;
                latestBalance.balance = newBalance;
                latestBalance.totalRedeemed = newTotalRedeemed;
                const transaction = await this.transactionService.updateBalanceAndCreateTransaction(latestBalance, {
                    customerId,
                    customerType: latestBalance.customerType,
                    type: 'redeem',
                    amount: -amount,
                    source: 'treatment',
                    clinicId,
                    treatmentId,
                });
                this.logger.log(`成功兌換 ${amount} 點 - ${customerId}（嘗試 ${attempt}/${maxRetries}）`);
                return transaction;
            }
            catch (error) {
                lastError = error;
                if (this.isOptimisticLockError(error) &&
                    attempt < maxRetries) {
                    const delay = (Math.pow(2, attempt) - 1) * 100;
                    this.logger.warn(`樂觀鎖衝突，${delay}ms 後進行第 ${attempt + 1} 次重試`);
                    await this.sleep(delay);
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.ConflictException(`經過 ${maxRetries} 次重試後仍無法兌換點數：${lastError.message}`);
    }
    async getBalance(customerId, customerType, clinicId) {
        return await this.transactionService.getBalance(customerId, customerType, clinicId);
    }
    async getTransactionHistory(customerId, customerType, clinicId, limit = 20) {
        return await this.transactionService.getTransactionHistory(customerId, customerType, clinicId, limit);
    }
    isOptimisticLockError(error) {
        if (error instanceof typeorm_1.OptimisticLockVersionMismatchError) {
            return true;
        }
        return (error.message.includes('version') ||
            error.message.includes('mismatch') ||
            error.message.includes('optimistic lock'));
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getCustomerTypeFromId(customerId) {
        if (customerId.startsWith('staff-')) {
            return 'staff';
        }
        return 'patient';
    }
    getTransactionTypeBySource(source) {
        switch (source) {
            case 'referral':
                return 'earn_referral';
            case 'treatment':
                return 'earn_treatment';
            case 'manual':
                return 'manual_adjust';
            default:
                return 'earn_referral';
        }
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = PointsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [points_config_service_1.PointsConfigService,
        points_transaction_service_1.PointsTransactionService])
], PointsService);
//# sourceMappingURL=points.service.js.map