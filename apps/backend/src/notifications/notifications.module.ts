import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';

// Services
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationTriggerService } from './services/notification-trigger.service';
import { NotificationSettingsService } from './services/notification-settings.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationHistoryService } from './services/notification-history.service';
import { SmsService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';
import { EmailService } from './services/email.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';

// Controllers
import { NotificationTemplateController } from './controllers/notification-template.controller';
import { NotificationTriggerController } from './controllers/notification-trigger.controller';
import { NotificationSettingsController } from './controllers/notification-settings.controller';
import { NotificationQueueController } from './controllers/notification-queue.controller';
import { NotificationHistoryController } from './controllers/notification-history.controller';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Enable cron jobs for scheduler
  ],
  controllers: [
    NotificationTemplateController,
    NotificationTriggerController,
    NotificationSettingsController,
    NotificationQueueController,
    NotificationHistoryController,
  ],
  providers: [
    // Core notification services
    NotificationTemplateService,
    NotificationTriggerService,
    NotificationSettingsService,
    NotificationQueueService,
    NotificationHistoryService,
    
    // Provider services
    SmsService,
    WhatsAppService,
    EmailService,
    
    // Scheduler service
    NotificationSchedulerService,
  ],
  exports: [
    // Export services that might be used by other modules
    NotificationTemplateService,
    NotificationTriggerService,
    NotificationSettingsService,
    NotificationQueueService,
    NotificationHistoryService,
    SmsService,
    WhatsAppService,
    EmailService,
    NotificationSchedulerService,
  ],
})
export class NotificationsModule {}