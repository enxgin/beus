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

    const data: Prisma.PackageCreateInput = {
      ...packageData,
      type: type as PackageType,
      services: {
        create: services?.map((service) => ({
          serviceId: service.serviceId,
          quantity: service.quantity,
        })),
      },
    };

    if (branchId) {
      data.branch = { connect: { id: branchId } };
    }

    const newPackage = await this.prisma.package.create({
      data,
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

    const data: Prisma.PackageUpdateInput = {
      ...packageData,
    };

    if (branchId) {
      data.branch = { connect: { id: branchId } };
    }

    if (type) {
      data.type = type as PackageType;
    }

    if (services) {
      data.services = {
        deleteMany: {},
        create: services.map((service) => ({
          serviceId: service.serviceId,
          quantity: service.quantity,
        })),
      };
    }

    return this.prisma.package.update({
      where: { id },
      data,
    });
  }

  async updatePackageService(id: string, updatePackageServiceDto: UpdatePackageServiceDto) {
    return this.prisma.packageService.update({
      where: {
        packageId_serviceId: {
          packageId: id,
          serviceId: updatePackageServiceDto.serviceId,
        },
      },
      data: { quantity: updatePackageServiceDto.quantity },
    });
  }

  async removePackage(id: string) {
    const customerPackages = await this.prisma.customerPackage.findMany({
      where: { packageId: id },
    });
    if (customerPackages.length > 0) {
      throw new BadRequestException(
        'Bu paketi silmeden önce, bu pakete sahip tüm müşteri paketlerini silmelisiniz.',
      );
    }
    return this.prisma.package.delete({ where: { id } });
  }

  // Müşteri Paketleri İşlemleri
  async createCustomerPackage(createCustomerPackageDto: CreateCustomerPackageDto) {
    const { customerId, packageId, salesCode, notes, startDate } = createCustomerPackageDto;

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const existingPackage = await tx.customerPackage.findFirst({
            where: {
              customerId,
              packageId,
              purchaseDate: { gte: todayStart },
            },
          });

          if (existingPackage) {
            console.log('Bu müşteri için bu paket bugün zaten satılmış:', existingPackage.id);
            return existingPackage;
          }

          const customer = await tx.customer.findUnique({ where: { id: customerId } });
          if (!customer) {
            throw new NotFoundException(`Müşteri bulunamadı: ID ${customerId}`);
          }

          const packageItem = await tx.package.findUnique({
            where: { id: packageId },
            include: { services: { include: { service: true } } },
          });

          if (!packageItem) {
            throw new NotFoundException(`Paket bulunamadı: ID ${packageId}`);
          }

          const purchaseDate = startDate ? new Date(startDate) : new Date();
          let expiryDate: Date | null = null;
          if (packageItem.validityDays) {
            expiryDate = new Date(purchaseDate);
            expiryDate.setDate(expiryDate.getDate() + packageItem.validityDays);
          }

          const remainingSessions: Record<string, number> = {};
          if (packageItem.services?.length > 0) {
            packageItem.services.forEach((service) => {
              remainingSessions[service.serviceId] = service.quantity;
            });
          } else if (packageItem.type === 'SESSION' && packageItem.totalSessions) {
            remainingSessions['sessions'] = packageItem.totalSessions;
          } else if (packageItem.type === PackageType.TIME && packageItem.totalMinutes) {
            remainingSessions['minutes'] = packageItem.totalMinutes;
          }

          return tx.customerPackage.create({
            data: {
              purchaseDate,
              expiryDate,
              remainingSessions: remainingSessions as any,
              notes,
              salesCode,
              customerId,
              packageId,
            },
            include: {
              customer: true,
              package: true,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      );
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Bu paket zaten müşteriye satılmış.');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Paket satışı sırasında bir hata oluştu: ${error.message}`);
    }
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
      include: include || { customer: true, package: true },
    });
  }

  async findCustomerPackageById(id: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id },
      include: {
        customer: true,
        package: true,
        usageHistory: {
          include: {
            appointment: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
          orderBy: {
            usedAt: 'desc',
          },
        },
      },
    });

    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${id}`);
    }
    return customerPackage;
  }

  async usePackageSession(customerPackageId: string, appointmentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const customerPackage = await tx.customerPackage.findUnique({
        where: { id: customerPackageId },
      });
      if (!customerPackage) {
        throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${customerPackageId}`);
      }

      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appointment) {
        throw new NotFoundException(`Randevu bulunamadı: ID ${appointmentId}`);
      }

      if (appointment.status !== 'COMPLETED') {
        throw new BadRequestException(`Paket kullanımı için randevu durumu 'COMPLETED' olmalıdır.`);
      }

      const remainingSessions = customerPackage.remainingSessions as Record<string, number>;
      const serviceId = appointment.serviceId;

      if (!remainingSessions[serviceId] || remainingSessions[serviceId] <= 0) {
        throw new BadRequestException(`Bu paket, seçilen hizmeti kapsamıyor veya kalan seans sayısı sıfır.`);
      }

      if (customerPackage.expiryDate && customerPackage.expiryDate < new Date()) {
        throw new BadRequestException(`Bu paket süresi dolmuştur.`);
      }

      remainingSessions[serviceId] -= 1;

      await tx.customerPackage.update({
        where: { id: customerPackageId },
        data: { remainingSessions: remainingSessions as any },
      });

      return tx.packageUsageHistory.create({
        data: {
          customerPackageId,
          appointmentId,
        },
      });
    });
  }

  async removeCustomerPackage(id: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id },
      include: { usageHistory: true },
    });

    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${id}`);
    }

    if (customerPackage.usageHistory.length > 0) {
      throw new BadRequestException(
        `Bu paket için ${customerPackage.usageHistory.length} kullanım kaydı var. İptal etmeden önce kullanım kayıtlarını silmelisiniz.`,
      );
    }

    return this.prisma.customerPackage.delete({ where: { id } });
  }
}
