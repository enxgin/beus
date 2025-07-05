import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpdatePackageServiceDto {
  @ApiProperty({ description: 'Hizmet ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir hizmet ID değeri giriniz' })
  @IsNotEmpty({ message: 'Hizmet ID boş olamaz' })
  serviceId: string;

  @ApiProperty({ description: 'Hizmetin pakette kaç kere kullanılabileceği', example: 10 })
  @IsNumber({}, { message: 'Miktar bir sayı olmalıdır' })
  @IsPositive({ message: 'Miktar pozitif bir sayı olmalıdır' })
  quantity: number;
}
