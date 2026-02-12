import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PointsTransactionService } from './points-transaction.service';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';

describe('PointsTransactionService', () => {
  let service: PointsTransactionService;
  let txRepo: jest.Mocked<Repository<PointsTransaction>>;
  let balanceRepo: jest.Mocked<Repository<PointsBalance>>;

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
    const mockTxRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockBalanceRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          save: jest.fn(),
          create: jest.fn(),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsTransactionService,
        {
          provide: getRepositoryToken(PointsTransaction),
          useValue: mockTxRepository,
        },
        {
          provide: getRepositoryToken(PointsBalance),
          useValue: mockBalanceRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PointsTransactionService>(PointsTransactionService);
    txRepo = module.get<jest.Mocked<Repository<PointsTransaction>>>(
      getRepositoryToken(PointsTransaction),
    );
    balanceRepo = module.get<jest.Mocked<Repository<PointsBalance>>>(
      getRepositoryToken(PointsBalance),
    );
  });

  describe('createTransaction', () => {
    it('應該建立新交易記錄', async () => {
      // Arrange
      const txData = {
        customerId: mockCustomerId,
        customerType: 'patient' as const,
        type: 'earn_referral',
        amount: 100,
        balance: 600,
        source: 'referral',
        clinicId: mockClinicId,
      };

      txRepo.create.mockReturnValue(mockTransaction as PointsTransaction);
      txRepo.save.mockResolvedValue(mockTransaction as PointsTransaction);

      // Act
      const result = await service.createTransaction(
        txData.customerId,
        txData.customerType,
        txData.type,
        txData.amount,
        txData.balance,
        txData.source,
        txData.clinicId,
      );

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(txRepo.create).toHaveBeenCalledWith(txData);
      expect(txRepo.save).toHaveBeenCalled();
    });

    it('應該允許可選的 referralId', async () => {
      // Arrange
      const txData = {
        customerId: mockCustomerId,
        customerType: 'staff' as const,
        type: 'earn_referral',
        amount: 100,
        balance: 200,
        source: 'referral',
        clinicId: mockClinicId,
        referralId: 'ref-123',
      };

      const txWithReferral = { ...mockTransaction, ...txData };
      txRepo.create.mockReturnValue(txWithReferral as PointsTransaction);
      txRepo.save.mockResolvedValue(txWithReferral as PointsTransaction);

      // Act
      const result = await service.createTransaction(
        txData.customerId,
        txData.customerType,
        txData.type,
        txData.amount,
        txData.balance,
        txData.source,
        txData.clinicId,
        txData.referralId,
      );

      // Assert
      expect(result.referralId).toBe('ref-123');
    });
  });

  describe('getTransactionHistory', () => {
    it('應該取得客戶的交易歷史', async () => {
      // Arrange
      const transactions = [
        mockTransaction,
        { ...mockTransaction, id: 'tx-002', type: 'redeem', amount: -50 },
      ] as PointsTransaction[];

      txRepo.find.mockResolvedValue(transactions);

      // Act
      const result = await service.getTransactionHistory(
        mockCustomerId,
        'patient',
        mockClinicId,
        20,
      );

      // Assert
      expect(result).toEqual(transactions);
      expect(txRepo.find).toHaveBeenCalledWith({
        where: {
          customerId: mockCustomerId,
          customerType: 'patient',
          clinicId: mockClinicId,
        },
        order: { createdAt: 'DESC' },
        take: 20,
      });
    });

    it('應該支持自定義的限制數量', async () => {
      // Arrange
      txRepo.find.mockResolvedValue([]);

      // Act
      await service.getTransactionHistory(mockCustomerId, 'patient', mockClinicId, 50);

      // Assert
      expect(txRepo.find).toHaveBeenCalledWith({
        where: {
          customerId: mockCustomerId,
          customerType: 'patient',
          clinicId: mockClinicId,
        },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('應該返回空陣列當沒有交易時', async () => {
      // Arrange
      txRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.getTransactionHistory(
        mockCustomerId,
        'patient',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getBalance', () => {
    it('應該取得客戶的點數餘額', async () => {
      // Arrange
      balanceRepo.findOne.mockResolvedValue(mockBalance as PointsBalance);

      // Act
      const result = await service.getBalance(
        mockCustomerId,
        'patient',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockBalance);
      expect(balanceRepo.findOne).toHaveBeenCalledWith({
        where: {
          customerId: mockCustomerId,
          customerType: 'patient',
          clinicId: mockClinicId,
        },
      });
    });

    it('應該在餘額不存在時拋出 NotFoundException', async () => {
      // Arrange
      balanceRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getBalance(mockCustomerId, 'patient', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrCreateBalance', () => {
    it('應該取得存在的餘額記錄', async () => {
      // Arrange
      balanceRepo.findOne.mockResolvedValue(mockBalance as PointsBalance);

      // Act
      const result = await service.getOrCreateBalance(
        mockCustomerId,
        'patient',
        mockClinicId,
      );

      // Assert
      expect(result).toEqual(mockBalance);
    });

    it('應該在不存在時建立新的餘額記錄', async () => {
      // Arrange
      balanceRepo.findOne.mockResolvedValueOnce(null);
      const newBalance: Partial<PointsBalance> = {
        customerId: mockCustomerId,
        customerType: 'patient',
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        clinicId: mockClinicId,
        version: 0,
      };
      balanceRepo.create.mockReturnValue(newBalance as PointsBalance);
      balanceRepo.save.mockResolvedValue(newBalance as PointsBalance);

      // Act
      const result = await service.getOrCreateBalance(
        mockCustomerId,
        'patient',
        mockClinicId,
      );

      // Assert
      expect(result.balance).toBe(0);
      expect(balanceRepo.create).toHaveBeenCalled();
      expect(balanceRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    it('應該更新並保存餘額記錄', async () => {
      // Arrange
      const updatedBalance = {
        ...mockBalance,
        balance: 600,
        totalEarned: 1100,
        version: 2,
      } as PointsBalance;

      balanceRepo.save.mockResolvedValue(updatedBalance);

      // Act
      const result = await service.updateBalance(
        updatedBalance as PointsBalance,
      );

      // Assert
      expect(result).toEqual(updatedBalance);
      expect(balanceRepo.save).toHaveBeenCalledWith(updatedBalance);
    });

    it('應該在樂觀鎖衝突時拋出 ConflictException', async () => {
      // Arrange
      const balanceWithConflict = mockBalance as PointsBalance;
      const error = new Error('version mismatch');
      balanceRepo.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.updateBalance(balanceWithConflict),
      ).rejects.toThrow();
    });
  });
});
