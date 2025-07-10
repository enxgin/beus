import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';

// Local enum definitions to avoid Prisma client import issues
enum NotificationType {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

enum NotificationEventType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  BIRTHDAY = 'BIRTHDAY',
  PACKAGE_EXPIRY = 'PACKAGE_EXPIRY',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
  CUSTOM = 'CUSTOM'
}

enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

enum NotificationDeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ'
}

interface ProcessingResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly whatsAppService: WhatsAppService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    this.logger.log('Notification Scheduler Service initialized');
    // Process any pending notifications on startup
    await this.processQueue();
  }

  // Process notification queue every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue(): Promise<ProcessingResult> {
    if (this.isProcessing) {
      this.logger.debug('Queue processing already in progress, skipping...');
      return { processed: 0, sent: 0, failed: 0, errors: [] };
    }

    this.isProcessing = true;
    const result: ProcessingResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    };

    try {
      this.logger.debug('Starting queue processing...');

      // Get pending notifications that are ready to be sent
      const pendingNotifications = await this.prisma.notificationQueue.findMany({
        where: {
          status: NotificationStatus.PENDING as any,
          scheduledAt: {
            lte: new Date(),
          },
          retryCount: {
            lt: 3, // Maximum 3 retry attempts
          },
        },
        include: {
          template: true,
          customer: true,
          branch: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 50, // Process max 50 notifications at a time
      });

      this.logger.debug(`Found ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        try {
          result.processed++;
          
          // Get notification settings for the branch
          const settings = await this.prisma.notificationSettings.findFirst({
            where: {
              branchId: notification.branchId,
            },
          });

          if (!settings || !settings.isActive) {
            await this.markAsFailed(notification.id, 'Notification settings are disabled for this branch');
            result.failed++;
            continue;
          }

          // Check business hours if enabled
          if (settings.generalSettings && typeof settings.generalSettings === 'object') {
            const generalConfig = settings.generalSettings as any;
            if (generalConfig.respectBusinessHours && !this.isWithinBusinessHours(generalConfig)) {
              // Reschedule for next business hour
              await this.rescheduleForBusinessHours(notification.id, generalConfig);
              continue;
            }
          }

          // Send the notification
          const sendResult = await this.sendNotification(notification, settings);
          
          if (sendResult.success) {
            await this.markAsSent(notification.id, sendResult.messageId, sendResult.cost);
            result.sent++;
          } else {
            await this.markAsFailed(notification.id, sendResult.error);
            result.failed++;
            result.errors.push(`Notification ${notification.id}: ${sendResult.error}`);
          }

        } catch (error) {
          this.logger.error(`Error processing notification ${notification.id}: ${error.message}`, error.stack);
          await this.markAsFailed(notification.id, error.message);
          result.failed++;
          result.errors.push(`Notification ${notification.id}: ${error.message}`);
        }
      }

      this.logger.debug(`Queue processing completed. Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`);

    } catch (error) {
      this.logger.error(`Queue processing failed: ${error.message}`, error.stack);
      result.errors.push(`Queue processing error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  // Check for appointment reminders every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkAppointmentReminders(): Promise<void> {
    try {
      this.logger.debug('Checking for appointment reminders...');

      // Get active appointment reminder triggers
      const triggers = await this.prisma.notificationTrigger.findMany({
        where: {
          eventType: NotificationEventType.APPOINTMENT_REMINDER as any,
          isActive: true,
        },
        include: {
          template: true,
          branch: true,
        },
      });

      for (const trigger of triggers) {
        const reminderHours = (trigger.conditions as any)?.reminderHours || 24;
        const reminderTime = new Date();
        reminderTime.setHours(reminderTime.getHours() + reminderHours);

        // Find appointments that need reminders
        const appointments = await this.prisma.appointment.findMany({
          where: {
            branchId: trigger.branchId,
            startTime: {
              gte: new Date(),
              lte: reminderTime,
            },
            status: 'CONFIRMED',
          },
          include: {
            customer: true,
            service: true,
          },
        });

        for (const appointment of appointments) {
          // Check if reminder already sent
          const existingReminder = await this.prisma.notificationQueue.findFirst({
            where: {
              customerId: appointment.customerId,
              templateId: trigger.templateId,
              data: {
                path: ['appointmentId'],
                equals: appointment.id,
              },
              status: {
                in: [NotificationStatus.PENDING as any, NotificationStatus.SENT as any],
              },
            },
          });

          if (!existingReminder) {
            await this.scheduleNotification({
              branchId: trigger.branchId,
              customerId: appointment.customerId,
              templateId: trigger.templateId,
              scheduledAt: new Date(appointment.startTime.getTime() - (reminderHours * 60 * 60 * 1000)),
              data: {
                appointmentId: appointment.id,
                serviceName: appointment.service.name,
                appointmentTime: appointment.startTime.toISOString(),
              },
            });
          }
        }
      }

    } catch (error) {
      this.logger.error(`Appointment reminder check failed: ${error.message}`, error.stack);
    }
  }

  // Check for package expiry notifications daily at 10 AM
  @Cron('0 10 * * *')
  async checkPackageExpiryNotifications(): Promise<void> {
    try {
      this.logger.debug('Checking for package expiry notifications...');

      // Get active package expiry triggers
      const triggers = await this.prisma.notificationTrigger.findMany({
        where: {
          eventType: NotificationEventType.PACKAGE_EXPIRY as any,
          isActive: true,
        },
        include: {
          template: true,
          branch: true,
        },
      });

      for (const trigger of triggers) {
        const expiryDays = (trigger.conditions as any)?.expiryDays || 7;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        // Find packages expiring soon
        const packages = await this.prisma.customerPackage.findMany({
          where: {
            customer: {
              branchId: trigger.branchId,
            },
            expiryDate: {
              lte: expiryDate,
              gte: new Date(),
            },
          },
          include: {
            customer: true,
            package: true,
          },
        });

        for (const customerPackage of packages) {
          // Check if expiry reminder already sent
          const existingReminder = await this.prisma.notificationQueue.findFirst({
            where: {
              customerId: customerPackage.customerId,
              templateId: trigger.templateId,
              data: {
                path: ['packageId'],
                equals: customerPackage.id,
              },
              status: {
                in: [NotificationStatus.PENDING as any, NotificationStatus.SENT as any],
              },
            },
          });

          if (!existingReminder) {
            await this.scheduleNotification({
              branchId: trigger.branchId,
              customerId: customerPackage.customerId,
              templateId: trigger.templateId,
              scheduledAt: new Date(),
              data: {
                packageId: customerPackage.id,
                packageName: customerPackage.package.name,
                expiryDate: customerPackage.expiryDate?.toISOString(),
                remainingSessions: customerPackage.remainingSessions,
              },
            });
          }
        }
      }

    } catch (error) {
      this.logger.error(`Package expiry notification check failed: ${error.message}`, error.stack);
    }
  }

  async scheduleNotification(data: {
    branchId: string;
    customerId: string;
    templateId: string;
    scheduledAt: Date;
    data?: any;
  }): Promise<void> {
    try {
      await this.prisma.notificationQueue.create({
        data: {
          branchId: data.branchId,
          customerId: data.customerId,
          templateId: data.templateId,
          scheduledAt: data.scheduledAt,
          data: data.data || {},
          status: NotificationStatus.PENDING as any,
        },
      });

      this.logger.debug(`Notification scheduled for customer ${data.customerId} at ${data.scheduledAt}`);
    } catch (error) {
      this.logger.error(`Failed to schedule notification: ${error.message}`, error.stack);
    }
  }

  private async sendNotification(notification: any, settings: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    cost?: number;
  }> {
    const { template, customer } = notification;
    
    // Replace template variables
    const message = this.replaceTemplateVariables(template.content, {
      customerName: customer.name,
      branchName: notification.branch.name,
      ...notification.data,
    });

    switch (template.type) {
      case NotificationType.SMS:
        const smsConfig = settings.smsConfig;
        return await this.smsService.sendSms(smsConfig, {
          to: customer.phone,
          message,
        });

      case NotificationType.WHATSAPP:
        const whatsappConfig = settings.whatsappConfig;
        return await this.whatsAppService.sendMessage(whatsappConfig, {
          to: customer.phone,
          message,
        });

      case NotificationType.EMAIL:
        const emailConfig = settings.emailConfig;
        return await this.emailService.sendEmail(emailConfig, {
          to: customer.email,
          subject: template.subject || 'Bildirim',
          text: message,
          html: template.content || message,
        });

      default:
        return {
          success: false,
          error: `Unsupported notification type: ${template.type}`,
        };
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });
    
    return result;
  }

  private async markAsSent(notificationId: string, messageId?: string, cost?: number): Promise<void> {
    await this.prisma.notificationQueue.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.SENT as any,
        sentAt: new Date(),
      },
    });

    // Create history record
    const notification = await this.prisma.notificationQueue.findUnique({
      where: { id: notificationId },
      include: { template: true },
    });

    if (notification) {
      await this.prisma.notificationHistory.create({
        data: {
          branchId: notification.branchId,
          customerId: notification.customerId,
          templateId: notification.templateId,
          type: notification.template.type as any,
          status: NotificationDeliveryStatus.DELIVERED as any,
          content: notification.template.content,
          metadata: { messageId, cost },
          cost,
          sentAt: new Date(),
        },
      });
    }
  }

  private async markAsFailed(notificationId: string, error: string): Promise<void> {
    const notification = await this.prisma.notificationQueue.findUnique({
      where: { id: notificationId },
      include: { template: true },
    });

    if (!notification) return;

    const retryCount = notification.retryCount + 1;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, retryCount) * 60 * 1000; // 2^n minutes
      const nextRetry = new Date(Date.now() + retryDelay);

      await this.prisma.notificationQueue.update({
        where: { id: notificationId },
        data: {
          retryCount,
          scheduledAt: nextRetry,
          errorMessage: error,
        },
      });
    } else {
      // Mark as failed after max retries
      await this.prisma.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED as any,
          retryCount,
          errorMessage: error,
        },
      });

      // Create history record
      await this.prisma.notificationHistory.create({
        data: {
          branchId: notification.branchId,
          customerId: notification.customerId,
          templateId: notification.templateId,
          type: notification.template.type as any,
          status: NotificationDeliveryStatus.FAILED as any,
          content: notification.template.content,
          metadata: { error },
          sentAt: new Date(),
        },
      });
    }
  }

  private isWithinBusinessHours(config: any): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const startHour = config.businessHours?.start || 9;
    const endHour = config.businessHours?.end || 18;
    const workDays = config.businessHours?.workDays || [1, 2, 3, 4, 5]; // Monday to Friday

    return workDays.includes(currentDay) && currentHour >= startHour && currentHour < endHour;
  }

  private async rescheduleForBusinessHours(notificationId: string, config: any): Promise<void> {
    const now = new Date();
    const startHour = config.businessHours?.start || 9;
    const workDays = config.businessHours?.workDays || [1, 2, 3, 4, 5];

    // Find next business day and hour
    let nextBusinessDay = new Date(now);
    nextBusinessDay.setHours(startHour, 0, 0, 0);

    // If today is not a work day or we're past business hours, move to next work day
    while (!workDays.includes(nextBusinessDay.getDay()) || nextBusinessDay <= now) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
      nextBusinessDay.setHours(startHour, 0, 0, 0);
    }

    await this.prisma.notificationQueue.update({
      where: { id: notificationId },
      data: {
        scheduledAt: nextBusinessDay,
      },
    });
  }

  // Manual method to trigger specific notifications
  async triggerManualNotification(data: {
    branchId: string;
    customerIds: string[];
    templateId: string;
    scheduledAt?: Date;
  }): Promise<{ success: boolean; scheduled: number; errors: string[] }> {
    const result = {
      success: true,
      scheduled: 0,
      errors: [],
    };

    try {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        return {
          success: false,
          scheduled: 0,
          errors: ['Template not found'],
        };
      }

      for (const customerId of data.customerIds) {
        try {
          await this.scheduleNotification({
            branchId: data.branchId,
            customerId,
            templateId: data.templateId,
            scheduledAt: data.scheduledAt || new Date(),
            data: {
              type: 'manual',
              triggeredAt: new Date().toISOString(),
            },
          });
          result.scheduled++;
        } catch (error) {
          result.errors.push(`Customer ${customerId}: ${error.message}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Manual trigger failed: ${error.message}`);
    }

    return result;
  }

  // Get scheduler statistics
  async getStatistics(): Promise<{
    queueSize: number;
    pendingCount: number;
    processingRate: number;
    lastProcessedAt: Date | null;
  }> {
    const [queueSize, pendingCount, lastProcessed] = await Promise.all([
      this.prisma.notificationQueue.count(),
      this.prisma.notificationQueue.count({
        where: { status: NotificationStatus.PENDING as any },
      }),
      this.prisma.notificationQueue.findFirst({
        where: { status: NotificationStatus.SENT as any },
        orderBy: { sentAt: 'desc' },
        select: { sentAt: true },
      }),
    ]);

    // Calculate processing rate (notifications per hour in last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const processedLast24h = await this.prisma.notificationQueue.count({
      where: {
        status: NotificationStatus.SENT as any,
        sentAt: { gte: last24Hours },
      },
    });

    return {
      queueSize,
      pendingCount,
      processingRate: Math.round(processedLast24h / 24),
      lastProcessedAt: lastProcessed?.sentAt || null,
    };
  }
}