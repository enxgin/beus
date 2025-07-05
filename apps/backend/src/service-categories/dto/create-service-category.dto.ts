import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  branchId?: string;
}
