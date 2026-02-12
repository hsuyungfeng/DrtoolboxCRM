import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PointsConfigService } from './points-config.service';
import { PointsTransactionService } from './points-transaction.service';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly configService: PointsConfigService,
    private readonly transactionService: PointsTransactionService,
  ) {}

  /**
   * 獎勵點數（帶自動重試邏輯）
   * @param customerId 客戶 ID
   * @param amount 點數金額
   * @param source 來源
   * @param clinicId 診所 ID
   * @param referralId 推薦 ID（可選）
   * @param maxRetries 最大重試次數（默認 3）
   */
  async awardPoints(
    customerId: string,
    amount: number,
    source: string,
    clinicId: string,
    referralId?: string,
    maxRetries: number = 3,
  ): Promise<PointsTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('獎勵點數必須大於 0');
    }

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 1. 取得或建立點數餘額
        const balance = await this.transactionService.getOrCreateBalance(
          customerId,
          this.getCustomerTypeFromId(customerId),
          clinicId,
        );

        // 2. 計算新的餘額
        const newBalance = Number(balance.balance) + amount;
        const newTotalEarned = Number(balance.totalEarned) + amount;

        // 3. 更新點數餘額（處理樂觀鎖）
        balance.balance = newBalance;
        balance.totalEarned = newTotalEarned;

        const updatedBalance = await this.transactionService.updateBalance(
          balance,
        );

        // 4. 建立交易記錄
        const transaction = await this.transactionService.createTransaction(
          customerId,
          balance.customerType,
          'earn_referral',
          amount,
          updatedBalance.balance,
          source,
          clinicId,
          referralId,
        );

        this.logger.log(
          `成功獎勵 ${amount} 點給 ${customerId}（嘗試 ${attempt}/${maxRetries}）`,
        );

        return transaction;
      } catch (error) {
        lastError = error as Error;
        // 檢查是否是樂觀鎖衝突
        if (
          this.isOptimisticLockError(error as Error) &&
          attempt < maxRetries
        ) {
          // 指數退避：等待 (2^attempt - 1) * 100ms
          const delay = (Math.pow(2, attempt) - 1) * 100;
          this.logger.warn(
            `樂觀鎖衝突，${delay}ms 後進行第 ${attempt + 1} 次重試`,
          );
          await this.sleep(delay);
          continue;
        }

        // 其他錯誤直接拋出
        throw error;
      }
    }

    // 超過最大重試次數
    throw new ConflictException(
      `經過 ${maxRetries} 次重試後仍無法更新點數餘額：${lastError.message}`,
    );
  }

  /**
   * 兌換點數（帶自動重試邏輯）
   * @param customerId 客戶 ID
   * @param amount 兌換點數（應為正數）
   * @param clinicId 診所 ID
   * @param treatmentId 療程 ID（可選）
   * @param maxRetries 最大重試次數（默認 3）
   */
  async redeemPoints(
    customerId: string,
    amount: number,
    clinicId: string,
    treatmentId?: string,
    maxRetries: number = 3,
  ): Promise<PointsTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('兌換點數必須大於 0');
    }

    // 1. 取得餘額並驗證
    const balance = await this.transactionService.getBalance(
      customerId,
      this.getCustomerTypeFromId(customerId),
      clinicId,
    );

    if (Number(balance.balance) < amount) {
      throw new BadRequestException(
        `點數不足。目前餘額：${balance.balance}，需要：${amount}`,
      );
    }

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 2. 計算新的餘額
        const newBalance = Number(balance.balance) - amount;
        const newTotalRedeemed = Number(balance.totalRedeemed) + amount;

        // 3. 更新點數餘額（處理樂觀鎖）
        balance.balance = newBalance;
        balance.totalRedeemed = newTotalRedeemed;

        const updatedBalance = await this.transactionService.updateBalance(
          balance,
        );

        // 4. 建立交易記錄
        const transaction = await this.transactionService.createTransaction(
          customerId,
          balance.customerType,
          'redeem',
          -amount, // 負數表示扣減
          updatedBalance.balance,
          'treatment',
          clinicId,
          undefined,
          treatmentId,
        );

        this.logger.log(
          `成功兌換 ${amount} 點 - ${customerId}（嘗試 ${attempt}/${maxRetries}）`,
        );

        return transaction;
      } catch (error) {
        lastError = error as Error;
        // 檢查是否是樂觀鎖衝突
        if (
          this.isOptimisticLockError(error as Error) &&
          attempt < maxRetries
        ) {
          // 指數退避
          const delay = (Math.pow(2, attempt) - 1) * 100;
          this.logger.warn(
            `樂觀鎖衝突，${delay}ms 後進行第 ${attempt + 1} 次重試`,
          );
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      `經過 ${maxRetries} 次重試後仍無法兌換點數：${lastError.message}`,
    );
  }

  /**
   * 取得客戶的點數餘額
   */
  async getBalance(
    customerId: string,
    customerType: string,
    clinicId: string,
  ): Promise<PointsBalance> {
    return await this.transactionService.getBalance(
      customerId,
      customerType,
      clinicId,
    );
  }

  /**
   * 取得交易歷史
   */
  async getTransactionHistory(
    customerId: string,
    customerType: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<PointsTransaction[]> {
    return await this.transactionService.getTransactionHistory(
      customerId,
      customerType,
      clinicId,
      limit,
    );
  }

  /**
   * 檢查是否是樂觀鎖錯誤
   */
  private isOptimisticLockError(error: Error): boolean {
    return (
      error.message.includes('version') ||
      error.message.includes('mismatch') ||
      error.message.includes('optimistic lock')
    );
  }

  /**
   * 延遲函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 根據 ID 推斷客戶類型
   * 這是簡化實現，實際應該從 ID 前綴或其他方式判斷
   */
  private getCustomerTypeFromId(customerId: string): string {
    // 簡化邏輯：可以根據 ID 前綴判斷
    if (customerId.startsWith('staff-')) {
      return 'staff';
    }
    return 'patient';
  }
}
