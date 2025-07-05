import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com', description: 'Kullanıcı e-posta adresi' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Kullanıcı şifresi' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Kullanıcının tam adı' })
  @IsString()
  @IsNotEmpty({ message: 'Ad alanı boş olamaz' })
  name: string;
}
