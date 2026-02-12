import { Test, TestingModule } from '@nestjs/testing';
import { PointsController } from './points.controller';
import { PointsService } from '../services/points.service';
import { CreatePointsTransactionDto } from '../dto/create-points-transaction.dto';
import { RedeemPointsDto } from '../dto/redeem-points.dto';
import { PointsBalance } from '../entities/points-balance.entity';
import { PointsTransaction } from '../entities/points-transaction.entity';

describe('PointsController', () => {
  let controller: PointsController;
  let service: jest.Mocked<PointsService>;

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
  };

  beforeEach(async () => {
    const mockPointsService = {
      awardPoints: jest.fn(),
      redeemPoints: jest.fn(),
      getBalance: jest.fn(),
      getTransactionHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: mockPointsService,
        },
      ],
    }).compile();

    controller = module.get<PointsController>(PointsController);
    service = module.get<jest.Mocked<PointsService>>(PointsService);
  });

  describe('awardPoints', () => {
    it('應該成功獎勵點數', async () => {
      // Arrange
      const createDto = new CreatePointsTransactionDto();
      createDto.customerId = mockCustomerId;
      createDto.customerType = 'patient';
      createDto.type = 'earn_referral';
      createDto.amount = 100;
      createDto.source = 'referral';
      createDto.clinicId = mockClinicId;

      service.awardPoints.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      const result = await controller.awardPoints(createDto);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(service.awardPoints).toHaveBeenCalledWith(
        mockCustomerId,
        100,
        'referral',
        mockClinicId,
        undefined,
      );
    });

    it('應該支持推薦 ID', async () => {
      // Arrange
      const createDto = new CreatePointsTransactionDto();
      createDto.customerId = mockCustomerId;
      createDto.customerType = 'patient';
      createDto.type = 'earn_referral';
      createDto.amount = 100;
      createDto.source = 'referral';
      createDto.clinicId = mockClinicId;
      createDto.referralId = 'ref-123';

      service.awardPoints.mockResolvedValue(
        mockTransaction as PointsTransaction,
      );

      // Act
      await controller.awardPoints(createDto);

      // Assert
      expect(service.awardPoints).toHaveBeenCalledWith(
        mockCustomerId,
        100,
        'referral',
        mockClinicId,
        'ref-123',
      );
    });
  });

  describe('redeemPoints', () => {
    it('應該成功兌換點數', async () => {
      // Arrange
      const redeemDto = new RedeemPointsDto();
      redeemDto.customerId = mockCustomerId;
      redeemDto.customerType = 'patient';
      redeemDto.amount = 50;
      redeemDto.clinicId = mockClinicId;

      const redeemTx = {
        ...mockTransaction,
        type: 'redeem',
        amount: -50,
      } as PointsTransaction;

      service.redeemPoints.mockResolvedValue(redeemTx);

      // Act
      const result = await controller.redeemPoints(redeemDto);

      // Assert
      expect(result).toEqual(redeemTx);
      expect(service.redeemPoints).toHaveBeenCalledWith(
        mockCustomerId,
        50,
        mockClinicId,
        undefined,
      );
    });

    it('應該支持療程 ID', async () => {
      // Arrange
      const redeemDto = new RedeemPointsDto();
      redeemDto.customerId = mockCustomerId;
      redeemDto.customerType = 'patient';
      redeemDto.amount = 50;
      redeemDto.clinicId = mockClinicId;
      redeemDto.treatmentId = 'treat-123';

      const redeemTx = {
        ...mockTransaction,
        type: 'redeem',
        treatmentId: 'treat-123',
      } as PointsTransaction;

      service.redeemPoints.mockResolvedValue(redeemTx);

      // Act
      await controller.redeemPoints(redeemDto);

      // Assert
      expect(service.redeemPoints).toHaveBeenCalledWith(
        mockCustomerId,
        50,
        mockClinicId,
        'treat-123',
      );
    });
  });

  describe('getBalance', () => {
    it('應該取得點數餘額', async () => {
      // Arrange
      const customerId = 'patient-001';
      const customerType = 'patient';
      const clinicId = 'clinic-001';

      service.getBalance.mockResolvedValue(mockBalance as PointsBalance);

      // Act
      const result = await controller.getBalance(customerId, customerType, clinicId);

      // Assert
      expect(result).toEqual(mockBalance);
      expect(service.getBalance).toHaveBeenCalledWith(
        customerId,
        customerType,
        clinicId,
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('應該取得交易歷史（默認 20 筆）', async () => {
      // Arrange
      const customerId = 'patient-001';
      const customerType = 'patient';
      const clinicId = 'clinic-001';
      const transactions = [mockTransaction as PointsTransaction];

      service.getTransactionHistory.mockResolvedValue(transactions);

      // Act
      const result = await controller.getTransactionHistory(
        customerId,
        customerType,
        clinicId,
      );

      // Assert
      expect(result).toEqual(transactions);
      expect(service.getTransactionHistory).toHaveBeenCalledWith(
        customerId,
        customerType,
        clinicId,
        20,
      );
    });

    it('應該支持自定義的限制數量', async () => {
      // Arrange
      const customerId = 'patient-001';
      const customerType = 'patient';
      const clinicId = 'clinic-001';
      const limit = 50;
      const transactions = [] as PointsTransaction[];

      service.getTransactionHistory.mockResolvedValue(transactions);

      // Act
      await controller.getTransactionHistory(
        customerId,
        customerType,
        clinicId,
        limit,
      );

      // Assert
      expect(service.getTransactionHistory).toHaveBeenCalledWith(
        customerId,
        customerType,
        clinicId,
        limit,
      );
    });
  });
});
