import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Decimal from "decimal.js";
import { Payment } from "../entities/payment.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";

// 設置 Decimal 精度為 8 位小數，四捨五入
Decimal.set({ precision: 8, rounding: Decimal.ROUND_HALF_UP });

/**
 * FeeCalculationService — 患者費用計算服務（FIN-01）
 *
 * 負責計算療程費用與付款餘額，使用 Decimal.js 確保精確度。
 * 與 RevenueCalculatorService 不同：本服務關注**患者視角**（付款餘額），
 * 而非醫護人員分潤。
 */
@Injectable()
export class FeeCalculationService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Treatment)
    private treatmentRepo: Repository<Treatment>,
  ) {}

  /**
   * 計算療程費用餘額（未付金額）
   *
   * 使用 finalPrice（已扣積點後的實際費用），透過 Decimal.js 精確計算。
   * 餘額最小為 0，不允許負數。
   *
   * @param treatmentId - 療程 ID
   * @param clinicId - 診所 ID（多租戶隔離）
   * @returns 費用明細：totalFee, totalPaid, balance, payments
   */
  async calculateBalance(
    treatmentId: string,
    clinicId: string,
  ): Promise<{
    totalFee: number;
    totalPaid: number;
    balance: number;
    payments: Payment[];
  }> {
    const treatment = await this.treatmentRepo.findOne({
      where: { id: treatmentId, clinicId },
    });

    if (!treatment) {
      throw new NotFoundException(
        `療程 ${treatmentId} 在診所 ${clinicId} 中不存在`,
      );
    }

    const payments = await this.paymentRepo.find({
      where: { treatmentId, clinicId, status: "completed" },
      order: { paidAt: "ASC" },
    });

    // 使用 finalPrice（扣積點後），若為空則使用 totalPrice
    const totalFee = new Decimal(
      treatment.finalPrice ?? treatment.totalPrice,
    );

    // Decimal.js 精確加總：避免浮點數誤差（如 1000.005 + 1000.005 = 2000.0099999...）
    const totalPaid = payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    // 餘額最小為 0（超付情況不得為負數）
    const balance = Decimal.max(totalFee.minus(totalPaid), new Decimal(0));

    return {
      totalFee: totalFee.toDecimalPlaces(2).toNumber(),
      totalPaid: totalPaid.toDecimalPlaces(2).toNumber(),
      balance: balance.toDecimalPlaces(2).toNumber(),
      payments,
    };
  }

  /**
   * 計算療程總費用（FIN-01）
   *
   * 返回 finalPrice（扣積點後）與費用明細，供費用顯示使用。
   *
   * @param treatmentId - 療程 ID
   * @param clinicId - 診所 ID（多租戶隔離）
   * @returns 費用明細：totalPrice, pointsRedeemed, finalPrice
   */
  async calculateTreatmentFee(
    treatmentId: string,
    clinicId: string,
  ): Promise<{
    totalPrice: number;
    pointsRedeemed: number;
    finalPrice: number;
  }> {
    const treatment = await this.treatmentRepo.findOne({
      where: { id: treatmentId, clinicId },
    });

    if (!treatment) {
      throw new NotFoundException(
        `療程 ${treatmentId} 在診所 ${clinicId} 中不存在`,
      );
    }

    return {
      totalPrice: new Decimal(treatment.totalPrice)
        .toDecimalPlaces(2)
        .toNumber(),
      pointsRedeemed: new Decimal(treatment.pointsRedeemed ?? 0)
        .toDecimalPlaces(2)
        .toNumber(),
      finalPrice: new Decimal(
        treatment.finalPrice ?? treatment.totalPrice,
      )
        .toDecimalPlaces(2)
        .toNumber(),
    };
  }
}
