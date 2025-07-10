import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsArray, IsDateString } from 'class-validator';

export enum NotificationEventType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  BIRTHDAY_REMINDER = 'BIRTHDAY_REMINDER',
  PACKAGE_EXPIRY_WARNING = 'PACKAGE_EXPIRY_WARNING',
  PACKAGE_EXPIRED = 'PACKAGE_EXPIRED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
  CUSTOM_MESSAGE = 'CUSTOM_MESSAGE'
}

export class CreateNotificationTriggerDto {
  @IsString()
  name: string;

  @IsEnum(NotificationEventType)
  eventType: NotificationEventType;

  @IsString()
  templateId: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: number;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerTags?: string[];

  @IsOptional()
  @IsString()
  scheduledTime?: string; // Cron expression for scheduled triggers

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}