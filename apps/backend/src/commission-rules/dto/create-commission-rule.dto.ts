import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CommissionType } from '../../prisma/prisma-types';

export class CreateCommissionRuleDto {
  @IsEnum(CommissionType)
  type: CommissionType;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean = false;
}
