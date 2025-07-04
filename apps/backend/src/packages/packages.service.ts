import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateCustomerPackageDto } from './dto/create-customer-package.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  // Paket Tanımlamaları İşlemleri
  async createPackage(createPackageDto: CreatePackageDto) {
    const { services, ...packageData } = createPackageDto;

    // Tüm hizmetlerin var olduğundan emin ol
    for (const serviceItem of services) {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceItem.serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Hizmet bulunamadı: ID ${serviceItem.serviceId}`);
      }
    }

    return this.prisma.package.create({
      data: {
        ...packageData,
        services: {
          create: services.map(service => ({
            quantity: service.quantity,
            service: {
              connect: {
                id: service.serviceId,
              },
            },
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async findAllPackages(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;

    return this.prisma.package.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async findPackageById(id: string) {
    const packageItem = await this.prisma.package.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!packageItem) {
      throw new NotFoundException(`Paket bulunamadı: ID ${id}`);
    }

    return packageItem;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const { services, ...packageData } = updatePackageDto;

    // Paketin var olduğundan emin ol
    const packageExists = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!packageExists) {
      throw new NotFoundException(`Paket bulunamadı: ID ${id}`);
    }

    // Services güncellenecek mi?
    if (services && services.length > 0) {
      // Önce mevcut tüm servisleri sil
      await this.prisma.packageService.deleteMany({
        where: {
          packageId: id,
        },
      });

      // Tüm hizmetlerin var olduğundan emin ol
      for (const serviceItem of services) {
        const service = await this.prisma.service.findUnique({
          where: { id: serviceItem.serviceId },
        });

        if (!service) {
          throw new NotFoundException(`Hizmet bulunamadı: ID ${serviceItem.serviceId}`);
        }
      }

      // Yeni servisleri ekle
      return this.prisma.package.update({
        where: { id },
        data: {
          ...packageData,
          services: {
            create: services.map(service => ({
              quantity: service.quantity,
              service: {
                connect: {
                  id: service.serviceId,
                },
              },
            })),
          },
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      });
    }

    // Sadece paket bilgilerini güncelle
    return this.prisma.package.update({
      where: { id },
      data: packageData,
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async updatePackageService(packageId: string, serviceData: UpdatePackageServiceDto) {
    // Hizmetin pakette olduğundan emin ol
    const packageService = await this.prisma.packageService.findUnique({
      where: {
        packageId_serviceId: {
          packageId,
          serviceId: serviceData.serviceId,
        },
      },
    });

    if (!packageService) {
      throw new NotFoundException(
        `Hizmet bu pakette bulunamadı. Paket ID: ${packageId}, Hizmet ID: ${serviceData.serviceId}`,
      );
    }

    // Hizmet miktarını güncelle
    return this.prisma.packageService.update({
      where: {
        packageId_serviceId: {
          packageId,
          serviceId: serviceData.serviceId,
        },
      },
      data: {
        quantity: serviceData.quantity,
      },
      include: {
        service: true,
        package: true,
      },
    });
  }

  async removePackage(id: string) {
    // Paketin var olduğunu kontrol et
    const packageExists = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!packageExists) {
      throw new NotFoundException(`Paket bulunamadı: ID ${id}`);
    }

    // Paket herhangi bir müşteriye satılmış mı kontrol et
    const customerPackagesCount = await this.prisma.customerPackage.count({
      where: {
        packageId: id,
      },
    });

    if (customerPackagesCount > 0) {
      throw new BadRequestException(
        `Bu paket ${customerPackagesCount} müşteriye satılmıştır. Önce müşteri paketlerini silmelisiniz.`,
      );
    }

    return this.prisma.package.delete({
      where: { id },
      include: {
        services: true,
      },
    });
  }

  // Müşteri Paketleri İşlemleri
  async createCustomerPackage(createCustomerPackageDto: CreateCustomerPackageDto) {
    const { customerId, packageId } = createCustomerPackageDto;

    // Müşterinin var olduğundan emin ol
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ID ${customerId}`);
    }

    // Paketin var olduğundan emin ol
    const packageItem = await this.prisma.package.findUnique({
      where: { id: packageId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!packageItem) {
      throw new NotFoundException(`Paket bulunamadı: ID ${packageId}`);
    }

    // Paket bitiş tarihini hesapla
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + packageItem.validityDays);

    // Kalan seanslar için JSON oluştur
    const remainingSessions = {};
    packageItem.services.forEach(service => {
      remainingSessions[service.serviceId] = service.quantity;
    });

    // Müşteri paketini oluştur
    return this.prisma.customerPackage.create({
      data: {
        purchaseDate,
        expiryDate,
        remainingSessions,
        customerId,
        packageId,
      },
      include: {
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

  async findAllCustomerPackages(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    active?: boolean;
  }) {
    const { skip, take, customerId, active } = params;

    // Filtreleri oluştur
    const where: any = {};
    
    if (customerId) {
      where.customerId = customerId;
    }

    // Sadece aktif paketleri listele
    if (active) {
      where.expiryDate = { gte: new Date() };
    }

    return this.prisma.customerPackage.findMany({
      skip,
      take,
      where,
      include: {
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
        usageHistory: {
          include: {
            appointment: {
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
    });
  }

  async findCustomerPackageById(id: string) {
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id },
      include: {
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
        usageHistory: {
          include: {
            appointment: {
              include: {
                service: true,
                staff: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
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
    // Müşteri paketinin var olduğundan emin ol
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id: customerPackageId },
    });

    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${customerPackageId}`);
    }

    // Randevunun var olduğundan emin ol
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${appointmentId}`);
    }

    // Müşteri ve randevu müşterisi eşleşiyor mu kontrol et
    if (appointment.customerId !== customerPackage.customerId) {
      throw new BadRequestException(`Bu randevu, paket sahibi müşteriye ait değil.`);
    }

    // Daha önce bu randevu için paket kullanılmış mı kontrol et
    const existingUsage = await this.prisma.packageUsageHistory.findUnique({
      where: { appointmentId },
    });

    if (existingUsage) {
      throw new BadRequestException(`Bu randevu için paket kullanımı zaten kaydedilmiş.`);
    }

    // Randevuda verilen hizmet pakette var mı kontrol et
    const remainingSessions = customerPackage.remainingSessions as Record<string, number>;
    const serviceId = appointment.serviceId;

    if (!remainingSessions[serviceId] || remainingSessions[serviceId] <= 0) {
      throw new BadRequestException(`Bu paket, seçilen hizmeti kapsamıyor veya kalan seans sayısı sıfır.`);
    }

    // Paket süresinin dolmadığından emin ol
    if (customerPackage.expiryDate < new Date()) {
      throw new BadRequestException(`Bu paket süresi dolmuştur.`);
    }

    // Kalan seans sayısını azalt
    remainingSessions[serviceId] -= 1;

    // Paket kullanım kaydını oluştur
    const packageUsage = await this.prisma.packageUsageHistory.create({
      data: {
        customerPackageId,
        appointmentId,
      },
      include: {
        customerPackage: true,
        appointment: {
          include: {
            service: true,
          },
        },
      },
    });

    // Müşteri paketini güncelle
    await this.prisma.customerPackage.update({
      where: { id: customerPackageId },
      data: {
        remainingSessions,
      },
    });

    return packageUsage;
  }

  async removeCustomerPackage(id: string) {
    // Müşteri paketinin var olduğundan emin ol
    const customerPackage = await this.prisma.customerPackage.findUnique({
      where: { id },
      include: {
        usageHistory: true,
      },
    });

    if (!customerPackage) {
      throw new NotFoundException(`Müşteri paketi bulunamadı: ID ${id}`);
    }

    // Eğer paket kullanımı varsa silmeyi engelle
    if (customerPackage.usageHistory.length > 0) {
      throw new BadRequestException(
        `Bu paket için ${customerPackage.usageHistory.length} kullanım kaydı var. İptal etmeden önce kullanım kayıtlarını silmelisiniz.`,
      );
    }

    return this.prisma.customerPackage.delete({
      where: { id },
      include: {
        customer: true,
        package: true,
      },
    });
  }
}
