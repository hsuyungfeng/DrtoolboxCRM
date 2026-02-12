import { Repository } from 'typeorm';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';
export declare class PointsTransactionService {
    private transactionRepository;
    private balanceRepository;
    constructor(transactionRepository: Repository<PointsTransaction>, balanceRepository: Repository<PointsBalance>);
    createTransaction(customerId: string, customerType: string, type: string, amount: number, balance: number, source: string, clinicId: string, referralId?: string, treatmentId?: string, notes?: string): Promise<PointsTransaction>;
    getTransactionHistory(customerId: string, customerType: string, clinicId: string, limit?: number): Promise<PointsTransaction[]>;
    getBalance(customerId: string, customerType: string, clinicId: string): Promise<PointsBalance>;
    getOrCreateBalance(customerId: string, customerType: string, clinicId: string): Promise<PointsBalance>;
    updateBalance(balance: PointsBalance): Promise<PointsBalance>;
}
