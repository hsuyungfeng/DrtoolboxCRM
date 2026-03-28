import { IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * CreateInvoiceDto — 建立發票請求 DTO（FIN-04）
 *
 * lineItems 和 totalAmount 由服務自動從付款記錄生成，不接受外部傳入，
 * 確保發票金額與付款記錄一致，防止資料竄改。
 */
export class CreateInvoiceDto {
  /** 療程 ID */
  @IsString()
  @IsNotEmpty()
  treatmentId: string;

  /** 患者 ID */
  @IsString()
  @IsNotEmpty()
  patientId: string;

  /** 建立人員 staffId（選填）*/
  @IsOptional()
  @IsString()
  createdBy?: string;
}
