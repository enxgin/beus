import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsArray,
} from 'class-validator';

export class PackageServiceDto {
  @ApiProperty({ description: 'Hizmet ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsNotEmpty({ message: 'Hizmet ID boş olamaz' })
  serviceId: string;

  @ApiProperty({ description: 'Hizmetin pakette kaç kere kullanılabileceği', example: 10 })
  @IsNumber({}, { message: 'Miktar bir sayı olmalıdır' })
  @IsPositive({ message: 'Miktar pozitif bir sayı olmalıdır' })
  quantity: number;
}

export class CreatePackageDto {
  @ApiProperty({ description: 'Paket adı', example: 'Saç Bakım Paketi' })
  @IsString()
  @IsNotEmpty({ message: 'Paket adı boş olamaz' })
  name: string;

  @ApiProperty({ description: 'Paket açıklaması', example: '10 seans saç bakımı içerir' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Paket fiyatı', example: 2500 })
  @IsNumber({}, { message: 'Fiyat bir sayı olmalıdır' })
  @IsPositive({ message: 'Fiyat pozitif bir sayı olmalıdır' })
  price: number;

  @ApiProperty({ description: 'İndirimli fiyat (opsiyonel)', example: 2000, required: false })
  @IsNumber({}, { message: 'İndirimli fiyat bir sayı olmalıdır' })
  @IsPositive({ message: 'İndirimli fiyat pozitif bir sayı olmalıdır' })
  @IsOptional()
  discountedPrice?: number;

  @ApiProperty({ description: 'Paketin geçerlilik süresi (gün)', example: 365 })
  @IsNumber({}, { message: 'Geçerlilik süresi bir sayı olmalıdır' })
  @IsPositive({ message: 'Geçerlilik süresi pozitif bir sayı olmalıdır' })
  validityDays: number;

  @ApiProperty({ description: 'Satış primi yüzdesi (opsiyonel)', example: 10, required: false })
  @IsNumber({}, { message: 'Prim yüzdesi bir sayı olmalıdır' })
  @Min(0, { message: 'Prim yüzdesi negatif olamaz' })
  @IsOptional()
  commissionRate?: number;

  @ApiProperty({ description: 'Sabit satış primi (opsiyonel)', example: 100, required: false })
  @IsNumber({}, { message: 'Sabit prim bir sayı olmalıdır' })
  @Min(0, { message: 'Sabit prim negatif olamaz' })
  @IsOptional()
  commissionFixed?: number;

  @ApiProperty({
    description: 'Pakete dahil hizmetler',
    type: [PackageServiceDto],
    example: [
      { serviceId: '1a2b3c4d5e6f7g8h9i0j', quantity: 10 },
      { serviceId: '2b3c4d5e6f7g8h9i0j1a', quantity: 5 }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageServiceDto)
  @ArrayMinSize(1, { message: 'En az bir hizmet eklenmelidir' })
  services: PackageServiceDto[];
}
