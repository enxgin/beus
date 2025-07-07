import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  Min,
  IsEnum,
} from 'class-validator';
import { ServiceType } from '../../prisma/prisma-types';

export class CreateServiceDto {
  @ApiProperty({ description: 'Hizmet adı', example: 'Cilt Bakımı' })
  @IsString()
  @IsNotEmpty({ message: 'Hizmet adı boş olamaz' })
  name: string;

  @ApiProperty({
    description: 'Hizmet süresi (dakika olarak)',
    example: 60,
  })
  @IsNumber({}, { message: 'Süre sayısal bir değer olmalıdır' })
  @Min(1, { message: 'Süre en az 1 dakika olmalıdır' })
  duration: number;

  @ApiProperty({ description: 'Hizmet fiyatı', example: 450 })
  @IsNumber({}, { message: 'Fiyat sayısal bir değer olmalıdır' })
  @Min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır' })
  price: number;

  @ApiProperty({
    description: 'Hizmetin aktif olup olmadığını belirtir',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Durum true veya false olmalıdır' })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Hizmetin ait olduğu kategori ID',
    example: 'c1f7a4a4-9d1a-4b0e-8d6a-8c7f6a5b4c3d',
  })
  // UUID validasyonu kaldırıldı
  @IsString({ message: 'Kategori ID string olmalıdır' })
  @IsNotEmpty({ message: 'Kategori ID boş olamaz' })
  categoryId: string;

  @ApiProperty({
    description: 'Hizmetin ait olduğu şube ID',
    example: 'b2e8a5b5-8c2b-4f1e-9d7b-9c8e7b6a5d4e',
  })
  // UUID validasyonu kaldırıldı
  @IsString({ message: 'Şube ID string olmalıdır' })
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  branchId: string;

  @ApiProperty({
    description: 'Hizmeti verebilecek personel IDleri',
    type: [String],
    example: ['a3d9b6c6-7d3c-4e2f-8a8b-7d9e8c7b6a5f'],
  })
  @IsArray({ message: 'Personel IDleri bir dizi olmalıdır' })
  @ArrayNotEmpty({ message: 'En az bir personel seçilmelidir' })
  // UUID validasyonu kaldırıldı
  @IsString({ each: true, message: 'Her personel ID değeri string olmalıdır' })
  staffIds: string[];

  @ApiProperty({
    description: 'Hizmet türü',
    enum: ServiceType,
    example: ServiceType.TIME_BASED,
    required: false,
  })
  @IsEnum(ServiceType, { message: 'Geçersiz hizmet türü' })
  @IsOptional()
  type?: ServiceType;

  @ApiProperty({
    description: 'Maksimum kapasite',
    example: 1,
    required: false,
  })
  @IsNumber({}, { message: 'Kapasite sayısal bir değer olmalıdır' })
  @Min(1, { message: 'Kapasite en az 1 olmalıdır' })
  @IsOptional()
  maxCapacity?: number;
}


