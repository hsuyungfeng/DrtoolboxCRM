import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { InvoiceService } from "../services/invoice.service";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";

/**
 * InvoiceController — 發票 REST API（FIN-03, FIN-04）
 *
 * 所有端點均透過 JwtAuthGuard 保護，clinicId 從 req.user.clinicId 取得，
 * 確保多租戶隔離，不接受用戶端傳入的 clinicId。
 */
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * POST /invoices — 生成草稿發票（FIN-04）
   *
   * 根據療程付款記錄自動生成 lineItems 與 totalAmount，
   * 建立 draft 狀態發票，並分配唯一流水號。
   */
  @Post()
  create(@Body() dto: CreateInvoiceDto, @Request() req: any) {
    return this.invoiceService.create(dto, req.user.clinicId);
  }

  /**
   * GET /invoices/treatment/:treatmentId — 療程所有發票
   *
   * 回傳療程相關的所有發票（draft、issued、cancelled），依建立時間倒序。
   * 注意：此路由定義在 :id 之前，避免路由衝突。
   */
  @Get("treatment/:treatmentId")
  findByTreatment(@Param("treatmentId") treatmentId: string, @Request() req: any) {
    return this.invoiceService.findByTreatment(treatmentId, req.user.clinicId);
  }

  /**
   * GET /invoices/patient/:patientId — 患者所有發票
   *
   * 回傳患者相關的所有發票，含療程關聯資訊。
   */
  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string, @Request() req: any) {
    return this.invoiceService.findByPatient(patientId, req.user.clinicId);
  }

  /**
   * GET /invoices/:id — 查詢發票詳情（FIN-03）
   *
   * 回傳發票詳情，含療程與患者關聯資料、費用明細 lineItems。
   */
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: any) {
    return this.invoiceService.findOne(id, req.user.clinicId);
  }

  /**
   * PATCH /invoices/:id/issue — 確認開立發票（draft → issued）（FIN-04）
   *
   * 將草稿發票正式開立，設定 issuedAt 時間戳。
   * 只有 draft 狀態的發票可以開立。
   */
  @Patch(":id/issue")
  issue(@Param("id") id: string, @Request() req: any) {
    return this.invoiceService.issue(id, req.user.clinicId);
  }

  /**
   * PATCH /invoices/:id/cancel — 取消發票
   *
   * 取消 draft 或 issued 狀態的發票，設定 cancelledAt 與 cancelReason。
   */
  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Request() req: any,
  ) {
    return this.invoiceService.cancel(id, req.user.clinicId, reason);
  }
}
