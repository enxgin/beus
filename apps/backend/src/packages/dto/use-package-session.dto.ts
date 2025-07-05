import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UsePackageSessionDto {
  @ApiProperty({ description: 'Randevu ID', example: '1a2b3c4d5e6f7g8h9i0j' })
  @IsString()
  @IsUUID('all', { message: 'Geçerli bir randevu ID değeri giriniz' })
  @IsNotEmpty({ message: 'Randevu ID boş olamaz' })
  appointmentId: string;
}
