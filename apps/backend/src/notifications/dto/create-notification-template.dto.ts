import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';

export enum NotificationType {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

export class CreateNotificationTemplateDto {
  @IsString()
  name: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsString()
  language?: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
