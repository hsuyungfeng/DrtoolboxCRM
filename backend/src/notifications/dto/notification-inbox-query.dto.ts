import { IsOptional, IsString, IsBoolean, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class NotificationInboxQueryDto {
  @IsString()
  patientId: string;

  @IsString()
  clinicId: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
