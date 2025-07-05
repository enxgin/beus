import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CalendarDataDto {
  @ApiProperty({ description: 'Şube ID', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ description: 'Başlangıç tarihi', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Bitiş tarihi', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CalendarResourceDto {
  @ApiProperty({ description: 'Kaynak ID' })
  id: string;

  @ApiProperty({ description: 'Kaynak başlığı' })
  title: string;
}

export class CalendarEventDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'İlgili kaynak ID' })
  resourceId: string;

  @ApiProperty({ description: 'Event başlığı' })
  title: string;

  @ApiProperty({ description: 'Başlangıç zamanı' })
  start: string;

  @ApiProperty({ description: 'Bitiş zamanı' })
  end: string;

  @ApiProperty({ description: 'Arka plan rengi', required: false })
  backgroundColor?: string;

  @ApiProperty({ description: 'Event açıklaması', required: false })
  description?: string;

  @ApiProperty({ description: 'Event durumu', required: false })
  status?: string;
}

export class CalendarResponseDto {
  @ApiProperty({ description: 'Kaynaklar listesi', type: [CalendarResourceDto] })
  resources: CalendarResourceDto[];

  @ApiProperty({ description: 'Randevular listesi', type: [CalendarEventDto] })
  events: CalendarEventDto[];
}