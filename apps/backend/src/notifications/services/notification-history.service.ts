import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Local enum definitions to avoid Prisma client import issues
enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF'
}

enum NotificationType {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

enum NotificationDeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ'
}

interface User {
  id: string;
  role: UserRole;
  branchId?: string;
}

interface NotificationHistory {
  id: string;
  customerId: string;
  templateId: string;
  triggerId: string | null;
  branchId: string;
  type: NotificationType;
  status: NotificationDeliveryStatus;
  content: string;
  metadata: any | null;
  cost: number | null;
  sentAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  template?: {
    id: string;
    name: string;
    type: NotificationType;
  };
  trigger?: {
    id: string;
    name: string;
    eventType: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  };
}

@Injectable()
export class NotificationHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    user: User,
    filters?: {
      type?: NotificationType;
      status?: NotificationDeliveryStatus;
      branchId?: string;
      customerId?: string;
      templateId?: string;
      sentAfter?: Date;
      sentBefore?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: NotificationHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause = this.buildWhereClause(user, filters);

    const [data, total] = await Promise.all([
      this.prisma.notificationHistory.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          trigger: {
            select: {
              id: true,
              name: true,
              eventType: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notificationHistory.count({ where: whereClause }),
    ]);

    return {
      data: data as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<NotificationHistory> {
    const historyItem = await this.prisma.notificationHistory.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            content: true,
          },
        },
        trigger: {
          select: {
            id: true,
            name: true,
            eventType: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!historyItem) {
      throw new NotFoundException(`Notification history item with ID ${id} not found`);
    }

    await this.validateBranchAccess(user, historyItem.branchId);
    return historyItem as any;
  }

  async findByCustomer(
    customerId: string,
    user: User,
    filters?: {
      type?: NotificationType;
      status?: NotificationDeliveryStatus;
      sentAfter?: Date;
      sentBefore?: Date;
      limit?: number;
    }
  ): Promise<NotificationHistory[]> {
    // First verify customer access
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    await this.validateBranchAccess(user, customer.branchId);

    const whereClause: any = { customerId };

    if (filters) {
      if (filters.type) {
        whereClause.type = filters.type;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.sentAfter || filters.sentBefore) {
        whereClause.sentAt = {};
        if (filters.sentAfter) {
          whereClause.sentAt.gte = filters.sentAfter;
        }
        if (filters.sentBefore) {
          whereClause.sentAt.lte = filters.sentBefore;
        }
      }
    }

    return this.prisma.notificationHistory.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        trigger: {
          select: {
            id: true,
            name: true,
            eventType: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: filters?.limit || 100,
    }) as any;
  }

  async markAsDelivered(id: string, deliveredAt?: Date): Promise<NotificationHistory> {
    return this.prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationDeliveryStatus.DELIVERED as any,
        deliveredAt: deliveredAt || new Date(),
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async markAsRead(id: string, readAt?: Date): Promise<NotificationHistory> {
    return this.prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationDeliveryStatus.READ as any,
        readAt: readAt || new Date(),
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async markAsFailed(id: string, metadata?: any): Promise<NotificationHistory> {
    return this.prisma.notificationHistory.update({
      where: { id },
      data: {
        status: NotificationDeliveryStatus.FAILED as any,
        metadata,
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async getStats(
    user: User,
    filters?: {
      branchId?: string;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalRead: number;
    deliveryRate: number;
    readRate: number;
    totalCost: number;
    byType: {
      sms: { sent: number; delivered: number; failed: number; cost: number };
      whatsapp: { sent: number; delivered: number; failed: number; cost: number };
      email: { sent: number; delivered: number; failed: number; cost: number };
    };
  }> {
    const whereClause = this.buildWhereClause(user, filters);

    const [
      totalSent,
      totalDelivered,
      totalFailed,
      totalRead,
      costResult,
      smsStats,
      whatsappStats,
      emailStats,
    ] = await Promise.all([
      this.prisma.notificationHistory.count({ where: whereClause }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: NotificationDeliveryStatus.DELIVERED as any },
      }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: NotificationDeliveryStatus.FAILED as any },
      }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: NotificationDeliveryStatus.READ as any },
      }),
      this.prisma.notificationHistory.aggregate({
        where: whereClause,
        _sum: { cost: true },
      }),
      this.getTypeStats(whereClause, NotificationType.SMS),
      this.getTypeStats(whereClause, NotificationType.WHATSAPP),
      this.getTypeStats(whereClause, NotificationType.EMAIL),
    ]);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
    const totalCost = costResult._sum.cost || 0;

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      totalRead,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      readRate: Math.round(readRate * 100) / 100,
      totalCost,
      byType: {
        sms: smsStats,
        whatsapp: whatsappStats,
        email: emailStats,
      },
    };
  }

  async getDailyStats(
    user: User,
    startDate: Date,
    endDate: Date,
    branchId?: string
  ): Promise<Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  }>> {
    const whereClause = this.buildWhereClause(user, { branchId });
    whereClause.sentAt = {
      gte: startDate,
      lte: endDate,
    };

    const results = await this.prisma.notificationHistory.groupBy({
      by: ['sentAt'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        cost: true,
      },
    });

    // Group by date and aggregate stats
    const dailyStats = new Map();

    for (const result of results) {
      const date = result.sentAt.toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          date,
          sent: 0,
          delivered: 0,
          failed: 0,
          cost: 0,
        });
      }
      const stats = dailyStats.get(date);
      stats.sent += result._count.id;
      stats.cost += result._sum.cost || 0;
    }

    return Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async remove(id: string, user: User): Promise<void> {
    const historyItem = await this.findOne(id, user);
    await this.prisma.notificationHistory.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: string[], user: User): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.remove(id, user);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async cleanup(
    olderThanDays: number,
    keepSuccessful: boolean,
    branchId?: string,
    user?: User,
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let whereClause: any = {
      sentAt: { lt: cutoffDate },
    };

    if (!keepSuccessful) {
      // Delete all old records
    } else {
      // Only delete failed records
      whereClause.status = 'FAILED' as any;
    }

    if (user) {
      const userWhereClause = this.buildWhereClause(user, { branchId });
      whereClause = { ...whereClause, ...userWhereClause };
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    const result = await this.prisma.notificationHistory.deleteMany({
      where: whereClause,
    });

    return { deleted: result.count };
  }

  async exportHistory(
    filters: {
      branchId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    format: 'csv' | 'excel',
    user: User,
  ): Promise<{ url: string; filename: string }> {
    // This would typically generate a file and return a download URL
    // For now, we'll return a mock response
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `notification-history-${timestamp}.${format}`;
    
    return {
      url: `/downloads/${filename}`,
      filename,
    };
  }

  async getDeliveryRates(
    branchId?: string,
    period?: 'today' | 'week' | 'month' | 'year',
    user?: User,
  ): Promise<{
    overall: { sent: number; delivered: number; failed: number; rate: number };
    byType: {
      SMS: { sent: number; delivered: number; failed: number; rate: number };
      WHATSAPP: { sent: number; delivered: number; failed: number; rate: number };
      EMAIL: { sent: number; delivered: number; failed: number; rate: number };
    };
  }> {
    let dateFilter = {};
    
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = {
        sentAt: {
          gte: startDate,
        },
      };
    }

    const whereClause = user
      ? this.buildWhereClause(user, { branchId, ...dateFilter })
      : branchId
        ? { branchId, ...dateFilter }
        : dateFilter;

    const [overallStats, smsStats, whatsappStats, emailStats] = await Promise.all([
      this.getDeliveryStatsForType(whereClause),
      this.getDeliveryStatsForType({ ...whereClause, type: 'SMS' as any }),
      this.getDeliveryStatsForType({ ...whereClause, type: 'WHATSAPP' as any }),
      this.getDeliveryStatsForType({ ...whereClause, type: 'EMAIL' as any }),
    ]);

    return {
      overall: overallStats,
      byType: {
        SMS: smsStats,
        WHATSAPP: whatsappStats,
        EMAIL: emailStats,
      },
    };
  }

  async getPopularTemplates(
    branchId?: string,
    period?: 'today' | 'week' | 'month' | 'year',
    limit: number = 10,
    user?: User,
  ): Promise<Array<{
    templateId: string;
    templateName: string;
    count: number;
    successRate: number;
  }>> {
    let dateFilter = {};
    
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = {
        sentAt: {
          gte: startDate,
        },
      };
    }

    const whereClause = user
      ? this.buildWhereClause(user, { branchId, ...dateFilter })
      : branchId
        ? { branchId, ...dateFilter }
        : dateFilter;

    const results = await this.prisma.notificationHistory.groupBy({
      by: ['templateId'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const templates = await Promise.all(
      results.map(async (result) => {
        const template = await this.prisma.notificationTemplate.findUnique({
          where: { id: result.templateId },
          select: { name: true },
        });

        const successCount = await this.prisma.notificationHistory.count({
          where: {
            ...whereClause,
            templateId: result.templateId,
            status: { in: ['SENT', 'DELIVERED', 'READ'] as any },
          },
        });

        return {
          templateId: result.templateId,
          templateName: template?.name || 'Unknown Template',
          count: result._count.id,
          successRate: result._count.id > 0 ? (successCount / result._count.id) * 100 : 0,
        };
      })
    );

    return templates;
  }

  async getCustomerActivity(
    customerId: string,
    limit: number = 50,
    user: User,
  ): Promise<NotificationHistory[]> {
    return this.findByCustomer(customerId, user, { limit });
  }

  async getTrends(
    branchId?: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    user?: User,
  ): Promise<Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>> {
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = 'day';
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupByFormat = 'day';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        groupByFormat = 'week';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupByFormat = 'month';
        break;
    }

    const whereClause = user
      ? this.buildWhereClause(user, { branchId, sentAfter: startDate })
      : branchId
        ? { branchId, sentAt: { gte: startDate } }
        : { sentAt: { gte: startDate } };

    // This is a simplified implementation
    // In a real scenario, you'd use more sophisticated date grouping
    const results = await this.prisma.notificationHistory.findMany({
      where: whereClause,
      select: {
        sentAt: true,
        status: true,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    // Group by date and calculate stats
    const trends = new Map();
    
    results.forEach((record) => {
      const date = record.sentAt.toISOString().split('T')[0];
      if (!trends.has(date)) {
        trends.set(date, {
          date,
          sent: 0,
          delivered: 0,
          failed: 0,
          deliveryRate: 0,
        });
      }
      
      const trend = trends.get(date);
      trend.sent++;
      
      if (['SENT', 'DELIVERED', 'READ'].includes(record.status)) {
        trend.delivered++;
      } else if (record.status === 'FAILED') {
        trend.failed++;
      }
    });

    // Calculate delivery rates
    trends.forEach((trend) => {
      trend.deliveryRate = trend.sent > 0 ? (trend.delivered / trend.sent) * 100 : 0;
    });

    return Array.from(trends.values());
  }

  async getPerformance(
    branchId?: string,
    period: 'today' | 'week' | 'month' | 'year' = 'month',
    user?: User,
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    avgResponseTime: number;
    costEfficiency: number;
    topPerformingTypes: Array<{
      type: string;
      deliveryRate: number;
      count: number;
    }>;
  }> {
    let dateFilter = {};
    
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = {
        sentAt: {
          gte: startDate,
        },
      };
    }

    const whereClause = user
      ? this.buildWhereClause(user, { branchId, ...dateFilter })
      : branchId
        ? { branchId, ...dateFilter }
        : dateFilter;

    const [totalSent, totalDelivered, totalFailed, typeStats] = await Promise.all([
      this.prisma.notificationHistory.count({ where: whereClause }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: { in: ['SENT', 'DELIVERED', 'READ'] as any } },
      }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: 'FAILED' as any },
      }),
      this.prisma.notificationHistory.groupBy({
        by: ['type'],
        where: whereClause,
        _count: { id: true },
      }),
    ]);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    // Calculate type performance
    const topPerformingTypes = await Promise.all(
      typeStats.map(async (stat) => {
        const delivered = await this.prisma.notificationHistory.count({
          where: {
            ...whereClause,
            type: stat.type,
            status: { in: ['SENT', 'DELIVERED', 'READ'] as any },
          },
        });

        return {
          type: stat.type,
          deliveryRate: stat._count.id > 0 ? (delivered / stat._count.id) * 100 : 0,
          count: stat._count.id,
        };
      })
    );

    topPerformingTypes.sort((a, b) => b.deliveryRate - a.deliveryRate);

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      avgResponseTime: 0, // Would need to calculate from actual delivery times
      costEfficiency: 0, // Would need to calculate cost per successful delivery
      topPerformingTypes,
    };
  }

  private async getDeliveryStatsForType(whereClause: any): Promise<{
    sent: number;
    delivered: number;
    failed: number;
    rate: number;
  }> {
    const [sent, delivered, failed] = await Promise.all([
      this.prisma.notificationHistory.count({ where: whereClause }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: { in: ['SENT', 'DELIVERED', 'READ'] as any } },
      }),
      this.prisma.notificationHistory.count({
        where: { ...whereClause, status: 'FAILED' as any },
      }),
    ]);

    const rate = sent > 0 ? (delivered / sent) * 100 : 0;

    return {
      sent,
      delivered,
      failed,
      rate: Math.round(rate * 100) / 100,
    };
  }

  private async getTypeStats(whereClause: any, type: NotificationType) {
    const typeWhere = { ...whereClause, type: type as any };

    const [sent, delivered, failed, costResult] = await Promise.all([
      this.prisma.notificationHistory.count({ where: typeWhere }),
      this.prisma.notificationHistory.count({
        where: { ...typeWhere, status: NotificationDeliveryStatus.DELIVERED as any },
      }),
      this.prisma.notificationHistory.count({
        where: { ...typeWhere, status: NotificationDeliveryStatus.FAILED as any },
      }),
      this.prisma.notificationHistory.aggregate({
        where: typeWhere,
        _sum: { cost: true },
      }),
    ]);

    return {
      sent,
      delivered,
      failed,
      cost: costResult._sum.cost || 0,
    };
  }

  private buildWhereClause(user: User, filters?: any) {
    let branchFilter = {};

    // Apply role-based branch filtering
    switch (user.role) {
      case UserRole.ADMIN:
        // Admin can see all notifications
        if (filters?.branchId) {
          branchFilter = { branchId: filters.branchId };
        }
        break;

      case UserRole.SUPER_BRANCH_MANAGER:
        // Super branch manager can see their branch and sub-branches
        branchFilter = {
          OR: [
            { branchId: user.branchId },
            {
              branch: {
                parentBranchId: user.branchId,
              },
            },
          ],
        };
        if (filters?.branchId) {
          branchFilter = { branchId: filters.branchId };
        }
        break;

      case UserRole.BRANCH_MANAGER:
      case UserRole.RECEPTION:
      case UserRole.STAFF:
        // Other roles can only see their own branch notifications
        branchFilter = { branchId: user.branchId };
        break;

      default:
        throw new ForbiddenException('Insufficient permissions to access notification history');
    }

    const whereClause: any = { ...branchFilter };

    // Apply additional filters
    if (filters) {
      if (filters.type) {
        whereClause.type = filters.type;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.customerId) {
        whereClause.customerId = filters.customerId;
      }
      if (filters.templateId) {
        whereClause.templateId = filters.templateId;
      }
      if (filters.sentAfter || filters.sentBefore) {
        whereClause.sentAt = {};
        if (filters.sentAfter) {
          whereClause.sentAt.gte = filters.sentAfter;
        }
        if (filters.sentBefore) {
          whereClause.sentAt.lte = filters.sentBefore;
        }
      }
    }

    return whereClause;
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