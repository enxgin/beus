import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationTriggerDto } from '../dto/create-notification-trigger.dto';
import { UpdateNotificationTriggerDto } from '../dto/update-notification-trigger.dto';
import { User } from '@prisma/client';

// Local enum definitions to avoid Prisma client import issues
enum NotificationEventType {
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

// Local interface for NotificationTrigger
interface NotificationTrigger {
  id: string;
  name: string;
  eventType: string;
  conditions: any;
  templateId: string;
  branchId: string;
  isActive: boolean;
  priority: number;
  schedule?: string;
  createdAt: Date;
  updatedAt: Date;
  template?: any;
  branch?: any;
}

@Injectable()
export class NotificationTriggerService {
  constructor(private prisma: PrismaService) {}

  async create(
    createNotificationTriggerDto: CreateNotificationTriggerDto,
    user: User,
  ): Promise<NotificationTrigger> {
    // Kullanıcının şube erişim kontrolü
    await this.validateBranchAccess(user, createNotificationTriggerDto.branchId);

    // Template'in aynı şubede olduğunu kontrol et
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: createNotificationTriggerDto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Bildirim şablonu bulunamadı');
    }

    if (template.branchId !== createNotificationTriggerDto.branchId) {
      throw new ForbiddenException('Şablon farklı bir şubeye ait');
    }

    return this.prisma.notificationTrigger.create({
      data: {
        name: createNotificationTriggerDto.name,
        eventType: createNotificationTriggerDto.eventType as any,
        conditions: createNotificationTriggerDto.conditions || {},
        templateId: createNotificationTriggerDto.templateId,
        branchId: createNotificationTriggerDto.branchId,
        isActive: createNotificationTriggerDto.isActive ?? true,
        priority: createNotificationTriggerDto.priority || 1,
        schedule: createNotificationTriggerDto.schedule,
      },
      include: {
        template: true,
        branch: true,
      },
    });
  }

  async findAll(user: User, branchId?: string): Promise<NotificationTrigger[]> {
    const whereClause: any = {};

    // Rol bazlı erişim kontrolü
    if (user.role === 'ADMIN') {
      // Admin tüm şubeleri görebilir
      if (branchId) {
        whereClause.branchId = branchId;
      }
    } else if (user.role === 'SUPER_BRANCH_MANAGER') {
      // Super branch manager sadece bağlı olduğu şubeleri görebilir
      whereClause.branchId = user.branchId;
    } else {
      // Diğer roller sadece kendi şubelerini görebilir
      whereClause.branchId = user.branchId;
    }

    return this.prisma.notificationTrigger.findMany({
      where: whereClause,
      include: {
        template: true,
        branch: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, user: User): Promise<NotificationTrigger> {
    const trigger = await this.prisma.notificationTrigger.findUnique({
      where: { id },
      include: {
        template: true,
        branch: true,
      },
    });

    if (!trigger) {
      throw new NotFoundException('Bildirim tetikleyicisi bulunamadı');
    }

    // Şube erişim kontrolü
    await this.validateBranchAccess(user, trigger.branchId);

    return trigger;
  }

  async update(
    id: string,
    updateNotificationTriggerDto: UpdateNotificationTriggerDto,
    user: User,
  ): Promise<NotificationTrigger> {
    const existingTrigger = await this.findOne(id, user);

    // Şube değişikliği varsa yeni şube erişim kontrolü
    if (updateNotificationTriggerDto.branchId) {
      await this.validateBranchAccess(user, updateNotificationTriggerDto.branchId);
    }

    // Template değişikliği varsa template kontrolü
    if (updateNotificationTriggerDto.templateId) {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { id: updateNotificationTriggerDto.templateId },
      });

      if (!template) {
        throw new NotFoundException('Bildirim şablonu bulunamadı');
      }

      const targetBranchId = updateNotificationTriggerDto.branchId || existingTrigger.branchId;
      if (template.branchId !== targetBranchId) {
        throw new ForbiddenException('Şablon farklı bir şubeye ait');
      }
    }

    return this.prisma.notificationTrigger.update({
      where: { id },
      data: updateNotificationTriggerDto as any,
      include: {
        template: true,
        branch: true,
      },
    });
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // Erişim kontrolü için

    await this.prisma.notificationTrigger.delete({
      where: { id },
    });
  }

  async findByEventType(
    eventType: NotificationEventType,
    branchId: string,
    user: User,
  ): Promise<NotificationTrigger[]> {
    // Şube erişim kontrolü
    await this.validateBranchAccess(user, branchId);

    return this.prisma.notificationTrigger.findMany({
      where: {
        eventType: eventType as any,
        branchId,
        isActive: true,
      },
      include: {
        template: true,
        branch: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async toggleActive(id: string, user: User): Promise<NotificationTrigger> {
    const trigger = await this.findOne(id, user);

    return this.prisma.notificationTrigger.update({
      where: { id },
      data: {
        isActive: !trigger.isActive,
      },
      include: {
        template: true,
        branch: true,
      },
    });
  }

  async duplicate(id: string, user: User): Promise<NotificationTrigger> {
    const originalTrigger = await this.findOne(id, user);

    const duplicateData = {
      name: `${originalTrigger.name} (Kopya)`,
      eventType: originalTrigger.eventType,
      conditions: originalTrigger.conditions,
      templateId: originalTrigger.templateId,
      branchId: originalTrigger.branchId,
      isActive: false, // Kopya varsayılan olarak pasif
      priority: originalTrigger.priority,
      schedule: originalTrigger.schedule,
    };

    return this.prisma.notificationTrigger.create({
      data: duplicateData as any,
      include: {
        template: true,
        branch: true,
      },
    });
  }

  async findActiveByBranch(branchId: string): Promise<NotificationTrigger[]> {
    return this.prisma.notificationTrigger.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        template: true,
        branch: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  private async validateBranchAccess(user: User, branchId: string): Promise<void> {
    if (user.role === 'ADMIN') {
      return; // Admin her şubeye erişebilir
    }

    // Diğer roller sadece kendi şubelerine erişebilir
    if (user.branchId !== branchId) {
      throw new ForbiddenException('Bu şubeye erişim yetkiniz yok');
    }
  }
}