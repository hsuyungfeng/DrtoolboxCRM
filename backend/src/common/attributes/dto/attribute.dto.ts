import { IsEnum, IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';
import { AttributeTarget, AttributeType } from '../entities/attribute-definition.entity';

export class CreateAttributeDto {
  @IsEnum(AttributeTarget)
  @IsNotEmpty()
  targetEntity: AttributeTarget;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsEnum(AttributeType)
  @IsNotEmpty()
  type: AttributeType;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateAttributeDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
