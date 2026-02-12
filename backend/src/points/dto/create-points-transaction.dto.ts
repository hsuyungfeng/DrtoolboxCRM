import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreatePointsTransactionDto {
  @IsNotEmpty({ message: 'customerId 不能為空' })
  @IsString({ message: 'customerId 必須是字符串' })
  customerId: string;

  @IsNotEmpty({ message: 'customerType 不能為空' })
  @IsString({ message: 'customerType 必須是字符串' })
  customerType: string; // 'staff' | 'patient'

  @IsNotEmpty({ message: 'type 不能為空' })
  @IsString({ message: 'type 必須是字符串' })
  type: string; // 'earn_referral' | 'redeem' | 'expire' | 'manual_adjust'

  @IsNotEmpty({ message: 'amount 不能為空' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount 必須是數字，最多 2 位小數' }
  )
  amount: number;

  @IsNotEmpty({ message: 'source 不能為空' })
  @IsString({ message: 'source 必須是字符串' })
  source: string; // 'referral' | 'treatment' | 'manual'

  @IsNotEmpty({ message: 'clinicId 不能為空' })
  @IsString({ message: 'clinicId 必須是字符串' })
  clinicId: string;

  @IsOptional()
  @IsString({ message: 'referralId 必須是字符串' })
  referralId?: string;

  @IsOptional()
  @IsString({ message: 'treatmentId 必須是字符串' })
  treatmentId?: string;

  @IsOptional()
  @IsString({ message: 'notes 必須是字符串' })
  notes?: string;
}
