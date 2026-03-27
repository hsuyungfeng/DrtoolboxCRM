import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @IsString()
  patientId: string;

  @IsString()
  clinicId: string;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCourseStart?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnSessionComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCourseComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnAppointmentReminder?: boolean;
}
