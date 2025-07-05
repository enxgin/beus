import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  IsArray,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Müşterinin adı ve soyadı',
    example: 'Ahmet Yılmaz',
    required: true,
  })
  @IsNotEmpty({ message: 'Müşteri adı boş olamaz' })
  @IsString({ message: 'Müşteri adı metin formatında olmalıdır' })
  name!: string;

  @ApiProperty({
    description: 'Müşterinin telefon numarası (benzersiz olmalıdır)',
    example: '+905551234567',
    required: true,
  })
  @IsNotEmpty({ message: 'Telefon numarası boş olamaz' })
  @IsPhoneNumber('TR', { message: 'Geçerli bir Türkiye telefon numarası giriniz' })
  phone!: string;

  @ApiProperty({
    description: 'Müşterinin e-posta adresi',
    example: 'ahmet.yilmaz@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email?: string;

  @ApiProperty({
    description: 'Müşteri hakkında notlar',
    example: 'Hassas cilt yapısı var, dikkat edilmeli',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notlar metin formatında olmalıdır' })
  notes?: string;

  @ApiProperty({
    description: 'Müşteriye özel indirim oranı (0-1 arası)',
    example: 0.1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'İndirim oranı sayı olmalıdır' })
  @Min(0, { message: 'İndirim oranı 0 veya daha büyük olmalıdır' })
  discountRate?: number;

  @ApiProperty({
    description: 'Müşterinin kredi bakiyesi',
    example: 150,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kredi bakiyesi sayı olmalıdır' })
  @Min(0, { message: 'Kredi bakiyesi 0 veya daha büyük olmalıdır' })
  creditBalance?: number;

  @ApiProperty({
    description: 'Müşterinin kayıtlı olduğu şube ID',
    example: 'clg2sdj8c000008l56ryo3f0z',
    required: true,
  })
  @IsNotEmpty({ message: 'Şube ID boş olamaz' })
  @IsString({ message: 'Şube ID metin formatında olmalıdır' })
  branchId!: string;

  @ApiProperty({
    description: 'Müşteriye atanacak etiketlerin IDleri',
    type: [String],
    required: false,
    example: ['clg2sdj8c000008l56ryo3f0z', 'clg2sdj8c000008l56ryo3f1a']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
