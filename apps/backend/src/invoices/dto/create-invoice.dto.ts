import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsUUID } from 'class-validator';
import { PaymentStatus } from '../../prisma/prisma-types';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Fatura toplam tutarı', example: 1250.00 })
  @IsNumber({}, { message: 'Toplam tutar bir sayı olmalıdır' })
  @IsPositive({ message: 'Toplam tutar pozitif bir değer olmalıdır' })
  totalAmount: number;

  @ApiProperty({ description: 'Ödenen tutar', example: 1000.00, required: false })
  @IsNumber({}, { message: 'Ödenen tutar bir sayı olmalıdır' })
  @IsPositive({ message: 'Ödenen tutar pozitif bir değer olmalıdır' })
  @IsOptional()
  amountPaid?: number;

  @ApiProperty({ description: 'Kalan borç tutarı', example: 250.00, required: false })
  @IsNumber({}, { message: 'Borç tutarı bir sayı olmalıdır' })
  @IsPositive({ message: 'Borç tutarı pozitif bir değer olmalıdır' })
  @IsOptional()
  debt?: number;

  @ApiProperty({ description: 'Ödeme durumu', enum: PaymentStatus, default: PaymentStatus.UNPAID, required: false })
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ description: 'Müşteri ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir müşteri ID değeri giriniz' })
  @IsNotEmpty({ message: 'Müşteri ID boş olamaz' })
  customerId: string;

  @ApiProperty({ description: 'Şube ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir şube ID değeri giriniz' })
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({ description: 'Randevu ID (opsiyonel)', example: '1a2b3c4d5e6f7g8h9i0j', required: false })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir randevu ID değeri giriniz' })
  @IsOptional()
  appointmentId?: string;
}



