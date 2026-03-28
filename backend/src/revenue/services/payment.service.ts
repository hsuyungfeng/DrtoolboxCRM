import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "../entities/payment.entity";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { FeeCalculationService } from "./fee-calculation.service";

/**
 * PaymentService — 患者付款 CRUD 與餘額查詢（FIN-02, FIN-05）
 *
 * 負責患者付款記錄的建立、查詢與取消（軟刪除），
 * 並整合 FeeCalculationService 提供餘額查詢。
 */
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private feeCalculationService: FeeCalculationService,
  ) {}

  /**
   * 建立付款記錄
   * clinicId 必須來自 JWT token（req.user.clinicId），不可由用戶端傳入
   */
  async create(dto: CreatePaymentDto, clinicId: string): Promise<Payment> {
    const payment = this.paymentRepo.create({
      treatmentId: dto.treatmentId,
      patientId: dto.patientId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as "cash" | "bank_transfer" | "credit_card",
      notes: dto.notes ?? null,
      recordedBy: dto.recordedBy ?? null,
      clinicId,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      status: "completed",
    });
    return await this.paymentRepo.save(payment);
  }

  /**
   * 查詢療程的所有付款記錄（按付款日期 ASC 排序）
   */
  async findByTreatment(
    treatmentId: string,
    clinicId: string,
  ): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { treatmentId, clinicId },
      order: { paidAt: "ASC" },
    });
  }

  /**
   * 查詢患者的所有付款記錄（跨療程，含 treatment 關聯）
   */
  async findByPatient(
    patientId: string,
    clinicId: string,
  ): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { patientId, clinicId },
      order: { paidAt: "DESC" },
      relations: ["treatment"],
    });
  }

  /**
   * 查詢療程費用餘額（代理 FeeCalculationService）
   */
  async getBalance(treatmentId: string, clinicId: string) {
    return this.feeCalculationService.calculateBalance(treatmentId, clinicId);
  }

  /**
   * 取消付款（軟刪除）
   * completed 狀態的付款標記為 cancelled，不進行實際刪除
   */
  async remove(id: string, clinicId: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { id, clinicId },
    });

    if (!payment) {
      throw new NotFoundException(`付款記錄 ${id} 不存在`);
    }

    if (payment.status === "completed") {
      payment.status = "cancelled";
      await this.paymentRepo.save(payment);
    }
  }
}
