import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class TagDto {
  @ApiProperty({
    description: 'Etiket adı',
    example: 'VIP',
    required: true,
  })
  @IsNotEmpty({ message: 'Etiket adı boş olamaz' })
  @IsString({ message: 'Etiket adı metin formatında olmalıdır' })
  name!: string;

  @ApiProperty({
    description: 'Etiket rengi (hex formatında)',
    example: '#FF5733',
    required: true,
  })
  @IsNotEmpty({ message: 'Etiket rengi boş olamaz' })
  @IsString({ message: 'Etiket rengi metin formatında olmalıdır' })
  color!: string;
}

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
    required: false,
  })
  @IsOptional() // Kullanıcının şubesi otomatik atanabilir
  @IsString({ message: 'Şube ID metin formatında olmalıdır' })
  branchId?: string;

  @ApiProperty({
    description: 'Müşteri etiketleri',
    type: [TagDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];
}
