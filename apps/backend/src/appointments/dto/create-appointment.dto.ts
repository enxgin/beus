import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Müşteri ID' })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Personel ID' })
  @IsNotEmpty()
  @IsUUID()
  staffId: string;

  @ApiProperty({ description: 'Hizmet ID' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Randevu başlangıç tarihi ve saati' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({ description: 'Randevu bitiş tarihi ve saati' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiProperty({ description: 'Randevu notu', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Şube ID', required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
