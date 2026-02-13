import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from "class-validator";

export class RedeemPointsDto {
  @IsNotEmpty({ message: "customerId 不能為空" })
  @IsString({ message: "customerId 必須是字符串" })
  customerId: string;

  @IsNotEmpty({ message: "customerType 不能為空" })
  @IsString({ message: "customerType 必須是字符串" })
  customerType: string; // 'staff' | 'patient'

  @IsNotEmpty({ message: "amount 不能為空" })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "amount 必須是數字，最多 2 位小數" },
  )
  @Min(0.01, { message: "amount 必須大於 0" })
  amount: number;

  @IsNotEmpty({ message: "clinicId 不能為空" })
  @IsString({ message: "clinicId 必須是字符串" })
  clinicId: string;

  @IsOptional()
  @IsString({ message: "treatmentId 必須是字符串" })
  treatmentId?: string;

  @IsOptional()
  @IsString({ message: "notes 必須是字符串" })
  notes?: string;
}
