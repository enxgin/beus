import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateCustomerPackageDto {
  @ApiProperty({ description: 'Müşteri ID', example: 'cmcpfmex8000kvj1j7529adyz' })
  @IsString({ message: 'Müşteri ID bir metin olmalıdır' })
  @IsNotEmpty({ message: 'Müşteri ID boş olamaz' })
  customerId: string;

  @ApiProperty({ description: 'Paket ID', example: 'cmcpr9csb0001vjl8vqcv1cmi' })
  @IsString({ message: 'Paket ID bir metin olmalıdır' })
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
