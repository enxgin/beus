import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../../prisma/prisma-types';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ 
    description: 'Randevu durumu', 
    enum: AppointmentStatus,
    example: AppointmentStatus.COMPLETED
  })
  @IsEnum(AppointmentStatus, { message: 'Geçerli bir randevu durumu giriniz' })
  @IsNotEmpty({ message: 'Randevu durumu boş olamaz' })
  status: AppointmentStatus;
}


