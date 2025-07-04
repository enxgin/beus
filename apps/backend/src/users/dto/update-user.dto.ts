import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiProperty({ example: 'newpassword123', description: 'Yeni şifre (isteğe bağlı)', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
