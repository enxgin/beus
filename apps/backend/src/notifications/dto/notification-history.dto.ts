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

export class NotificationHistoryDto {
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

  @IsOptional()
  @IsDateString()
  readAt?: string;

  @IsNumber()
  retryCount: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  providerResponse?: Record<string, any>;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  // İlişkili veriler
  @IsOptional()
  @IsObject()
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };

  @IsOptional()
  @IsObject()
  template?: {
    id: string;
    name: string;
    type: NotificationType;
  };

  @IsOptional()
  @IsObject()
  branch?: {
    id: string;
    name: string;
  };
}