import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateCustomerPackageDto {
  @ApiProperty({ description: 'Müşteri ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir müşteri ID değeri giriniz' })
  @IsNotEmpty({ message: 'Müşteri ID boş olamaz' })
  customerId: string;

  @ApiProperty({ description: 'Paket ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir paket ID değeri giriniz' })
  @IsNotEmpty({ message: 'Paket ID boş olamaz' })
  packageId: string;
  
  @ApiProperty({ description: 'Satış kodu', example: 'PKT-123456', required: false })
  @IsString()
  @IsOptional()
  salesCode?: string;
  
  @ApiProperty({ description: 'Notlar', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
  
  @ApiProperty({ description: 'Başlangıç tarihi', example: '2023-01-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;
}
