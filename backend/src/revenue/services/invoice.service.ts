import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice, InvoiceLineItem } from "../entities/invoice.entity";
import { Treatment } from "../../treatments/entities/treatment.entity";
import { Patient } from "../../patients/entities/patient.entity";
import { FeeCalculationService } from "./fee-calculation.service";
import { CreateInvoiceDto } from "../dto/create-invoice.dto";

/**
 * InvoiceService — 發票生成與管理服務（FIN-03, FIN-04）
 *
 * 負責發票的 CRUD 操作、狀態管理與唯一流水號自動生成。
 * 防止重複開立：同一 treatmentId 不得有兩張 issued 發票。
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Treatment)
    private treatmentRepo: Repository<Treatment>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    private feeCalculationService: FeeCalculationService,
  ) {}

  /**
   * 生成發票（FIN-04）
   *
   * 流程：
   * 1. 確認同一 treatmentId 無重複 issued 發票（ConflictException）
   * 2. 從 FeeCalculationService 取得付款明細，自動生成 lineItems
   * 3. 生成唯一 invoiceNumber（INV-{YYYYMM}-{6位序號}）
   * 4. 儲存 draft 狀態發票
   *
   * @param dto - 建立發票 DTO（treatmentId, patientId, createdBy）
   * @param clinicId - 診所 ID（從 JWT 取得，確保多租戶隔離）
   */
  async create(dto: CreateInvoiceDto, clinicId: string): Promise<Invoice> {
    // Step 1：防止重複 issued 發票
    const existingIssued = await this.invoiceRepo.findOne({
      where: { treatmentId: dto.treatmentId, clinicId, status: "issued" },
    });
    if (existingIssued) {
      throw new ConflictException(
        `療程 ${dto.treatmentId} 已存在已開立發票 ${existingIssued.invoiceNumber}`,
      );
    }

    // Step 2：從 FeeCalculationService 取得付款明細
    const balanceInfo = await this.feeCalculationService.calculateBalance(
      dto.treatmentId,
      clinicId,
    );

    // Step 3：自動生成費用明細 lineItems
    const lineItems: InvoiceLineItem[] = balanceInfo.payments.map((p) => ({
      paymentId: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt.toISOString(),
      description: `療程費用（${this.getPaymentMethodLabel(p.paymentMethod)}）`,
    }));

    // Step 4：生成唯一流水號
    const invoiceNumber = await this.generateInvoiceNumber(clinicId);

    const invoice = this.invoiceRepo.create({
      invoiceNumber,
      treatmentId: dto.treatmentId,
      patientId: dto.patientId,
      lineItems,
      totalAmount: balanceInfo.totalPaid,
      status: "draft",
      clinicId,
      createdBy: dto.createdBy ?? null,
      issuedAt: null,
      cancelledAt: null,
      cancelReason: null,
    });

    this.logger.log(`建立發票草稿：${invoiceNumber}，療程：${dto.treatmentId}`);
    return await this.invoiceRepo.save(invoice);
  }

  /**
   * 確認開立發票（draft → issued）（FIN-04）
   *
   * 只有 draft 狀態的發票可以開立；cancelled 或已 issued 的發票無法再次開立。
   *
   * @param id - 發票 ID
   * @param clinicId - 診所 ID
   */
  async issue(id: string, clinicId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, clinicId);

    if (invoice.status !== "draft") {
      throw new BadRequestException(
        `發票狀態 ${invoice.status} 無法開立，只有 draft 可開立`,
      );
    }

    invoice.status = "issued";
    invoice.issuedAt = new Date();

    this.logger.log(`開立發票：${invoice.invoiceNumber}`);
    return await this.invoiceRepo.save(invoice);
  }

  /**
   * 取消發票（issued/draft → cancelled）
   *
   * 已取消的發票無法再次取消。
   *
   * @param id - 發票 ID
   * @param clinicId - 診所 ID
   * @param reason - 取消原因（選填）
   */
  async cancel(id: string, clinicId: string, reason?: string): Promise<Invoice> {
    const invoice = await this.findOne(id, clinicId);

    if (invoice.status === "cancelled") {
      throw new BadRequestException("發票已取消");
    }

    invoice.status = "cancelled";
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason ?? null;

    this.logger.log(`取消發票：${invoice.invoiceNumber}，原因：${reason ?? "未說明"}`);
    return await this.invoiceRepo.save(invoice);
  }

  /**
   * 查詢單張發票（含療程與患者關聯）（FIN-03）
   *
   * @param id - 發票 ID
   * @param clinicId - 診所 ID
   */
  async findOne(id: string, clinicId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, clinicId },
      relations: ["treatment", "patient"],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  /**
   * 查詢療程的所有發票（FIN-03）
   *
   * @param treatmentId - 療程 ID
   * @param clinicId - 診所 ID
   */
  async findByTreatment(treatmentId: string, clinicId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { treatmentId, clinicId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 查詢患者的所有發票（FIN-03）
   *
   * @param patientId - 患者 ID
   * @param clinicId - 診所 ID
   */
  async findByPatient(patientId: string, clinicId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { patientId, clinicId },
      order: { createdAt: "DESC" },
      relations: ["treatment"],
    });
  }

  /**
   * 生成唯一發票流水號
   *
   * 格式：INV-{YYYYMM}-{6位序號}，例如 INV-202603-000001
   * 序號在診所範圍內按月份遞增，每月從 000001 開始。
   *
   * @param clinicId - 診所 ID（按診所隔離序號）
   */
  private async generateInvoiceNumber(clinicId: string): Promise<string> {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `INV-${yyyymm}-`;

    // 查詢本月最大序號
    const latest = await this.invoiceRepo
      .createQueryBuilder("invoice")
      .where("invoice.clinicId = :clinicId", { clinicId })
      .andWhere("invoice.invoiceNumber LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("invoice.invoiceNumber", "DESC")
      .getOne();

    let seq = 1;
    if (latest) {
      const lastSeq = parseInt(latest.invoiceNumber.split("-").pop() ?? "0", 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(6, "0")}`;
  }

  /**
   * 取得支付方式中文標籤
   *
   * @param method - 支付方式代碼
   */
  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: "現金",
      bank_transfer: "銀行轉帳",
      credit_card: "刷卡",
    };
    return labels[method] ?? method;
  }
}
