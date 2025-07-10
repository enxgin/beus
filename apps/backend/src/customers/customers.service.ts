import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma, User } from '@prisma/client';
import { calculateCustomerAnalytics } from './analytics.helpers';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { branchId, tagIds, ...customerData } = createCustomerDto;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Müşteriyi oluştur
        const newCustomer = await prisma.customer.create({
          data: {
            ...customerData,
            branch: {
              connect: { id: branchId },
            },
          },
        });

        // Etiketleri bağla
        if (tagIds && tagIds.length > 0) {
          await prisma.customerTag.createMany({
            data: tagIds.map(tagId => ({
              customerId: newCustomer.id,
              tagId,
            })),
          });
        }

        // Müşteriyi etiketleriyle birlikte döndür
        return await prisma.customer.findUnique({
          where: { id: newCustomer.id },
          include: {
            branch: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Bu telefon numarası zaten kayıtlı.');
      }
      throw error;
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const { branchId, tagIds, ...customerData } = updateCustomerDto;

    console.log('🔍 [CustomersService.update] Gelen veriler:', {
      id,
      updateCustomerDto,
      tagIds,
      customerData
    });

    await this.prisma.customer.findUniqueOrThrow({ where: { id } });

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Müşteriyi güncelle
        const updatedCustomer = await prisma.customer.update({
          where: { id },
          data: {
            ...customerData,
            ...(branchId && { branch: { connect: { id: branchId } } }),
          },
        });

        console.log('✅ [CustomersService.update] Müşteri güncellendi:', updatedCustomer);

        // Etiket güncellemeleri varsa işle
        if (tagIds !== undefined) {
          console.log('🏷️ [CustomersService.update] Etiket güncellemesi başlıyor, tagIds:', tagIds);
          
          // Mevcut etiketleri sil
          const deletedTags = await prisma.customerTag.deleteMany({
            where: { customerId: id },
          });
          console.log('🗑️ [CustomersService.update] Silinen etiket sayısı:', deletedTags.count);

          // Yeni etiketleri ekle
          if (tagIds.length > 0) {
            const tagData = tagIds.map(tagId => ({
              customerId: id,
              tagId,
            }));
            console.log('➕ [CustomersService.update] Eklenecek etiket verileri:', tagData);
            
            const createdTags = await prisma.customerTag.createMany({
              data: tagData,
            });
            console.log('✅ [CustomersService.update] Eklenen etiket sayısı:', createdTags.count);
          } else {
            console.log('ℹ️ [CustomersService.update] Eklenecek etiket yok');
          }
        } else {
          console.log('ℹ️ [CustomersService.update] tagIds undefined, etiket güncellemesi yapılmıyor');
        }

        // Güncellenmiş müşteriyi etiketleriyle birlikte döndür
        const finalCustomer = await prisma.customer.findUnique({
          where: { id },
          include: {
            branch: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
        
        console.log('🎯 [CustomersService.update] Final müşteri verisi:', {
          id: finalCustomer?.id,
          name: finalCustomer?.name,
          tagsCount: (finalCustomer as any)?.tags?.length || 0,
          tags: (finalCustomer as any)?.tags
        });

        return finalCustomer;
      });
    } catch (error) {
      console.error('❌ [CustomersService.update] Hata oluştu:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Bu telefon numarası zaten kayıtlı.');
      }
      throw error;
    }
  }

  async findOne(id: string) {
    console.log('🔍 [CustomersService.findOne] Müşteri detayları getiriliyor, ID:', id);
    
    const customer: any = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        tags: {
          include: {
            tag: true,
          },
        },
        appointments: {
          include: {
            service: true,
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        packages: {
          include: {
            package: {
              include: {
                services: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
          orderBy: {
            purchaseDate: 'desc',
          },
        },
        invoices: {
          include: {
            payments: true,
            appointment: {
              include: {
                service: true,
              },
            },
            customerPackage: {
              include: {
                package: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı (ID: ${id})`);
    }

    console.log('✅ [CustomersService.findOne] Müşteri bulundu:', {
      id: customer.id,
      name: customer.name,
      appointmentsCount: customer.appointments?.length || 0,
      packagesCount: customer.packages?.length || 0,
      invoicesCount: customer.invoices?.length || 0,
      totalPayments: customer.invoices?.reduce((acc, invoice) => acc + (invoice.payments?.length || 0), 0) || 0,
    });

    // Frontend'in beklediği formatta payments array'ini oluştur
    const payments = customer.invoices?.flatMap(invoice =>
      invoice.payments?.map(payment => ({
        ...payment,
        // Frontend'in beklediği ek alanları ekle
        appointmentId: invoice.appointmentId,
        packageId: invoice.customerPackageId,
        status: invoice.status, // Invoice status'unu payment status olarak kullan
        date: payment.paymentDate, // paymentDate'i date olarak map et
      })) || []
    ) || [];

    console.log('📊 [CustomersService.findOne] Payments verisi hazırlandı:', {
      paymentsCount: payments.length,
      totalAmount: payments.reduce((acc, p) => acc + p.amount, 0),
    });

    return {
      ...customer,
      customerPackages: customer.packages, // Frontend'in beklediği field adı
      payments, // Frontend'in beklediği payments array'ini ekle
    };
  }

  async remove(id: string) {
    await this.prisma.customer.findUniqueOrThrow({ where: { id } });
    // Etiket ilişkili silme mantığı kaldırıldı.
    return this.prisma.customer.delete({ where: { id } });
  }

  async findAll(user: User, branchId?: string) {
    const where: Prisma.CustomerWhereInput = {};
    const { role, branchId: userBranchId } = user;

    // Rol tabanlı erişim kontrolü mantığı korunuyor.
    switch (role) {
      case 'ADMIN':
        if (branchId) where.branchId = branchId;
        break;
      case 'BRANCH_MANAGER':
      case 'STAFF':
        where.branchId = userBranchId;
        break;
      default:
        throw new ForbiddenException('Müşterileri listeleme yetkiniz yok.');
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        branch: true, // Frontend'de şube adını göstermek için
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(name: string, branchId: string) {
    return this.prisma.customer.findMany({
      where: {
        branchId,
        OR: [
          {
            name: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: name,
            },
          },
        ],
      },
      // Etiketler (`tags`) artık include edilmiyor.
      take: 10,
    });
  }

  // Faz 1: İstatistik kartları için veri
  async getCustomerStats(user: User, branchId?: string) {
    const where: Prisma.CustomerWhereInput = {};
    const { role, branchId: userBranchId } = user;

    // Rol tabanlı erişim kontrolü
    switch (role) {
      case 'ADMIN':
        if (branchId) where.branchId = branchId;
        break;
      case 'BRANCH_MANAGER':
      case 'STAFF':
        where.branchId = userBranchId;
        break;
      default:
        throw new ForbiddenException('İstatistikleri görme yetkiniz yok.');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Toplam müşteri sayısı
    const totalCustomers = await this.prisma.customer.count({ where });

    // Bu ay yeni müşteri sayısı
    const newCustomersThisMonth = await this.prisma.customer.count({
      where: {
        ...where,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Son 30 günde randevusu olan aktif müşteri sayısı
    const activeCustomers = await this.prisma.customer.count({
      where: {
        ...where,
        appointments: {
          some: {
            startTime: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    // Borcu olan müşteri sayısı
    const customersWithDebt = await this.prisma.customer.count({
      where: {
        ...where,
        invoices: {
          some: {
            debt: {
              gt: 0,
            },
          },
        },
      },
    });

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      customersWithDebt,
    };
  }

  // Faz 1: Genişletilmiş müşteri verisi için
  async findAllWithAnalytics(user: User, branchId?: string, tagIds?: string[]) {
    const where: Prisma.CustomerWhereInput = {};
    const { role, branchId: userBranchId } = user;

    // Rol tabanlı erişim kontrolü
    switch (role) {
      case 'ADMIN':
        if (branchId) where.branchId = branchId;
        break;
      case 'BRANCH_MANAGER':
      case 'STAFF':
        where.branchId = userBranchId;
        break;
      default:
        throw new ForbiddenException('Müşterileri listeleme yetkiniz yok.');
    }

    // Tag filtrelemesi
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        branch: true,
        tags: {
          include: {
            tag: true,
          },
        },
        appointments: {
          select: {
            id: true,
            startTime: true,
            status: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        invoices: {
          select: {
            totalAmount: true,
            debt: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Analytics verilerini hesapla
    return customers.map((customer) => {
      const totalAppointments = customer.appointments.length;
      const lastAppointment = customer.appointments[0]?.startTime || null;
      const totalSpent = customer.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const totalDebt = customer.invoices.reduce((sum, invoice) => sum + invoice.debt, 0);

      return {
        ...customer,
        analytics: {
          totalAppointments,
          lastAppointment,
          totalSpent,
          totalDebt,
        },
      };
    });
  }

  // Faz 1: Gelişmiş arama (email dahil)
  async searchAdvanced(query: string, branchId: string) {
    return this.prisma.customer.findMany({
      where: {
        branchId,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: query,
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        branch: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: 10,
    });
  }

  // Tag istatistikleri için
  async getTagStats(user: User, branchId?: string) {
    const where: Prisma.CustomerWhereInput = {};
    const { role, branchId: userBranchId } = user;

    // Rol tabanlı erişim kontrolü
    switch (role) {
      case 'ADMIN':
        if (branchId) where.branchId = branchId;
        break;
      case 'BRANCH_MANAGER':
      case 'STAFF':
        where.branchId = userBranchId;
        break;
      default:
        throw new ForbiddenException('Tag istatistiklerini görme yetkiniz yok.');
    }

    // Her tag için müşteri sayısını hesapla
    const tagStats = await this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            customers: {
              where: {
                customer: where,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tagStats.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      customerCount: tag._count.customers,
    }));
  }

  // Tek müşteri için detaylı analytics
  async getCustomerAnalytics(id: string) {
    console.log('🔍 [CustomersService.getCustomerAnalytics] Analytics getiriliyor, ID:', id);
    
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        tags: {
          include: {
            tag: true,
          },
        },
        appointments: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
        invoices: {
          include: {
            payments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı (ID: ${id})`);
    }

    console.log('✅ [CustomersService.getCustomerAnalytics] Müşteri bulundu:', {
      id: customer.id,
      name: customer.name,
      appointmentsCount: customer.appointments?.length || 0,
      invoicesCount: customer.invoices?.length || 0,
    });

    // Payments array'ini düzelt
    const payments = customer.invoices?.flatMap(invoice =>
      invoice.payments || []
    ) || [];

    // Analytics hesapla
    const analytics = calculateCustomerAnalytics({
      ...customer,
      payments,
    });

    console.log('📊 [CustomersService.getCustomerAnalytics] Analytics hesaplandı:', {
      loyaltyScore: analytics.loyaltyScore.score,
      lifecycleStage: analytics.lifecycle.stage,
      totalAppointments: analytics.appointmentPattern.totalAppointments,
      favoriteServicesCount: analytics.favoriteServices.top3.length,
    });

    return analytics;
  }
}
