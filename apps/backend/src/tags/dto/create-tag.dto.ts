import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
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
