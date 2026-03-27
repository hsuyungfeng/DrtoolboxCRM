import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsIn,
  IsOptional,
  IsDateString,
} from "class-validator";

/**
 * 建立付款記錄 DTO
 * 用於 POST /payments 端點
 */
export class CreatePaymentDto {
  /** 療程 ID */
  @IsString()
  @IsNotEmpty()
  treatmentId: string;

  /** 患者 ID */
  @IsString()
  @IsNotEmpty()
  patientId: string;

  /** 付款金額（最小 0.01）*/
  @IsNumber()
  @Min(0.01)
  amount: number;

  /**
   * 支付方式：現金 | 銀行轉帳 | 刷卡
   * 限制為 cash / bank_transfer / credit_card
   */
  @IsIn(["cash", "bank_transfer", "credit_card"])
  paymentMethod: string;

  /** 付款日期（ISO 8601 格式，省略時自動設為目前時間）*/
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  /** 備註（選填）*/
  @IsOptional()
  @IsString()
  notes?: string;

  /** 記錄人員 staffId（選填）*/
  @IsOptional()
  @IsString()
  recordedBy?: string;
}
