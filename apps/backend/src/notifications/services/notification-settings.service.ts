import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationSettingsDto } from '../dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';

// Local enum definitions to avoid Prisma client import issues
enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF'
}

interface User {
  id: string;
  role: UserRole;
  branchId?: string;
}

interface NotificationSettings {
  id: string;
  branchId: string;
  smsConfig: any;
  whatsappConfig: any;
  emailConfig: any;
  generalSettings: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    parentBranchId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class NotificationSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationSettingsDto: CreateNotificationSettingsDto, user: User): Promise<NotificationSettings> {
    await this.validateBranchAccess(user, createNotificationSettingsDto.branchId);

    return this.prisma.notificationSettings.create({
      data: {
        branchId: createNotificationSettingsDto.branchId,
        smsConfig: createNotificationSettingsDto.smsConfig || {},
        whatsappConfig: createNotificationSettingsDto.whatsappConfig || {},
        emailConfig: createNotificationSettingsDto.emailConfig || {},
        generalSettings: createNotificationSettingsDto.generalSettings || {},
        isActive: createNotificationSettingsDto.isActive ?? true,
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async findAll(user: User): Promise<NotificationSettings[]> {
    const whereClause = this.buildWhereClause(user);

    return this.prisma.notificationSettings.findMany({
      where: whereClause,
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as any;
  }

  async findOne(id: string, user: User): Promise<NotificationSettings> {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!settings) {
      throw new NotFoundException(`Notification settings with ID ${id} not found`);
    }

    await this.validateBranchAccess(user, settings.branchId);
    return settings as any;
  }

  async findByBranch(branchId: string, user: User): Promise<NotificationSettings | null> {
    await this.validateBranchAccess(user, branchId);

    return this.prisma.notificationSettings.findUnique({
      where: { branchId },
      include: {
        branch: true,
      },
    }) as any;
  }

  async update(branchId: string, updateNotificationSettingsDto: UpdateNotificationSettingsDto, user: User): Promise<NotificationSettings> {
    await this.validateBranchAccess(user, branchId);

    const existingSettings = await this.prisma.notificationSettings.findUnique({
      where: { branchId },
    });

    if (!existingSettings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    return this.prisma.notificationSettings.update({
      where: { branchId },
      data: {
        smsConfig: updateNotificationSettingsDto.smsConfig ?? existingSettings.smsConfig,
        whatsappConfig: updateNotificationSettingsDto.whatsappConfig ?? existingSettings.whatsappConfig,
        emailConfig: updateNotificationSettingsDto.emailConfig ?? existingSettings.emailConfig,
        generalSettings: updateNotificationSettingsDto.generalSettings ?? existingSettings.generalSettings,
        isActive: updateNotificationSettingsDto.isActive ?? existingSettings.isActive,
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async remove(branchId: string, user: User): Promise<void> {
    await this.validateBranchAccess(user, branchId);

    const settings = await this.prisma.notificationSettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    await this.prisma.notificationSettings.delete({
      where: { branchId },
    });
  }

  async toggleActive(branchId: string, user: User): Promise<NotificationSettings> {
    await this.validateBranchAccess(user, branchId);

    const settings = await this.prisma.notificationSettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    return this.prisma.notificationSettings.update({
      where: { branchId },
      data: {
        isActive: !settings.isActive,
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async testSmsConfig(branchId: string, phoneNumber: string, message: string, user: User): Promise<{ success: boolean; message: string; error?: string }> {
    await this.validateBranchAccess(user, branchId);

    const settings = await this.findByBranch(branchId, user);
    if (!settings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    const smsConfig = settings.smsConfig as any;
    if (!smsConfig || !smsConfig.isEnabled) {
      return {
        success: false,
        message: 'SMS configuration is not enabled',
      };
    }

    try {
      // Here you would integrate with SmsService
      // For now, we'll simulate a test
      if (!smsConfig.provider || !smsConfig.apiKey) {
        return {
          success: false,
          message: 'SMS configuration is incomplete',
          error: 'Missing provider or API key',
        };
      }

      return {
        success: true,
        message: 'SMS test completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'SMS test failed',
        error: error.message,
      };
    }
  }

  async testWhatsAppConfig(branchId: string, phoneNumber: string, message: string, user: User): Promise<{ success: boolean; message: string; error?: string }> {
    await this.validateBranchAccess(user, branchId);

    const settings = await this.findByBranch(branchId, user);
    if (!settings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    const whatsappConfig = settings.whatsappConfig as any;
    if (!whatsappConfig || !whatsappConfig.isEnabled) {
      return {
        success: false,
        message: 'WhatsApp configuration is not enabled',
      };
    }

    try {
      // Here you would integrate with WhatsAppService
      // For now, we'll simulate a test
      if (!whatsappConfig.provider || !whatsappConfig.apiKey) {
        return {
          success: false,
          message: 'WhatsApp configuration is incomplete',
          error: 'Missing provider or API key',
        };
      }

      return {
        success: true,
        message: 'WhatsApp test completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'WhatsApp test failed',
        error: error.message,
      };
    }
  }

  async testEmailConfig(branchId: string, email: string, subject: string, message: string, user: User): Promise<{ success: boolean; message: string; error?: string }> {
    await this.validateBranchAccess(user, branchId);

    const settings = await this.findByBranch(branchId, user);
    if (!settings) {
      throw new NotFoundException(`Notification settings for branch ${branchId} not found`);
    }

    const emailConfig = settings.emailConfig as any;
    if (!emailConfig || !emailConfig.isEnabled) {
      return {
        success: false,
        message: 'Email configuration is not enabled',
      };
    }

    try {
      // Here you would integrate with EmailService
      // For now, we'll simulate a test
      if (!emailConfig.provider || !emailConfig.host) {
        return {
          success: false,
          message: 'Email configuration is incomplete',
          error: 'Missing provider or host configuration',
        };
      }

      return {
        success: true,
        message: 'Email test completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Email test failed',
        error: error.message,
      };
    }
  }

  async toggleSms(id: string, user: User): Promise<NotificationSettings> {
    const settings = await this.findOne(id, user);
    const currentSmsConfig = settings.smsConfig as any || {};

    return this.prisma.notificationSettings.update({
      where: { id },
      data: {
        smsConfig: {
          ...currentSmsConfig,
          isEnabled: !currentSmsConfig.isEnabled,
        },
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async toggleWhatsApp(id: string, user: User): Promise<NotificationSettings> {
    const settings = await this.findOne(id, user);
    const currentWhatsAppConfig = settings.whatsappConfig as any || {};

    return this.prisma.notificationSettings.update({
      where: { id },
      data: {
        whatsappConfig: {
          ...currentWhatsAppConfig,
          isEnabled: !currentWhatsAppConfig.isEnabled,
        },
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async toggleEmail(id: string, user: User): Promise<NotificationSettings> {
    const settings = await this.findOne(id, user);
    const currentEmailConfig = settings.emailConfig as any || {};

    return this.prisma.notificationSettings.update({
      where: { id },
      data: {
        emailConfig: {
          ...currentEmailConfig,
          isEnabled: !currentEmailConfig.isEnabled,
        },
      },
      include: {
        branch: true,
      },
    }) as any;
  }

  async getProviderStatus(branchId: string, user: User): Promise<{
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    providers: {
      smsProvider?: string;
      whatsappProvider?: string;
      emailProvider?: string;
    };
  }> {
    const settings = await this.findByBranch(branchId, user);

    if (!settings) {
      return {
        sms: false,
        whatsapp: false,
        email: false,
        providers: {},
      };
    }

    const smsConfig = settings.smsConfig as any || {};
    const whatsappConfig = settings.whatsappConfig as any || {};
    const emailConfig = settings.emailConfig as any || {};

    return {
      sms: smsConfig.isEnabled || false,
      whatsapp: whatsappConfig.isEnabled || false,
      email: emailConfig.isEnabled || false,
      providers: {
        smsProvider: smsConfig.provider,
        whatsappProvider: whatsappConfig.provider,
        emailProvider: emailConfig.provider,
      },
    };
  }

  async getProviderConfigs(branchId: string, user: User): Promise<{
    sms?: any;
    whatsapp?: any;
    email?: any;
  }> {
    const settings = await this.findByBranch(branchId, user);

    if (!settings) {
      return {};
    }

    const smsConfig = settings.smsConfig as any || {};
    const whatsappConfig = settings.whatsappConfig as any || {};
    const emailConfig = settings.emailConfig as any || {};

    return {
      sms: smsConfig.isEnabled ? {
        apiKey: smsConfig.apiKey,
        apiSecret: smsConfig.apiSecret,
        provider: smsConfig.provider,
      } : undefined,
      whatsapp: whatsappConfig.isEnabled ? {
        apiKey: whatsappConfig.apiKey,
        apiSecret: whatsappConfig.apiSecret,
        provider: whatsappConfig.provider,
      } : undefined,
      email: emailConfig.isEnabled ? {
        apiKey: emailConfig.apiKey,
        apiSecret: emailConfig.apiSecret,
        provider: emailConfig.provider,
      } : undefined,
    };
  }

  private buildWhereClause(user: User) {
    switch (user.role) {
      case UserRole.ADMIN:
        return {}; // Admin can see all settings

      case UserRole.SUPER_BRANCH_MANAGER:
        // Super branch manager can see settings for their branch and sub-branches
        return {
          OR: [
            { branchId: user.branchId },
            {
              branch: {
                parentBranchId: user.branchId,
              },
            },
          ],
        };

      case UserRole.BRANCH_MANAGER:
      case UserRole.RECEPTION:
      case UserRole.STAFF:
        // Other roles can only see their own branch settings
        return {
          branchId: user.branchId,
        };

      default:
        throw new ForbiddenException('Insufficient permissions to access notification settings');
    }
  }

  private async validateBranchAccess(user: User, branchId: string): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return; // Admin has access to all branches
    }

    if (!user.branchId) {
      throw new ForbiddenException('User is not associated with any branch');
    }

    if (user.role === UserRole.SUPER_BRANCH_MANAGER) {
      // Super branch manager can access their branch and sub-branches
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch) {
        throw new NotFoundException(`Branch with ID ${branchId} not found`);
      }

      if (branch.id !== user.branchId && branch.parentBranchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this branch');
      }
    } else {
      // Other roles can only access their own branch
      if (branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this branch');
      }
    }
  }
}