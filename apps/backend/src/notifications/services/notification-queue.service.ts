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

enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

interface User {
  id: string;
  role: UserRole;
  branchId?: string;
}

interface NotificationQueue {
  id: string;
  customerId: string;
  templateId: string;
  triggerId: string | null;
  branchId: string;
  status: NotificationStatus;
  data: any;
  scheduledAt: Date;
  sentAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  template?: {
    id: string;
    name: string;
    type: string;
    content: string;
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
export class NotificationQueueService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: {
      customerId: string;
      type: 'SMS' | 'WHATSAPP' | 'EMAIL';
      content: string;
      scheduledFor?: Date;
      priority?: number;
    },
    user: User,
  ): Promise<NotificationQueue> {
    // Validate customer access
    const customer = await this.prisma.customer.findUnique({
      where: { id: createDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createDto.customerId} not found`);
    }

    await this.validateBranchAccess(user, customer.branchId);

    // Create a simple template for manual notifications
    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: `Manual ${createDto.type} - ${new Date().toISOString()}`,
        type: createDto.type as any,
        content: createDto.content,
        variables: [],
        branch: {
          connect: { id: customer.branchId },
        },
        isActive: true,
      },
    });

    return this.prisma.notificationQueue.create({
      data: {
        customerId: createDto.customerId,
        templateId: template.id,
        branchId: customer.branchId,
        status: 'PENDING' as any,
        data: { content: createDto.content },
        scheduledAt: createDto.scheduledFor || new Date(),
        retryCount: 0,
      },
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
    }) as any;
  }

  async findAll(
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    user: User,
  ): Promise<{
    data: NotificationQueue[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause = this.buildWhereClause(user, {
      status: filters.status,
      branchId: filters.branchId,
      customerId: filters.customerId,
      scheduledAfter: filters.startDate,
      scheduledBefore: filters.endDate,
    });

    const [data, total] = await Promise.all([
      this.prisma.notificationQueue.findMany({
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
        orderBy: {
          scheduledAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notificationQueue.count({ where: whereClause }),
    ]);

    return {
      data: data as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPending(branchId?: string, user?: User): Promise<NotificationQueue[]> {
    const whereClause: any = {
      status: 'PENDING' as any,
      scheduledAt: {
        lte: new Date(),
      },
    };

    if (user) {
      const userWhereClause = this.buildWhereClause(user, { branchId });
      Object.assign(whereClause, userWhereClause);
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    return this.prisma.notificationQueue.findMany({
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
      orderBy: {
        scheduledAt: 'asc',
      },
    }) as any;
  }

  async getFailed(branchId?: string, user?: User): Promise<NotificationQueue[]> {
    const whereClause: any = {
      status: 'FAILED' as any,
    };

    if (user) {
      const userWhereClause = this.buildWhereClause(user, { branchId });
      Object.assign(whereClause, userWhereClause);
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    return this.prisma.notificationQueue.findMany({
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
      orderBy: {
        updatedAt: 'desc',
      },
    }) as any;
  }

  async bulkRetry(ids: string[], user: User): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.retry(id, user);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async bulkCancel(ids: string[], user: User): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.cancel(id, user);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
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

  async processQueue(user: User): Promise<{ message: string; processed: number }> {
    // This would typically trigger the scheduler service
    // For now, we'll just return a success message
    const pending = await this.getPending(undefined, user);
    
    return {
      message: 'Queue processing initiated',
      processed: pending.length,
    };
  }

  async clearOld(
    olderThanDays: number,
    statuses: string[],
    user: User,
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const whereClause = this.buildWhereClause(user);
    whereClause.status = { in: statuses };
    whereClause.updatedAt = { lt: cutoffDate };

    const result = await this.prisma.notificationQueue.deleteMany({
      where: whereClause,
    });

    return { deleted: result.count };
  }

  async getStats(
    branchId?: string,
    period?: 'today' | 'week' | 'month' | 'year',
    user?: User,
  ): Promise<{
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
    total: number;
    byType?: { [key: string]: number };
    byDay?: { date: string; count: number }[];
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
        createdAt: {
          gte: startDate,
        },
      };
    }

    const whereClause = user
      ? this.buildWhereClause(user, { branchId })
      : branchId
        ? { branchId, ...dateFilter }
        : dateFilter;

    const [pending, sent, failed, cancelled, total] = await Promise.all([
      this.prisma.notificationQueue.count({
        where: { ...whereClause, status: 'PENDING' as any },
      }),
      this.prisma.notificationQueue.count({
        where: { ...whereClause, status: 'SENT' as any },
      }),
      this.prisma.notificationQueue.count({
        where: { ...whereClause, status: 'FAILED' as any },
      }),
      this.prisma.notificationQueue.count({
        where: { ...whereClause, status: 'CANCELLED' as any },
      }),
      this.prisma.notificationQueue.count({ where: whereClause }),
    ]);

    return {
      pending,
      sent,
      failed,
      cancelled,
      total,
    };
  }

  async findAllOld(
    user: User,
    filters?: {
      status?: NotificationStatus;
      branchId?: string;
      customerId?: string;
      templateId?: string;
      scheduledAfter?: Date;
      scheduledBefore?: Date;
    }
  ): Promise<NotificationQueue[]> {
    const whereClause = this.buildWhereClause(user, filters);

    return this.prisma.notificationQueue.findMany({
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
      orderBy: {
        scheduledAt: 'asc',
      },
    }) as any;
  }

  async findOne(id: string, user: User): Promise<NotificationQueue> {
    const queueItem = await this.prisma.notificationQueue.findUnique({
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

    if (!queueItem) {
      throw new NotFoundException(`Notification queue item with ID ${id} not found`);
    }

    await this.validateBranchAccess(user, queueItem.branchId);
    return queueItem as any;
  }

  async findPending(limit: number = 100): Promise<NotificationQueue[]> {
    return this.prisma.notificationQueue.findMany({
      where: {
        status: NotificationStatus.PENDING as any,
        scheduledAt: {
          lte: new Date(),
        },
      },
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
      orderBy: {
        scheduledAt: 'asc',
      },
      take: limit,
    }) as any;
  }

  async markAsSent(id: string, sentAt?: Date): Promise<NotificationQueue> {
    return this.prisma.notificationQueue.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT as any,
        sentAt: sentAt || new Date(),
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async markAsFailed(id: string, errorMessage: string): Promise<NotificationQueue> {
    const queueItem = await this.prisma.notificationQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      throw new NotFoundException(`Notification queue item with ID ${id} not found`);
    }

    return this.prisma.notificationQueue.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED as any,
        errorMessage,
        retryCount: queueItem.retryCount + 1,
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async cancel(id: string, user: User): Promise<NotificationQueue> {
    const queueItem = await this.findOne(id, user);

    if (queueItem.status !== NotificationStatus.PENDING) {
      throw new ForbiddenException('Only pending notifications can be cancelled');
    }

    return this.prisma.notificationQueue.update({
      where: { id },
      data: {
        status: NotificationStatus.CANCELLED as any,
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async reschedule(id: string, newScheduledAt: Date, user: User): Promise<NotificationQueue> {
    const queueItem = await this.findOne(id, user);

    if (queueItem.status !== NotificationStatus.PENDING) {
      throw new ForbiddenException('Only pending notifications can be rescheduled');
    }

    return this.prisma.notificationQueue.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async retry(id: string, user: User): Promise<NotificationQueue> {
    const queueItem = await this.findOne(id, user);

    if (queueItem.status !== NotificationStatus.FAILED) {
      throw new ForbiddenException('Only failed notifications can be retried');
    }

    return this.prisma.notificationQueue.update({
      where: { id },
      data: {
        status: NotificationStatus.PENDING as any,
        scheduledAt: new Date(),
        errorMessage: null,
      },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
  }

  async remove(id: string, user: User): Promise<NotificationQueue> {
    const queueItem = await this.findOne(id, user);

    return this.prisma.notificationQueue.delete({
      where: { id },
      include: {
        customer: true,
        template: true,
        trigger: true,
        branch: true,
      },
    }) as any;
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
        throw new ForbiddenException('Insufficient permissions to access notification queue');
    }

    const whereClause: any = { ...branchFilter };

    // Apply additional filters
    if (filters) {
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.customerId) {
        whereClause.customerId = filters.customerId;
      }
      if (filters.templateId) {
        whereClause.templateId = filters.templateId;
      }
      if (filters.scheduledAfter || filters.scheduledBefore) {
        whereClause.scheduledAt = {};
        if (filters.scheduledAfter) {
          whereClause.scheduledAt.gte = filters.scheduledAfter;
        }
        if (filters.scheduledBefore) {
          whereClause.scheduledAt.lte = filters.scheduledBefore;
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