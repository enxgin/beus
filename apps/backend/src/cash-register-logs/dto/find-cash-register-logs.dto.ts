import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumberString, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CashLogType } from '../../prisma/prisma-types';

export class FindCashRegisterLogsDto {
  @ApiProperty({ 
    description: 'İşlem türü', 
    enum: CashLogType,
    required: false
  })
  @IsEnum(CashLogType, { message: 'Geçerli bir işlem türü giriniz' })
  @IsOptional()
  type?: CashLogType;

  @ApiProperty({ 
    description: 'Şube ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir şube ID değeri giriniz' })
  @IsOptional()
  branchId?: string;

  @ApiProperty({ 
    description: 'Kullanıcı ID (işlemi yapan personel)', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir kullanıcı ID değeri giriniz' })
  @IsOptional()
  userId?: string;

  @ApiProperty({ 
    description: 'Başlangıç tarihi', 
    example: '2025-06-01T00:00:00Z', 
    required: false 
  })
  @IsISO8601({}, { message: 'Başlangıç tarihi geçerli bir ISO8601 tarih formatında olmalıdır' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    description: 'Bitiş tarihi', 
    example: '2025-06-30T23:59:59Z', 
    required: false 
  })
  @IsISO8601({}, { message: 'Bitiş tarihi geçerli bir ISO8601 tarih formatında olmalıdır' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: 'Atlanacak kayıt sayısı (sayfalama için)', 
    example: '0', 
    required: false 
  })
  @ApiProperty({
    description: 'Sayfa numarası',
    example: 1,
    required: false,
    default: 1,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Sayfa başına kayıt sayısı',
    example: 10,
    required: false,
    default: 10,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({ 
    description: 'Sıralama (JSON formatında)', 
    example: '{"createdAt":"desc"}', 
    required: false 
  })
  @IsOptional()
  orderBy?: string;
}



