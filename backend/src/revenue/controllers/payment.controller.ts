import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PaymentService } from "../services/payment.service";
import { CreatePaymentDto } from "../dto/create-payment.dto";

/**
 * PaymentController — 患者付款 REST API
 *
 * 所有端點均透過 JwtAuthGuard 保護，clinicId 從 req.user.clinicId 取得，
 * 確保多租戶隔離，不接受用戶端傳入的 clinicId。
 */
@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payments — 記錄患者付款（FIN-02）
   * clinicId 由 JWT token 取得，確保多租戶隔離
   */
  @Post()
  create(@Body() dto: CreatePaymentDto, @Request() req: any) {
    const clinicId: string = req.user.clinicId;
    return this.paymentService.create(dto, clinicId);
  }

  /**
   * GET /payments/treatment/:treatmentId — 療程付款列表（FIN-03）
   */
  @Get("treatment/:treatmentId")
  findByTreatment(
    @Param("treatmentId") treatmentId: string,
    @Request() req: any,
  ) {
    return this.paymentService.findByTreatment(treatmentId, req.user.clinicId);
  }

  /**
   * GET /payments/patient/:patientId — 患者全部付款（FIN-03）
   */
  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string, @Request() req: any) {
    return this.paymentService.findByPatient(patientId, req.user.clinicId);
  }

  /**
   * GET /payments/balance/:treatmentId — 費用餘額（FIN-01）
   * 回傳 totalFee, totalPaid, balance, payments
   */
  @Get("balance/:treatmentId")
  getBalance(
    @Param("treatmentId") treatmentId: string,
    @Request() req: any,
  ) {
    return this.paymentService.getBalance(treatmentId, req.user.clinicId);
  }

  /**
   * DELETE /payments/:id — 取消付款（軟刪除，標記為 cancelled）
   */
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    return this.paymentService.remove(id, req.user.clinicId);
  }
}
