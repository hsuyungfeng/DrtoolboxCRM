import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PointsService } from '../services/points.service';
import { CreatePointsTransactionDto } from '../dto/create-points-transaction.dto';
import { RedeemPointsDto } from '../dto/redeem-points.dto';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { PointsBalance } from '../entities/points-balance.entity';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * 獎勵點數
   * POST /points/award
   */
  @Post('award')
  async awardPoints(
    @Body() createDto: CreatePointsTransactionDto,
  ): Promise<PointsTransaction> {
    return await this.pointsService.awardPoints(
      createDto.customerId,
      createDto.amount,
      createDto.source,
      createDto.clinicId,
      createDto.referralId,
    );
  }

  /**
   * 兌換點數
   * POST /points/redeem
   */
  @Post('redeem')
  async redeemPoints(
    @Body() redeemDto: RedeemPointsDto,
  ): Promise<PointsTransaction> {
    return await this.pointsService.redeemPoints(
      redeemDto.customerId,
      redeemDto.amount,
      redeemDto.clinicId,
      redeemDto.treatmentId,
    );
  }

  /**
   * 取得點數餘額
   * GET /points/balance/:customerId?customerType=patient&clinicId=clinic-001
   */
  @Get('balance')
  async getBalance(
    @Query('customerId') customerId: string,
    @Query('customerType') customerType: string,
    @Query('clinicId') clinicId: string,
  ): Promise<PointsBalance> {
    return await this.pointsService.getBalance(customerId, customerType, clinicId);
  }

  /**
   * 取得交易歷史
   * GET /points/transactions?customerId=patient-001&customerType=patient&clinicId=clinic-001&limit=20
   */
  @Get('transactions')
  async getTransactionHistory(
    @Query('customerId') customerId: string,
    @Query('customerType') customerType: string,
    @Query('clinicId') clinicId: string,
    @Query('limit') limit?: number,
  ): Promise<PointsTransaction[]> {
    return await this.pointsService.getTransactionHistory(
      customerId,
      customerType,
      clinicId,
      limit || 20,
    );
  }
}
