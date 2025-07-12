import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PackageType } from '@prisma/client';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateCustomerPackageDto } from './dto/create-customer-package.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  // Paket Tanımlamaları İşlemleri
  async createPackage(createPackageDto: CreatePackageDto, user: any) {
    const { services, branchId, type, ...packageData } = createPackageDto;

    // Frontend'den gelen küçük harf değerlerini büyük harfe çevir
    const convertedType = type?.toUpperCase() as PackageType;

    const newPackage = await this.prisma.package.create({
      data: {
        ...packageData,
        type: convertedType,
        branch: {
          connect: { id: branchId },
        },
        services: {
          create: services?.map((service) => ({
            serviceId: service.serviceId,
            quantity: service.quantity,
          })),
        },
      },
      include: { services: true },
    });
    return newPackage;
  }

  async findAllPackages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PackageWhereUniqueInput;
    where?: Prisma.PackageWhereInput;
    orderBy?: Prisma.PackageOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.package.findMany({ skip, take, cursor, where, orderBy });
  }

  async findPackageById(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { services: { include: { service: true } } },
    });
    if (!pkg) {
      throw new NotFoundException(`Paket bulunamadı: ID ${id}`);
    }
    return pkg;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const { branchId, type, services, ...packageData } = updatePackageDto;

    return this.prisma.$transaction(async (tx) => {
      // Frontend'den gelen küçük harf değerlerini büyük harfe çevir
      const convertedType = type?.toUpperCase() as PackageType;

      const updatedPackage = await tx.package.update({
        where: { id },
        data: {
          ...packageData,
          ...(branchId && { branch: { connect: { id: branchId } } }),
          ...(type && { type: convertedType }),
        },
      });

      if (services) {
        await tx.packageService.deleteMany({ where: { packageId: id } });
        await tx.packageService.createMany({
          data: services.map((service) => ({
            packageId: id,
            serviceId: service.serviceId,
            quantity: service.quantity,
          })),
        });
      }

      return tx.package.findUnique({ where: { id }, include: { services: true } });
    });
  }

  async removePackage(id: string) {
    const customerPackageCount = await this.prisma.customerPackage.count({
      where: { packageId: id },
    });

    if (customerPackageCount > 0) {
      throw new BadRequestException(
        `Bu pakete sahip ${customerPackageCount} müşteri bulunmaktadır. Paketi silemezsiniz.`,
      );
    }

    await this.prisma.packageService.deleteMany({ where: { packageId: id } });
    return this.prisma.package.delete({ where: { id } });
  }

  // Müşteri Paketleri İşlemleri
  async createCustomerPackage(createDto: CreateCustomerPackageDto) {
    return this.prisma.$transaction(async (tx) => {
      const { customerId, packageId, startDate, ...rest } = createDto;

      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

      const pkg = await tx.package.findUnique({ where: { id: packageId }, include: { services: true } });
      if (!pkg) throw new NotFoundException('Paket tanımı bulunamadı.');

      // startDate varsa onu kullan, yoksa şu anki tarihi kullan
      const purchaseDate = startDate ? new Date(startDate) : new Date();
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(purchaseDate.getDate() + pkg.validityDays);

      let remainingSessions: Prisma.JsonValue;
      if (pkg.type === 'SESSION') {
        const sessions = {};
        pkg.services.forEach(s => { sessions[s.serviceId] = s.quantity; });
        remainingSessions = sessions;
      } else if (pkg.type === 'TIME') {
        remainingSessions = { totalMinutes: pkg.validityDays * 24 * 60 };
      }

      return tx.customerPackage.create({
        data: {
          ...rest,
          purchaseDate,
          expiryDate,
          remainingSessions,
          customer: { connect: { id: customerId } },
          package: { connect: { id: packageId } },
        },
      });
    }, {
      isolationLevel: 'Serializable',
    });
  }

  async findAllCustomerPackages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerPackageWhereUniqueInput;
    where?: Prisma.CustomerPackageWhereInput;
    orderBy?: Prisma.CustomerPackageOrderByWithRelationInput;
    include?: Prisma.CustomerPackageInclude;
  }) {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.customerPackage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: include || {
        customer: true,
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
    });
  }

  async findCustomerPackageById(id: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id },
      include: {
        customer: true,
        package: { include: { services: { include: { service: true } } } },
      },
    });
    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${id}`);
    }
    return customerPackage;
  }

  async usePackageForAppointment(customerPackageId: string, appointmentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const customerPackage = await tx.customerPackage.findUnique({ where: { id: customerPackageId } });
      if (!customerPackage) throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${customerPackageId}`);

      const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) throw new NotFoundException(`Randevu bulunamadı: ID ${appointmentId}`);

      if (appointment.status !== 'COMPLETED') {
        throw new BadRequestException(`Paket kullanımı için randevu durumu 'COMPLETED' olmalıdır.`);
      }

      if (customerPackage.expiryDate && customerPackage.expiryDate < new Date()) {
        throw new BadRequestException(`Bu paket süresi dolmuştur.`);
      }

      const remainingSessions = customerPackage.remainingSessions as Record<string, number>;
      const serviceId = appointment.serviceId;

      if (!remainingSessions[serviceId] || remainingSessions[serviceId] <= 0) {
        throw new BadRequestException(`Bu paket, seçilen hizmeti kapsamıyor veya kalan seans sayısı sıfır.`);
      }

      remainingSessions[serviceId] -= 1;

      return await tx.customerPackage.update({
        where: { id: customerPackageId },
        data: { remainingSessions: remainingSessions as any },
      });
    });
  }

  // Paket tamamlanma durumunu kontrol eden metod
  async checkPackageCompletion(customerPackageId: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id: customerPackageId },
      include: {
        package: {
          include: {
            services: true,
          },
        },
      },
    });

    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${customerPackageId}`);
    }

    const remainingSessions = customerPackage.remainingSessions as Record<string, number>;
    
    if (!remainingSessions) {
      return { isCompleted: false, totalSessions: 0, usedSessions: 0 };
    }

    // Toplam seans sayısını hesapla
    let totalSessions = 0;
    let usedSessions = 0;

    customerPackage.package.services.forEach(service => {
      totalSessions += service.quantity;
      const remaining = remainingSessions[service.serviceId] || 0;
      usedSessions += (service.quantity - remaining);
    });

    const isCompleted = Object.values(remainingSessions).every(count => count === 0);

    return {
      isCompleted,
      totalSessions,
      usedSessions,
      remainingSessions,
      completionPercentage: totalSessions > 0 ? Math.round((usedSessions / totalSessions) * 100) : 0,
    };
  }

  // Müşterinin tüm paketlerinin durumunu getiren metod
  async getCustomerPackagesWithStatus(customerId?: string, options?: {
    skip?: number;
    take?: number;
    active?: boolean;
    [key: string]: any;
  }, user?: any) {
    // Where koşullarını oluştur
    const whereConditions: any = {};
    
    // customerId belirtilmişse filtrele
    if (customerId) {
      whereConditions.customerId = customerId;
    }
    
    // Role-based filtering: Kullanıcı rolüne göre şube filtresi uygula
    if (user) {
      const { role, branchId } = user;
      
      // ADMIN tüm şubeleri görebilir
      if (role !== 'ADMIN') {
        // Diğer roller sadece kendi şubelerini görebilir
        if (role === 'SUPER_BRANCH_MANAGER') {
          // SUPER_BRANCH_MANAGER birden fazla şubeyi yönetebilir
          // Şimdilik kendi şubesini gösterelim, daha sonra genişletilebilir
          whereConditions.customer = {
            branchId: branchId
          };
        } else {
          // STAFF, BRANCH_MANAGER, RECEPTION sadece kendi şubelerini görebilir
          whereConditions.customer = {
            branchId: branchId
          };
        }
      }
    }
    
    // Aktif paket filtresi
    if (options?.active === true) {
      whereConditions.expiryDate = {
        gte: new Date(),
      };
    }

    const customerPackages = await this.findAllCustomerPackages({
      where: whereConditions,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });

    const packagesWithStatus = await Promise.all(
      customerPackages.map(async (pkg) => {
        const status = await this.checkPackageCompletion(pkg.id);
        return {
          ...pkg,
          status,
        };
      })
    );

    return packagesWithStatus;
  }

  async removeCustomerPackage(id: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({ where: { id } });
    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${id}`);
    }
    // usageHistory relation is removed, so the check is also removed.
    return this.prisma.customerPackage.delete({ where: { id } });
  }
}
