import { Test, TestingModule } from '@nestjs/testing';
import { PointsService } from './points.service';
import { PointsConfigService } from './points-config.service';
import { PointsTransactionService } from './points-transaction.service';
import { PointsBalance } from '../entities/points-balance.entity';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PointsService', () => {
  let service: PointsService;
  let configService: jest.Mocked<PointsConfigService>;
  let transactionService: jest.Mocked<PointsTransactionService>;

  const mockClinicId = 'clinic-001';
  const mockCustomerId = 'patient-001';

  const mockBalance: Partial<PointsBalance> = {
    id: 'balance-001',
    customerId: mockCustomerId,
    customerType: 'patient',
    balance: 500,
    totalEarned: 1000,
    totalRedeemed: 500,
    clinicId: mockClinicId,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: Partial<PointsTransaction> = {
    id: 'tx-001',
    customerId: mockCustomerId,
    customerType: 'patient',
    type: 'earn_referral',
    amount: 100,
    balance: 600,
    source: 'referral',
    clinicId: mockClinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockConfigServiceObj = {
      loadConfig: jest.fn(),
      getAll: jest.fn(),
      createConfig: jest.fn(),
      updateConfig: jest.fn(),
      disableConfig: jest.fn(),
      getConfigByKey: jest.fn(),
    };

    const mockTransactionServiceObj = {
      createTransaction: jest.fn(),
      getTransactionHistory: jest.fn(),
      getBalance: jest.fn(),
      getOrCreateBalance: jest.fn(),
      updateBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        {
          provide: PointsConfigService,
          useValue: mockConfigServiceObj,
        },
        {
          provide: PointsTransactionService,
          useValue: mockTransactionServiceObj,
        },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
    configService = module.get<jest.Mocked<PointsConfigService>>(
      PointsConfigService,
    );
    transactionService =
      module.get<jest.Mocked<PointsTransactionService>>(
        PointsTransactionService,
      );
  });

  describe('awardPoints', () => {
    it('應該成功獎勵點數', async () => {
      // Arrange
      const balance = { ...mockBalance, version: 1 } as PointsBalance;
      transactionService.getOrCreateBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 600,
        totalEarned: 1100,
        version: 2,
      } as PointsBalance);
      transactionService.createTransaction.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      const result = await service.awardPoints(
        mockCustomerId,
        100,
        'referral',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(transactionService.getOrCreateBalance).toHaveBeenCalled();
      expect(transactionService.createTransaction).toHaveBeenCalled();
    });

    it('應該支持推薦 ID', async () => {
      // Arrange
      const balance = { ...mockBalance } as PointsBalance;
      transactionService.getOrCreateBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 600,
      } as PointsBalance);
      transactionService.createTransaction.mockResolvedValue(
        { ...mockTransaction, referralId: 'ref-123' } as PointsTransaction,
      );

      // Act
      await service.awardPoints(
        mockCustomerId,
        100,
        'referral',
        mockClinicId,
        'ref-123',
      );

      // Assert
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        mockCustomerId,
        'patient',
        'earn_referral',
        100,
        600,
        'referral',
        mockClinicId,
        'ref-123',
      );
    });

    it('應該在樂觀鎖衝突時自動重試', async () => {
      // Arrange
      const balance = { ...mockBalance, version: 1 } as PointsBalance;
      const error = new Error('version mismatch');

      transactionService.getOrCreateBalance.mockResolvedValue(balance);

      // 第一次失敗，第二次成功
      transactionService.updateBalance
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          ...balance,
          balance: 600,
          version: 2,
        } as PointsBalance);

      transactionService.createTransaction.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      const result = await service.awardPoints(
        mockCustomerId,
        100,
        'referral',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(transactionService.updateBalance).toHaveBeenCalledTimes(2);
    });

    it('應該在超過重試次數後拋出異常', async () => {
      // Arrange
      const balance = { ...mockBalance, version: 1 } as PointsBalance;
      const error = new Error('version mismatch');

      transactionService.getOrCreateBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockRejectedValue(error);
      transactionService.createTransaction.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act & Assert
      await expect(
        service.awardPoints(
          mockCustomerId,
          100,
          'referral',
          mockClinicId,
          undefined,
          3,
        ),
      ).rejects.toThrow();
    });

    it('應該正確計算新的餘額', async () => {
      // Arrange
      const balance = {
        ...mockBalance,
        balance: 500,
        totalEarned: 1000,
      } as PointsBalance;

      transactionService.getOrCreateBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 600, // 500 + 100
        totalEarned: 1100, // 1000 + 100
        version: 2,
      } as PointsBalance);
      transactionService.createTransaction.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      await service.awardPoints(mockCustomerId, 100, 'referral', mockClinicId);

      // Assert
      expect(transactionService.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 600,
          totalEarned: 1100,
        }),
      );
    });
  });

  describe('redeemPoints', () => {
    it('應該成功兌換點數', async () => {
      // Arrange
      const balance = { ...mockBalance } as PointsBalance;
      transactionService.getBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 450,
        totalRedeemed: 550,
        version: 2,
      } as PointsBalance);

      const redeemTx = {
        ...mockTransaction,
        type: 'redeem',
        amount: -50,
        balance: 450,
      } as PointsTransaction;
      transactionService.createTransaction.mockResolvedValue(redeemTx);

      // Act
      const result = await service.redeemPoints(
        mockCustomerId,
        50,
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(redeemTx);
      expect(transactionService.getBalance).toHaveBeenCalled();
      expect(transactionService.createTransaction).toHaveBeenCalled();
    });

    it('應該支持療程 ID', async () => {
      // Arrange
      const balance = { ...mockBalance } as PointsBalance;
      transactionService.getBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 450,
      } as PointsBalance);

      const redeemTx = {
        ...mockTransaction,
        type: 'redeem',
        treatmentId: 'treat-123',
      } as PointsTransaction;
      transactionService.createTransaction.mockResolvedValue(redeemTx);

      // Act
      await service.redeemPoints(mockCustomerId, 50, mockClinicId, 'treat-123');

      // Assert
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        mockCustomerId,
        'patient',
        'redeem',
        -50,
        450,
        'treatment',
        mockClinicId,
        undefined,
        'treat-123',
      );
    });

    it('應該在餘額不足時拋出異常', async () => {
      // Arrange
      const lowBalance = {
        ...mockBalance,
        balance: 30,
      } as PointsBalance;
      transactionService.getBalance.mockResolvedValue(lowBalance);

      // Act & Assert
      await expect(
        service.redeemPoints(mockCustomerId, 100, mockClinicId),
      ).rejects.toThrow();
    });

    it('應該正確計算新的餘額和統計', async () => {
      // Arrange
      const balance = {
        ...mockBalance,
        balance: 500,
        totalRedeemed: 500,
      } as PointsBalance;

      transactionService.getBalance.mockResolvedValue(balance);
      transactionService.updateBalance.mockResolvedValue({
        ...balance,
        balance: 450, // 500 - 50
        totalRedeemed: 550, // 500 + 50
        version: 2,
      } as PointsBalance);
      transactionService.createTransaction.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      await service.redeemPoints(mockCustomerId, 50, mockClinicId);

      // Assert
      expect(transactionService.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 450,
          totalRedeemed: 550,
        }),
      );
    });
  });

  describe('getBalance', () => {
    it('應該取得客戶的點數餘額', async () => {
      // Arrange
      transactionService.getBalance.mockResolvedValue(
        mockBalance as PointsBalance,
      );

      // Act
      const result = await service.getBalance(
        mockCustomerId,
        'patient',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockBalance);
      expect(transactionService.getBalance).toHaveBeenCalledWith(
        mockCustomerId,
        'patient',
        mockClinicId,
      );
    });

    it('應該在餘額不存在時拋出 NotFoundException', async () => {
      // Arrange
      transactionService.getBalance.mockRejectedValue(
        new NotFoundException('餘額不存在'),
      );

      // Act & Assert
      await expect(
        service.getBalance(mockCustomerId, 'patient', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionHistory', () => {
    it('應該取得交易歷史', async () => {
      // Arrange
      const transactions = [
        mockTransaction,
        { ...mockTransaction, id: 'tx-002', type: 'redeem' },
      ] as PointsTransaction[];

      transactionService.getTransactionHistory.mockResolvedValue(transactions);

      // Act
      const result = await service.getTransactionHistory(
        mockCustomerId,
        'patient',
        mockClinicId,
        20,
      );

      // Assert
      expect(result).toEqual(transactions);
      expect(transactionService.getTransactionHistory).toHaveBeenCalledWith(
        mockCustomerId,
        'patient',
        mockClinicId,
        20,
      );
    });

    it('應該支持自定義的限制數量', async () => {
      // Arrange
      transactionService.getTransactionHistory.mockResolvedValue([]);

      // Act
      await service.getTransactionHistory(
        mockCustomerId,
        'patient',
        mockClinicId,
        50,
      );

      // Assert
      expect(transactionService.getTransactionHistory).toHaveBeenCalledWith(
        mockCustomerId,
        'patient',
        mockClinicId,
        50,
      );
    });
  });
});
