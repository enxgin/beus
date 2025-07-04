import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsISO8601, IsEnum, IsNumberString } from 'class-validator';
import { AppointmentStatus } from '../../prisma/prisma-types';

export class FindAppointmentsDto {
  @ApiProperty({ 
    description: 'Başlangıç tarihi',
    example: '2025-07-01T00:00:00Z', 
    required: false 
  })
  @IsISO8601({}, { message: 'Başlangıç tarihi geçerli bir ISO8601 tarih formatında olmalıdır' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    description: 'Bitiş tarihi', 
    example: '2025-07-31T23:59:59Z', 
    required: false 
  })
  @IsISO8601({}, { message: 'Bitiş tarihi geçerli bir ISO8601 tarih formatında olmalıdır' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: 'Müşteri ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ 
    description: 'Personel ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiProperty({ 
    description: 'Şube ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ 
    description: 'Hizmet ID', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ 
    description: 'Randevu durumu', 
    enum: AppointmentStatus, 
    required: false 
  })
  @IsEnum(AppointmentStatus, { message: 'Geçerli bir randevu durumu giriniz' })
  @IsOptional()
  status?: AppointmentStatus;

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
    example: '{"startTime":"asc"}', 
    required: false 
  })
  @IsOptional()
  orderBy?: any;
}


