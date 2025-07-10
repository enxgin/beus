import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../dto/update-notification-template.dto';
import { NotificationTemplate, User, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(
    createNotificationTemplateDto: CreateNotificationTemplateDto,
    user: User,
  ): Promise<NotificationTemplate> {
    // Kullanıcının şube erişim kontrolü
    await this.validateBranchAccess(user, createNotificationTemplateDto.branchId);

    return this.prisma.notificationTemplate.create({
      data: {
        name: createNotificationTemplateDto.name,
        type: createNotificationTemplateDto.type,
        subject: createNotificationTemplateDto.subject,
        content: createNotificationTemplateDto.content,
        variables: createNotificationTemplateDto.variables || {},
        language: createNotificationTemplateDto.language || 'tr',
        branchId: createNotificationTemplateDto.branchId,
        isActive: createNotificationTemplateDto.isActive ?? true,
      },
      include: {
        branch: true,
      },
    });
  }

  async findAll(user: User, branchId?: string): Promise<NotificationTemplate[]> {
    const whereClause: any = {};

    // Rol bazlı erişim kontrolü
    if (user.role === 'ADMIN') {
      // Admin tüm şubeleri görebilir
      if (branchId) {
        whereClause.branchId = branchId;
      }
    } else if (user.role === 'SUPER_BRANCH_MANAGER') {
      // Super branch manager sadece bağlı olduğu şubeleri görebilir
      // Not: UserBranch modeli olmadığı için şimdilik sadece kendi şubesini görebilir
      whereClause.branchId = user.branchId;
    } else {
      // Diğer roller sadece kendi şubelerini görebilir
      whereClause.branchId = user.branchId;
    }

    return this.prisma.notificationTemplate.findMany({
      where: whereClause,
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: User): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Bildirim şablonu bulunamadı');
    }

    // Şube erişim kontrolü
    await this.validateBranchAccess(user, template.branchId);

    return template;
  }

  async update(
    id: string,
    updateNotificationTemplateDto: UpdateNotificationTemplateDto,
    user: User,
  ): Promise<NotificationTemplate> {
    const existingTemplate = await this.findOne(id, user);

    // Şube değişikliği varsa yeni şube erişim kontrolü
    if (updateNotificationTemplateDto.branchId) {
      await this.validateBranchAccess(user, updateNotificationTemplateDto.branchId);
    }

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: updateNotificationTemplateDto,
      include: {
        branch: true,
      },
    });
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // Erişim kontrolü için

    await this.prisma.notificationTemplate.delete({
      where: { id },
    });
  }

  async findByType(
    type: NotificationType,
    branchId: string,
    user: User,
  ): Promise<NotificationTemplate[]> {
    // Şube erişim kontrolü
    await this.validateBranchAccess(user, branchId);

    return this.prisma.notificationTemplate.findMany({
      where: {
        type,
        branchId,
        isActive: true,
      },
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async toggleActive(id: string, user: User): Promise<NotificationTemplate> {
    const template = await this.findOne(id, user);

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        isActive: !template.isActive,
      },
      include: {
        branch: true,
      },
    });
  }

  async duplicate(id: string, user: User): Promise<NotificationTemplate> {
    const originalTemplate = await this.findOne(id, user);

    const duplicateData = {
      name: `${originalTemplate.name} (Kopya)`,
      type: originalTemplate.type,
      subject: originalTemplate.subject,
      content: originalTemplate.content,
      variables: originalTemplate.variables,
      language: originalTemplate.language,
      branchId: originalTemplate.branchId,
      isActive: false, // Kopya varsayılan olarak pasif
    };

    return this.prisma.notificationTemplate.create({
      data: duplicateData,
      include: {
        branch: true,
      },
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