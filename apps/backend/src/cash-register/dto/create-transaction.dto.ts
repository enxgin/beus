import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { CashLogType, CashMovementCategory } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'İşlem tipi',
    enum: CashLogType,
    example: CashLogType.MANUAL_IN,
  })
  @IsEnum(CashLogType, { message: 'Geçerli bir işlem tipi giriniz' })
  @IsNotEmpty({ message: 'İşlem tipi boş olamaz' })
  type: CashLogType;

  @ApiProperty({
    description: 'İşlem tutarı',
    example: 150.50,
  })
  @IsNumber({}, { message: 'Tutar bir sayı olmalıdır' })
  @IsPositive({ message: 'Tutar pozitif bir değer olmalıdır' })
  amount: number;

  @ApiProperty({
    description: 'İşlem açıklaması',
    example: 'Temizlik malzemesi alımı',
  })
  @IsString()
  @IsNotEmpty({ message: 'İşlem açıklaması boş olamaz' })
  description: string;

  @ApiProperty({
    description: 'Şube ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({
    description: 'Manuel hareketin kategorisi (opsiyonel)',
    enum: CashMovementCategory,
    required: false,
    example: CashMovementCategory.SUPPLIES,
  })
  @IsEnum(CashMovementCategory)
  @IsOptional()
  category?: CashMovementCategory;

  // @ApiProperty({
  //   description: 'Referans ID (opsiyonel)',
  //   example: '1a2b3c4d-5e6f-7g8h-9i0j',
  //   required: false,
  // })
  // @IsString()
  // @IsOptional()
  // referenceId?: string; // DB senkronizasyon sorunu için geçici olarak kapatıldı

  // @ApiProperty({
  //   description: 'Referans tipi (opsiyonel)',
  //   example: 'invoice',
  //   required: false,
  // })
  // @IsString()
  // @IsOptional()
  // referenceType?: string; // DB senkronizasyon sorunu için geçici olarak kapatıldı
}
