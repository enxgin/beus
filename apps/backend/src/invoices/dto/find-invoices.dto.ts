import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumberString, IsISO8601 } from 'class-validator';
import { PaymentStatus } from '../../prisma/prisma-types';

export class FindInvoicesDto {
  @ApiProperty({ 
    description: 'Müşteri ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ 
    description: 'Şube ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ 
    description: 'Randevu ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ 
    description: 'Ödeme durumu', 
    enum: PaymentStatus, 
    required: false 
  })
  @IsEnum(PaymentStatus, { message: 'Geçerli bir ödeme durumu giriniz' })
  @IsOptional()
  status?: PaymentStatus;

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
  @IsNumberString({}, { message: 'Skip değeri bir sayı olmalıdır' })
  @IsOptional()
  skip?: string;

  @ApiProperty({ 
    description: 'Alınacak kayıt sayısı (sayfalama için)', 
    example: '10', 
    required: false 
  })
  @IsNumberString({}, { message: 'Take değeri bir sayı olmalıdır' })
  @IsOptional()
  take?: string;

  @ApiProperty({ 
    description: 'Sıralama (JSON formatında)', 
    example: '{"createdAt":"desc"}', 
    required: false 
  })
  @IsOptional()
  orderBy?: any;
}



