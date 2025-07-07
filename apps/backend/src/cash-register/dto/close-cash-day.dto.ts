import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CloseCashDayDto {
  @ApiProperty({
    description: 'Kasadaki fiziksel sayım tutarı',
    example: 2500.75,
  })
  @IsNumber({}, { message: 'Kapanış bakiyesi bir sayı olmalıdır' })
  @IsPositive({ message: 'Kapanış bakiyesi pozitif bir değer olmalıdır' })
  actualBalance: number;

  @ApiProperty({
    description: 'Şube ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({
    description: 'Kapanış notu (opsiyonel)',
    example: 'Günlük kasa kapanış notu',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
