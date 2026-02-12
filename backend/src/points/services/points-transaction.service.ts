import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';

@Injectable()
export class PointsTransactionService {
  constructor(
    @InjectRepository(PointsTransaction)
    private transactionRepository: Repository<PointsTransaction>,
    @InjectRepository(PointsBalance)
    private balanceRepository: Repository<PointsBalance>,
  ) {}

  /**
   * 建立新交易記錄
   */
  async createTransaction(
    customerId: string,
    customerType: string,
    type: string,
    amount: number,
    balance: number,
    source: string,
    clinicId: string,
    referralId?: string,
    treatmentId?: string,
    notes?: string,
  ): Promise<PointsTransaction> {
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

  /**
   * 取得客戶的交易歷史
   */
  async getTransactionHistory(
    customerId: string,
    customerType: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<PointsTransaction[]> {
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

  /**
   * 取得客戶的點數餘額
   */
  async getBalance(
    customerId: string,
    customerType: string,
    clinicId: string,
  ): Promise<PointsBalance> {
    const balance = await this.balanceRepository.findOne({
      where: {
        customerId,
        customerType,
        clinicId,
      },
    });

    if (!balance) {
      throw new NotFoundException(
        `點數餘額不存在 - 客戶 ${customerId}`,
      );
    }

    return balance;
  }

  /**
   * 取得或建立點數餘額記錄
   */
  async getOrCreateBalance(
    customerId: string,
    customerType: string,
    clinicId: string,
  ): Promise<PointsBalance> {
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

  /**
   * 更新餘額（處理樂觀鎖）
   */
  async updateBalance(balance: PointsBalance): Promise<PointsBalance> {
    return await this.balanceRepository.save(balance);
  }
}
