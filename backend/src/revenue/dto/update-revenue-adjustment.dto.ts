import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateRevenueAdjustmentDto } from "./create-revenue-adjustment.dto";
import { IsOptional, IsString, IsNumber, IsObject } from "class-validator";

export class UpdateRevenueAdjustmentDto extends PartialType(
  CreateRevenueAdjustmentDto,
) {
  @ApiProperty({
    description: "審核狀態",
    example: "approved",
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewStatus?: "pending" | "approved" | "rejected";

  @ApiProperty({
    description: "審核備註",
    example: "調整金額合理，同意",
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiProperty({
    description: "審核者 ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewedBy?: string;

  @ApiProperty({
    description: "審核時間",
    example: "2025-02-09T10:30:00Z",
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewedAt?: string;
}
