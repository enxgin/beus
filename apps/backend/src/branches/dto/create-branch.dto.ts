import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({
    example: 'Kadıköy Şubesi',
    description: 'Şube adı',
    required: true
  })
  @IsNotEmpty({ message: 'Şube adı boş olamaz' })
  @IsString({ message: 'Şube adı string formatında olmalıdır' })
  name!: string;

  @ApiProperty({
    example: 'Rıhtım Caddesi No:42, Kadıköy, İstanbul',
    description: 'Şube adresi',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Adres string formatında olmalıdır' })
  address?: string;

  @ApiProperty({
    example: '+905551234567',
    description: 'Şube telefon numarası',
    required: true
  })
  @IsPhoneNumber('TR', { message: 'Geçerli bir telefon numarası giriniz' })
  phone!: string;

  @ApiProperty({
    example: 'Kadıköy şubemiz, İstanbul\'un merkezinde konumlanmıştır.',
    description: 'Şube açıklaması',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Açıklama string formatında olmalıdır' })
  description?: string;

  @ApiProperty({
    example: 'abc123',
    description: 'Üst şube ID (opsiyonel)',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Üst şube ID string formatında olmalıdır' })
  parentBranchId?: string;
}
