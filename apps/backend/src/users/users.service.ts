import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../prisma/prisma-types';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    if (currentUser.role === UserRole.BRANCH_MANAGER) {
      createUserDto.branchId = currentUser.branchId;
    } else if (!createUserDto.branchId && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_BRANCH_MANAGER)) {
      throw new ConflictException('Şube IDsi gereklidir.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const { email, name, role, branchId, isActive } = createUserDto;

    const data: Prisma.UserCreateInput = {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: isActive ?? true,
      ...(branchId && { branch: { connect: { id: branchId } } }),
    };

    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    return user;
  }

  async findAll(currentUser: any) {
    const where: Prisma.UserWhereInput = {};

    if (currentUser.role === UserRole.SUPER_BRANCH_MANAGER) {
      where.branchId = { in: currentUser.branchIds };
    } else if (
      currentUser.role === UserRole.BRANCH_MANAGER ||
      currentUser.role === UserRole.RECEPTION ||
      currentUser.role === UserRole.STAFF
    ) {
      where.branchId = currentUser.branchId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        isActive: true,
        branch: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      meta: {
        total,
      },
    };
  }

  async findOne(id: string, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        isActive: true,
        branch: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (currentUser) {
      this.authorizeAccess(user, currentUser);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });

    if (!userToUpdate) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.authorizeAccess(userToUpdate, currentUser);

    if (currentUser.role === UserRole.BRANCH_MANAGER && updateUserDto.branchId && updateUserDto.branchId !== currentUser.branchId) {
      throw new ForbiddenException('Kullanıcıların şubesini değiştiremezsiniz.');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string, currentUser: any) {
    const userToRemove = await this.prisma.user.findUnique({ where: { id } });

    if (!userToRemove) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.authorizeAccess(userToRemove, currentUser);

    return this.prisma.user.delete({ where: { id } });
  }

  private authorizeAccess(targetUser: { branchId: string | null }, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.SUPER_BRANCH_MANAGER) {
      if (!targetUser.branchId || !currentUser.branchIds?.includes(targetUser.branchId)) {
        throw new ForbiddenException('Bu şubedeki kullanıcılara erişim yetkiniz yok.');
      }
    } else {
      if (targetUser.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Sadece kendi şubenizdeki kullanıcıları yönetebilirsiniz.');
      }
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });
  }

  async getBranchById(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
    });
  }

  // İstatistik kartları için veri getirme
  async getStatistics(currentUser: any, filters?: {
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
  }) {
    const where = this.buildWhereClause(currentUser, filters);
    
    // Tarih aralığını belirle
    const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : startOfMonth(new Date());
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : endOfMonth(new Date());

    // Paralel sorgular ile performans optimizasyonu
    const [
      totalStaff,
      activeStaff,
      monthlyAppointments,
      totalCommissions
    ] = await Promise.all([
      // Toplam Personel
      this.prisma.user.count({ where }),
      
      // Aktif Personel (belirtilen tarih aralığında randevu alan)
      this.prisma.user.count({
        where: {
          ...where,
          appointments: {
            some: {
              startTime: {
                gte: dateFrom,
                lte: dateTo
              },
              status: { in: ['COMPLETED', 'CONFIRMED', 'SCHEDULED'] }
            }
          }
        }
      }),
      
      // Belirtilen tarih aralığındaki randevu sayısı
      this.prisma.appointment.count({
        where: {
          staff: where,
          startTime: {
            gte: dateFrom,
            lte: dateTo
          },
          status: { in: ['COMPLETED', 'CONFIRMED'] }
        }
      }),
      
      // Toplam Prim Tutarı
      this.prisma.staffCommission.aggregate({
        where: {
          staff: where,
          status: 'PAID',
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      totalStaff,
      activeStaff,
      monthlyAppointments,
      totalCommissions: totalCommissions._sum.amount || 0
    };
  }

  // Performans verileri ile birlikte kullanıcıları getirme
  async findAllWithPerformance(currentUser: any, filters?: {
    dateFrom?: string;
    dateTo?: string;
    roles?: UserRole[];
    performance?: 'high' | 'medium' | 'low' | 'all';
    branchId?: string;
  }) {
    const where = this.buildWhereClause(currentUser, filters);
    
    // Tarih aralığını belirle
    const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : startOfMonth(new Date());
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : endOfMonth(new Date());

    // Rol filtresi ekle
    if (filters?.roles && filters.roles.length > 0) {
      where.role = { in: filters.roles };
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        branch: true,
        _count: {
          select: {
            appointments: {
              where: {
                startTime: {
                  gte: dateFrom,
                  lte: dateTo
                },
                status: { in: ['COMPLETED', 'CONFIRMED'] }
              }
            }
          }
        },
        appointments: {
          where: {
            startTime: {
              gte: dateFrom,
              lte: dateTo
            },
            status: 'COMPLETED'
          },
          include: {
            invoice: {
              select: { totalAmount: true }
            }
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 1 // Son aktivite için
        },
        commissions: {
          where: {
            status: 'PAID',
            createdAt: {
              gte: dateFrom,
              lte: dateTo
            }
          },
          select: { amount: true }
        }
      }
    });

    const usersWithPerformance = users.map(user => {
      const monthlyAppointments = user._count.appointments;
      const totalRevenue = user.appointments.reduce((sum, apt) =>
        sum + (apt.invoice?.totalAmount || 0), 0
      );
      const totalCommissions = user.commissions.reduce((sum, comm) =>
        sum + comm.amount, 0
      );
      const lastActivity = user.appointments[0]?.startTime || null;
      const performanceScore = this.calculatePerformanceScore({
        appointmentCount: monthlyAppointments,
        totalRevenue,
        totalCommissions
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        branchId: user.branchId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        monthlyAppointments,
        totalRevenue,
        totalCommissions,
        lastActivity,
        performanceScore,
        status: monthlyAppointments > 0 ? 'active' : 'inactive'
      };
    });

    // Performans filtresini uygula
    let filteredUsers = usersWithPerformance;
    if (filters?.performance && filters.performance !== 'all') {
      filteredUsers = usersWithPerformance.filter(user => {
        if (filters.performance === 'high') return user.performanceScore >= 70;
        if (filters.performance === 'medium') return user.performanceScore >= 40 && user.performanceScore < 70;
        if (filters.performance === 'low') return user.performanceScore < 40;
        return true;
      });
    }

    const total = filteredUsers.length;

    return {
      data: filteredUsers,
      meta: { total }
    };
  }

  // Tek kullanıcının performans verilerini getirme
  async getUserPerformance(userId: string, currentUser: any, filters?: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    // Yetki kontrolü
    const user = await this.findOne(userId, currentUser);
    
    const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : startOfMonth(new Date());
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : endOfMonth(new Date());

    const [
      appointmentStats,
      revenueStats,
      commissionStats,
      monthlyTrend
    ] = await Promise.all([
      // Randevu istatistikleri
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: {
          staffId: userId,
          startTime: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _count: true
      }),

      // Gelir istatistikleri
      this.prisma.invoice.aggregate({
        where: {
          appointment: {
            staffId: userId,
            startTime: {
              gte: dateFrom,
              lte: dateTo
            }
          },
          status: 'PAID'
        },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _count: true
      }),

      // Prim istatistikleri
      this.prisma.staffCommission.aggregate({
        where: {
          staffId: userId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Aylık trend verisi (son 6 ay)
      this.getMonthlyTrend(userId, 6)
    ]);

    return {
      appointmentStats,
      revenueStats,
      commissionStats,
      monthlyTrend,
      performanceScore: this.calculatePerformanceScore({
        appointmentCount: appointmentStats.reduce((sum, stat) => sum + stat._count, 0),
        totalRevenue: revenueStats._sum.totalAmount || 0,
        totalCommissions: commissionStats._sum.amount || 0
      })
    };
  }

  // Kullanıcının aktivite geçmişini getirme
  async getUserActivities(userId: string, currentUser: any, limit: number = 20) {
    // Yetki kontrolü
    await this.findOne(userId, currentUser);

    const activities = [];

    // Son randevular
    const recentAppointments = await this.prisma.appointment.findMany({
      where: { staffId: userId },
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true } }
      },
      orderBy: { startTime: 'desc' },
      take: limit / 2
    });

    recentAppointments.forEach(apt => {
      activities.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        description: `${apt.customer.name} ile ${apt.service.name} randevusu (${apt.status})`,
        createdAt: apt.startTime,
        metadata: {
          appointmentId: apt.id,
          status: apt.status
        }
      });
    });

    // Son prim ödemeleri
    const recentCommissions = await this.prisma.staffCommission.findMany({
      where: { staffId: userId },
      include: {
        service: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit / 2
    });

    recentCommissions.forEach(comm => {
      activities.push({
        id: `comm-${comm.id}`,
        type: 'commission',
        description: `${comm.service?.name || 'Hizmet'} için ₺${comm.amount} prim (${comm.status})`,
        createdAt: comm.createdAt,
        metadata: {
          commissionId: comm.id,
          amount: comm.amount,
          status: comm.status
        }
      });
    });

    // Tarihe göre sırala
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return activities.slice(0, limit);
  }

  // Kullanıcının mali bilgilerini getirme
  async getUserFinancial(userId: string, currentUser: any, filters?: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    // Yetki kontrolü
    await this.findOne(userId, currentUser);
    
    const dateFrom = filters?.dateFrom ? new Date(filters.dateFrom) : startOfMonth(new Date());
    const dateTo = filters?.dateTo ? new Date(filters.dateTo) : endOfMonth(new Date());

    const [
      monthlyCommissions,
      serviceEarnings,
      commissionHistory
    ] = await Promise.all([
      // Aylık prim detayları (son 12 ay)
      this.getMonthlyCommissions(userId, 12),

      // Hizmet bazlı kazançlar
      this.prisma.staffCommission.groupBy({
        by: ['serviceId'],
        where: {
          staffId: userId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          },
          status: 'PAID'
        },
        _sum: { amount: true },
        _count: true
      }),

      // Prim geçmişi
      this.prisma.staffCommission.findMany({
        where: {
          staffId: userId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        include: {
          service: { select: { name: true } },
          invoice: { select: { totalAmount: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Hizmet isimlerini getir
    const serviceIds = serviceEarnings.map(s => s.serviceId).filter(Boolean);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true }
    });

    const serviceEarningsWithNames = serviceEarnings.map(earning => {
      const service = services.find(s => s.id === earning.serviceId);
      return {
        id: earning.serviceId,
        name: service?.name || 'Bilinmeyen Hizmet',
        earnings: earning._sum.amount || 0,
        count: earning._count
      };
    });

    return {
      monthlyCommissions,
      serviceEarnings: serviceEarningsWithNames,
      commissionHistory
    };
  }

  // Yardımcı fonksiyonlar
  private buildWhereClause(currentUser: any, filters?: any): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    // Rol bazlı yetkilendirme - Global kurallara göre
    if (currentUser.role === UserRole.SUPER_BRANCH_MANAGER) {
      where.branchId = { in: currentUser.branchIds };
    } else if (
      currentUser.role === UserRole.BRANCH_MANAGER ||
      currentUser.role === UserRole.RECEPTION ||
      currentUser.role === UserRole.STAFF
    ) {
      where.branchId = currentUser.branchId;
    }

    // Şube filtresi
    if (filters?.branchId && currentUser.role === UserRole.ADMIN) {
      where.branchId = filters.branchId;
    }

    return where;
  }

  private calculatePerformanceScore(data: {
    appointmentCount: number;
    totalRevenue: number;
    totalCommissions: number;
  }): number {
    // Performans skoru hesaplama algoritması
    const appointmentScore = Math.min(data.appointmentCount * 2, 50);
    const revenueScore = Math.min(data.totalRevenue / 1000 * 10, 30);
    const commissionScore = Math.min(data.totalCommissions / 500 * 20, 20);
    
    return Math.round(appointmentScore + revenueScore + commissionScore);
  }

  private async getMonthlyTrend(userId: string, months: number) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      const monthEnd = endOfMonth(monthStart);

      const [appointmentCount, revenue, commissions] = await Promise.all([
        this.prisma.appointment.count({
          where: {
            staffId: userId,
            startTime: { gte: monthStart, lte: monthEnd },
            status: { in: ['COMPLETED', 'CONFIRMED'] }
          }
        }),
        this.prisma.invoice.aggregate({
          where: {
            appointment: {
              staffId: userId,
              startTime: { gte: monthStart, lte: monthEnd }
            },
            status: 'PAID'
          },
          _sum: { totalAmount: true }
        }),
        this.prisma.staffCommission.aggregate({
          where: {
            staffId: userId,
            createdAt: { gte: monthStart, lte: monthEnd },
            status: 'PAID'
          },
          _sum: { amount: true }
        })
      ]);

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        appointmentCount,
        revenue: revenue._sum.totalAmount || 0,
        commissions: commissions._sum.amount || 0
      });
    }

    return trends;
  }

  private async getMonthlyCommissions(userId: string, months: number) {
    const commissions = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      const monthEnd = endOfMonth(monthStart);

      const monthlyData = await this.prisma.staffCommission.aggregate({
        where: {
          staffId: userId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: 'PAID'
        },
        _sum: { amount: true },
        _count: true
      });

      commissions.push({
        month: monthStart.toISOString().slice(0, 7),
        amount: monthlyData._sum.amount || 0,
        count: monthlyData._count
      });
    }

    return commissions;
  }
}
