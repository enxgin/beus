import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { CashLogType } from '../../prisma/prisma-types';

export class CreateCashRegisterLogDto {
  @ApiProperty({
    description: 'İşlem türü',
    enum: CashLogType,
    example: 'INCOME'
  })
  @IsEnum(CashLogType, { message: 'Geçerli bir işlem türü giriniz' })
  @IsNotEmpty({ message: 'İşlem türü boş olamaz' })
  type: CashLogType;

  @ApiProperty({ description: 'İşlem tutarı', example: 100.00 })
  @IsNumber({}, { message: 'Tutar bir sayı olmalıdır' })
  @IsPositive({ message: 'Tutar pozitif bir değer olmalıdır' })
  amount: number;

  @ApiProperty({ description: 'İşlem açıklaması', example: 'Günlük kasa açılışı' })
  @IsString()
  @IsNotEmpty({ message: 'Açıklama boş olamaz' })
  description: string;

  @ApiProperty({ description: 'Şube ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir şube ID değeri giriniz' })
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({ description: 'Kullanıcı ID (işlemi yapan personel)', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir kullanıcı ID değeri giriniz' })
  @IsNotEmpty({ message: 'Kullanıcı ID boş olamaz' })
  userId: string;

  @ApiProperty({ 
    description: 'İlgili fatura ID (opsiyonel)', 
    example: '1a2b3c4d5e6f7g8h9i0j',
    required: false 
  })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir fatura ID değeri giriniz' })
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ 
    description: 'İlgili ödeme ID (opsiyonel)', 
    example: '1a2b3c4d5e6f7g8h9i0j',
    required: false 
  })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir ödeme ID değeri giriniz' })
  @IsOptional()
  paymentId?: string;
}



