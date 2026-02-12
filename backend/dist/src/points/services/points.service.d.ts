import { PointsConfigService } from './points-config.service';
import { PointsTransactionService } from './points-transaction.service';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';
export declare class PointsService {
    private readonly configService;
    private readonly transactionService;
    private readonly logger;
    constructor(configService: PointsConfigService, transactionService: PointsTransactionService);
    awardPoints(customerId: string, amount: number, source: string, clinicId: string, referralId?: string, maxRetries?: number): Promise<PointsTransaction>;
    redeemPoints(customerId: string, amount: number, clinicId: string, treatmentId?: string, maxRetries?: number): Promise<PointsTransaction>;
    getBalance(customerId: string, customerType: string, clinicId: string): Promise<PointsBalance>;
    getTransactionHistory(customerId: string, customerType: string, clinicId: string, limit?: number): Promise<PointsTransaction[]>;
    private isOptimisticLockError;
    private sleep;
    private getCustomerTypeFromId;
}
