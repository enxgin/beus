import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class OpenCashDayDto {
  @ApiProperty({
    description: 'Gün başı açılış bakiyesi',
    example: 1000.50,
  })
  @IsNumber({}, { message: 'Açılış bakiyesi bir sayı olmalıdır' })
  @IsPositive({ message: 'Açılış bakiyesi pozitif bir değer olmalıdır' })
  openingBalance: number;

  @ApiProperty({
    description: 'Şube ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({
    description: 'Açılış notu (opsiyonel)',
    example: 'Günlük kasa açılış notu',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
