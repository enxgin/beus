import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum InvoiceSourceType {
  PACKAGE = 'package',
  SERVICE = 'service',
}

export class CreateInvoiceFromServiceDto {
  @ApiProperty({ description: 'Fatura kaynağı türü', enum: InvoiceSourceType, example: InvoiceSourceType.SERVICE })
  @IsEnum(InvoiceSourceType, { message: 'Geçerli bir fatura kaynağı türü giriniz' })
  @IsNotEmpty({ message: 'Fatura kaynağı türü boş olamaz' })
  invoiceType: InvoiceSourceType;

  @ApiProperty({ description: 'Müşteri ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString({ message: 'Müşteri ID string olmalıdır' })
  @IsNotEmpty({ message: 'Müşteri ID boş olamaz' })
  customerId: string;

  @ApiProperty({ description: 'Paket ID (paket satışı için)', example: '1a2b3c4d5e6f7g8h9i0j', required: false })
  @IsString({ message: 'Paket ID string olmalıdır' })
  @IsOptional()
  packageId?: string;

  @ApiProperty({ description: 'Randevu ID (hizmet faturası için)', example: '1a2b3c4d5e6f7g8h9i0j', required: false })
  @IsString({ message: 'Randevu ID string olmalıdır' })
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ description: 'İndirim oranı (%)', example: 10, required: false })
  @IsNumber({}, { message: 'İndirim oranı bir sayı olmalıdır' })
  @IsOptional()
  discountRate?: number;
}
