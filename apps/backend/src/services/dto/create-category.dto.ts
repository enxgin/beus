import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Kategori adı', example: 'Cilt Bakımı' })
  @IsString()
  @IsNotEmpty({ message: 'Kategori adı boş olamaz' })
  name: string;

  @ApiProperty({ description: 'Kategori açıklaması', example: 'Cilt bakımı hizmetleri', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Kategori aktif mi?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
