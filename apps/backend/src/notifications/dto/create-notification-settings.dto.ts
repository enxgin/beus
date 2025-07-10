import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateNotificationSettingsDto {
  @IsString()
  branchId: string;

  @IsOptional()
  @IsObject()
  smsConfig?: {
    provider?: string;
    apiKey?: string;
    apiSecret?: string;
    sender?: string;
    isEnabled?: boolean;
    dailyLimit?: number;
    monthlyLimit?: number;
    defaultReminderMinutes?: number;
    businessHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
      workDays: number[];
    };
    retrySettings?: {
      maxRetries: number;
      retryDelayMinutes: number;
      exponentialBackoff: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  whatsappConfig?: {
    provider?: string;
    apiKey?: string;
    phoneNumberId?: string;
    accessToken?: string;
    webhookToken?: string;
    isEnabled?: boolean;
    dailyLimit?: number;
    monthlyLimit?: number;
    defaultReminderMinutes?: number;
    businessHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
      workDays: number[];
    };
    retrySettings?: {
      maxRetries: number;
      retryDelayMinutes: number;
      exponentialBackoff: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  emailConfig?: {
    provider?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail?: string;
    fromName?: string;
    isEnabled?: boolean;
    dailyLimit?: number;
    monthlyLimit?: number;
    defaultReminderMinutes?: number;
    businessHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
      workDays: number[];
    };
    retrySettings?: {
      maxRetries: number;
      retryDelayMinutes: number;
      exponentialBackoff: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  generalSettings?: {
    requireOptIn?: boolean;
    optInMessage?: string;
    optOutMessage?: string;
    allowedEventTypes?: string[];
    timezone?: string;
    language?: string;
    metadata?: Record<string, any>;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}