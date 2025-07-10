import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, IsObject } from 'class-validator';

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ'
}

export enum NotificationType {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

export class NotificationQueueDto {
  @IsString()
  id: string;

  @IsString()
  branchId: string;

  @IsString()
  customerId: string;

  @IsString()
  templateId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  recipient: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @IsEnum(NotificationDeliveryStatus)
  deliveryStatus: NotificationDeliveryStatus;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsNumber()
  retryCount: number;

  @IsNumber()
  maxRetries: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}