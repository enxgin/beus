import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { CommissionType, CommissionRuleType } from '../../prisma/prisma-types';

export class CreateCommissionRuleDto {
  // Hiyerarşik sistem alanları
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CommissionRuleType)
  @IsOptional()
  ruleType?: CommissionRuleType;

  @IsEnum(CommissionType)
  @IsOptional()
  type?: CommissionType;

  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsNumber()
  @IsOptional()
  fixedAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  // Hiyerarşik sistem için yeni alanlar
  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Eski alanlar - geriye dönük uyumluluk için
  @IsNumber()
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;
}
