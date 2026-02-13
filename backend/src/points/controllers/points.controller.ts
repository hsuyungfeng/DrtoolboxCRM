import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { PointsService } from "../services/points.service";
import { CreatePointsTransactionDto } from "../dto/create-points-transaction.dto";
import { RedeemPointsDto } from "../dto/redeem-points.dto";
import { PointsTransaction } from "../entities/points-transaction.entity";
import { PointsBalance } from "../entities/points-balance.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("points")
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * 獎勵點數
   * POST /points/award
   */
  @Post("award")
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
  @Post("redeem")
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
   * GET /points/balance?customerId=patient-001&customerType=patient&clinicId=clinic-001
   */
  @Get("balance")
  async getBalance(
    @Query("customerId") customerId?: string,
    @Query("customerType") customerType?: string,
    @Query("clinicId") clinicId?: string,
  ): Promise<PointsBalance> {
    // 驗證必填參數
    if (!customerId) {
      throw new BadRequestException("customerId 參數必填");
    }
    if (!customerType) {
      throw new BadRequestException("customerType 參數必填");
    }
    if (!clinicId) {
      throw new BadRequestException("clinicId 參數必填");
    }

    // 驗證 customerType 值
    if (!["patient", "staff"].includes(customerType)) {
      throw new BadRequestException('customerType 必須是 "patient" 或 "staff"');
    }

    return await this.pointsService.getBalance(
      customerId,
      customerType,
      clinicId,
    );
  }

  /**
   * 取得交易歷史
   * GET /points/transactions?customerId=patient-001&customerType=patient&clinicId=clinic-001&limit=20
   */
  @Get("transactions")
  async getTransactionHistory(
    @Query("customerId") customerId?: string,
    @Query("customerType") customerType?: string,
    @Query("clinicId") clinicId?: string,
    @Query("limit") limit?: string,
  ): Promise<PointsTransaction[]> {
    // 驗證必填參數
    if (!customerId) {
      throw new BadRequestException("customerId 參數必填");
    }
    if (!customerType) {
      throw new BadRequestException("customerType 參數必填");
    }
    if (!clinicId) {
      throw new BadRequestException("clinicId 參數必填");
    }

    // 驗證 customerType 值
    if (!["patient", "staff"].includes(customerType)) {
      throw new BadRequestException('customerType 必須是 "patient" 或 "staff"');
    }

    // 驗證 limit 參數
    let parsedLimit = 20;
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new BadRequestException("limit 必須是正整數");
      }
      if (parsed > 100) {
        throw new BadRequestException("limit 最多 100 筆記錄");
      }
      parsedLimit = parsed;
    }

    return await this.pointsService.getTransactionHistory(
      customerId,
      customerType,
      clinicId,
      parsedLimit,
    );
  }
}
