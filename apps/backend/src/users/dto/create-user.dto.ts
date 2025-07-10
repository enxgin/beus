import { IsEmail, IsString, IsEnum, MinLength, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// UserRole enum'unu doğrudan tanımlayalım (Prisma client runtime sorununu çözmek için)
export enum UserRole {
  STAFF = 'STAFF',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  CUSTOMER = 'CUSTOMER'
}

export class CreateUserDto {
  @ApiProperty({ example: 'staff@example.com', description: 'Kullanıcı e-posta adresi' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Kullanıcı şifresi' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ example: 'Selin Yılmaz', description: 'Kullanıcının tam adı' })
  @IsString()
  @IsNotEmpty({ message: 'Ad alanı boş olamaz' })
  name: string;

  // Orijinal haline geri döndü, çünkü doğru import ile artık çalışacak
  @ApiProperty({ enum: UserRole, description: 'Kullanıcı rolü', default: UserRole.STAFF })
  @IsEnum(UserRole, { message: 'Geçerli bir rol giriniz' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Çalıştığı şube ID', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: true, description: 'Kullanıcının aktif/pasif durumu', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}