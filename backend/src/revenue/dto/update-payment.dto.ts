import { PartialType } from "@nestjs/mapped-types";
import { IsOptional, IsIn } from "class-validator";
import { CreatePaymentDto } from "./create-payment.dto";

/**
 * 更新付款記錄 DTO
 * 繼承 CreatePaymentDto（所有欄位皆為選填）並新增 status 欄位
 */
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  /** 付款狀態：completed | refunded | cancelled */
  @IsOptional()
  @IsIn(["completed", "refunded", "cancelled"])
  status?: string;
}
