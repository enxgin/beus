import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    description: 'Randevunun yeni başlangıç zamanı',
    example: '2024-07-05T14:00:00.000Z',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  startTime!: Date;

  @ApiProperty({
    description: 'Randevunun atanacağı yeni personel ID (isteğe bağlı)',
    example: 'clg2sdj8c000008l56ryo3f0z',
    required: false,
  })
  @IsOptional()
  @IsString()
  staffId?: string;
}
