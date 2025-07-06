import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateCustomerPackageDto } from './dto/create-customer-package.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  // Paket Tanımlamaları İşlemleri
  async createPackage(createPackageDto: CreatePackageDto, user: any) {
    try {
      console.log('Gelen DTO verisi:', JSON.stringify(createPackageDto, null, 2));
      
      const { services, type, totalSessions, totalMinutes, ...packageData } = createPackageDto;
      
      // Prisma için temiz bir data objesi oluşturuyoruz
      const prismaPackageData: Record<string, any> = {
        ...packageData,
        price: typeof packageData.price === 'number' ? packageData.price : parseFloat(packageData.price as unknown as string),
        validityDays: typeof packageData.validityDays === 'number' ? packageData.validityDays : parseInt(packageData.validityDays as unknown as string),
      };
      
      // Boş string ise değer atanmamalı
      if (prismaPackageData.description === '') {
        delete prismaPackageData.description;
      }
      
      // Opsiyonel alanları dönüştür
      if (packageData.discountedPrice !== undefined) {
        prismaPackageData.discountedPrice = typeof packageData.discountedPrice === 'number'
          ? packageData.discountedPrice
          : parseFloat(packageData.discountedPrice as unknown as string);
      }
      
      if (packageData.branchId && packageData.branchId.trim() !== '') {
        prismaPackageData.branchId = packageData.branchId;
      }
      
      // Tip alanını Prisma enum'a dönüştür (session -> SESSION, time -> TIME)
      if (type) {
        console.log('Paket tipi dönüştürülüyor:', type);
        if (type === 'session') {
          prismaPackageData.type = 'SESSION';
        } else if (type === 'time') {
          prismaPackageData.type = 'TIME';
        } else {
          console.log('Geçersiz paket tipi:', type);
          throw new BadRequestException(`Geçersiz paket tipi: ${type}. 'session' veya 'time' olmalıdır.`);
        }
      }
      
      // Sayısal alanları dönüştür ve kontrol et
      if (packageData.price !== undefined) {
        const price = Number(packageData.price);
        if (isNaN(price)) {
          throw new BadRequestException('Fiyat geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.price = price;
      }
      
      if (packageData.validityDays !== undefined) {
        const validityDays = Number(packageData.validityDays);
        if (isNaN(validityDays)) {
          throw new BadRequestException('Geçerlilik günleri sayı olmalıdır.');
        }
        prismaPackageData.validityDays = validityDays;
      }
      
      if (packageData.discountedPrice !== undefined) {
        const discountedPrice = Number(packageData.discountedPrice);
        if (isNaN(discountedPrice)) {
          throw new BadRequestException('İndirimli fiyat geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.discountedPrice = discountedPrice;
      }
      
      if (packageData.commissionRate !== undefined) {
        const commissionRate = Number(packageData.commissionRate);
        if (isNaN(commissionRate)) {
          throw new BadRequestException('Komisyon oranı geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.commissionRate = commissionRate;
      }
      
      if (packageData.commissionFixed !== undefined) {
        const commissionFixed = Number(packageData.commissionFixed);
        if (isNaN(commissionFixed)) {
          throw new BadRequestException('Sabit komisyon tutarı geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.commissionFixed = commissionFixed;
      }
      
      // totalSessions ve totalMinutes işlemleri
      if (totalSessions !== undefined) {
        const sessions = Number(totalSessions);
        if (isNaN(sessions)) {
          throw new BadRequestException('Toplam seans sayısı geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.totalSessions = sessions;
      }
      
      if (totalMinutes !== undefined) {
        const minutes = Number(totalMinutes);
        if (isNaN(minutes)) {
          throw new BadRequestException('Toplam dakika geçerli bir sayı olmalıdır.');
        }
        prismaPackageData.totalMinutes = minutes;
      }
      
      // Zorunlu alanların kontrolü
      if (!packageData.name) {
        throw new BadRequestException('Paket adı zorunludur.');
      }
      prismaPackageData.name = packageData.name;

      if (packageData.price === undefined) {
        throw new BadRequestException('Paket fiyatı zorunludur.');
      }
      
      if (packageData.validityDays === undefined) {
        throw new BadRequestException('Paket geçerlilik gün sayısı zorunludur.');
      }
      
      console.log('Prisma paket verisi:', JSON.stringify(prismaPackageData, null, 2));
      
      // Hizmetler kontrolü
      if (!services || !Array.isArray(services) || services.length === 0) {
        throw new BadRequestException('En az bir hizmet eklenmelidir.');
      }
      
      // Hizmetleri hazırla
      const packageServices = [];
      
      // Tüm hizmetlerin var olduğundan emin ol
      for (const serviceItem of services) {
        if (!serviceItem.serviceId) {
          throw new BadRequestException('Her hizmet için serviceId gereklidir.');
        }
        
        const service = await this.prisma.service.findUnique({
          where: { id: serviceItem.serviceId },
        });

        if (!service) {
          throw new NotFoundException(`Hizmet bulunamadı: ID ${serviceItem.serviceId}`);
        }
        
        // Miktar kontrol
        if (serviceItem.quantity === undefined || serviceItem.quantity === null) {
          throw new BadRequestException(`Hizmet için miktar belirtilmelidir: ${serviceItem.serviceId}`);
        }
        
        // Miktar sayıya dönüştürülüyor
        const quantity = Number(serviceItem.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new BadRequestException(`Geçersiz hizmet miktarı: ${serviceItem.serviceId} için ${quantity}`);
        }
        
        packageServices.push({
          quantity: quantity,
          service: {
            connect: { id: serviceItem.serviceId }
          }
        });
      }
      
      console.log('Hizmetler doğrulandı, paket oluşturuluyor...');
      
      try {
        // ÖNEMLİ: Frontend'den gelen ismi gelen tüm alanları kontrol et
        // 1. Frontend'den gelen `isActive` alanını yok say, bu artık Prisma modelinde yok
        // 2. Frontend'den gelen `type` alanının büyük harfe dönüştürülmesi gerekiyor (session -> SESSION)
        
        console.log('Frontend DTO detaylı inceleme:', {
          receivedType: prismaPackageData.type,
          typeOfReceivedType: typeof prismaPackageData.type,
          isActiveReceived: prismaPackageData.isActive !== undefined
        });
        
        // Sadece veritabanında olan bilinen alanları kullan
        const packageData: any = {
          // Temel zorunlu alanlar
          name: prismaPackageData.name,
          price: prismaPackageData.price,
          validityDays: prismaPackageData.validityDays,
        };
        
        // Type alanı dönüşümü (lowercase -> UPPERCASE)
        // Örn: "session" -> "SESSION", "time" -> "TIME" 
        if (prismaPackageData.type) {
          // type değeri varsa büyük harfe dönüştür
          packageData.type = prismaPackageData.type.toString().toUpperCase();
        } else {
          // Varsayılan tip SESSION
          packageData.type = 'SESSION';
        }
        
        // Şube bilgisi otomatik olarak kullanıcının rolüne göre belirlenir
        // STAFF, RECEPTION, BRANCH_MANAGER, SUPER_BRANCH_MANAGER, ADMIN rollerinin bağlı olduğu şube otomatik eklenecek
        if (user && user.branch && user.branch.id) {
          // Kullanıcı bilgilerinden şube ID'sini al
          packageData.branchId = user.branch.id;
          console.log(`Kullanıcının şubesi otomatik eklendi: ${user.branch.id}`);
        } 
        // Frontend'den gönderilen şube bilgisi sadece ADMIN için geçerli (override)
        else if (user?.role === 'ADMIN' && prismaPackageData.branchId && prismaPackageData.branchId.trim()) {
          packageData.branchId = prismaPackageData.branchId;
          console.log(`Admin tarafından manuel şube atandı: ${prismaPackageData.branchId}`);
        } else {
          console.warn('Dikkat: Paket şube bilgisi belirtilmemiş!');
        }
        
        if (prismaPackageData.description && prismaPackageData.description.trim()) {
          packageData.description = prismaPackageData.description;
        }
        
        // Sayısal değerler - Sadece değer varsa ve Number() ile dönüştürerek ekle
        ['discountedPrice', 'totalSessions', 'totalMinutes', 'commissionRate', 'commissionFixed'].forEach(field => {
          if (prismaPackageData[field] !== undefined && prismaPackageData[field] !== null) {
            packageData[field] = Number(prismaPackageData[field]);
          }
        });
        
        // Önemli: isActive alanını kesinlikle yok saymalıyız
        
        // Hizmetleri ekle
        if (packageServices && packageServices.length > 0) {
          packageData.services = {
            create: packageServices.map(service => ({
              serviceId: service.service.connect.id,
              quantity: service.quantity
            }))
          };
        }
        
        // Veri oluşturma öncesi son kontrol
        console.log('Son paket verisi:', JSON.stringify(packageData, null, 2));
        
        // Paket oluştur - isActive alanı içermediğinden emin ol
        // TypeScript hatasını bypass etmek için as any kullan
        return await this.prisma.package.create({
          data: packageData,
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        } as any);
      } catch (err) {
        console.error('===== Prisma paket oluşturma HATASI =====');
        console.error(err);
        
        if (err.code) {
          console.error('Prisma Hata Kodu:', err.code);
        }
        
        if (err.meta) {
          console.error('Prisma Meta Bilgisi:', err.meta);
        }
        
        throw new BadRequestException(`Paket oluşturulamadı: ${err.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Paket oluşturma hatası:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error; // Zaten formatlanmış hatalar
      } else {
        // Prisma hatalarını yakala ve formatla
        console.error('Detaylı hata bilgisi:', error);
        throw new BadRequestException(
          'Paket oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata')
        );
      }
    }
  }

  async findAllPackages(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    user?: any; // Kullanıcı bilgisi eklendi
  }) {
    const { skip, take, where = {}, orderBy, user } = params;
    
    // Rol bazlı erişim filtreleme
    let roleBasedFilter = {};
    
    if (user) {
      // Kullanıcının rolüne göre filtreleme
      switch(user.role) {
        case 'ADMIN':
          // Admin tüm paketleri görür, filtre yok
          break;
          
        case 'SUPER_BRANCH_MANAGER':
          // Şube yöneticisi bağlı olduğu tüm şubelerin paketlerini görür
          if (user.branch && user.branch.id) {
            // Burada user.managedBranches içinde bağlı olduğu şubeler olduğunu varsayıyoruz
            // Ya da bir servis çağırılabilir
            const managedBranchIds = user.managedBranches?.map(branch => branch.id) || [];
            roleBasedFilter = {
              OR: [
                { branchId: user.branch.id },
                { branchId: { in: managedBranchIds } }
              ]
            };
          }
          break;
          
        case 'BRANCH_MANAGER':
        case 'RECEPTION':
        case 'STAFF':
          // Bu roller sadece kendi şubelerine ait paketleri görür
          if (user.branch && user.branch.id) {
            roleBasedFilter = { branchId: user.branch.id };
          }
          break;
          
        default:
          // Diğer roller hiçbir paket görmez - boş sonuc döner
          roleBasedFilter = { id: 'no-access' }; // Hiçbir paket eşleşmeyecek
      }
      
      console.log(`Rol bazlı filtreleme uygulanıyor: ${user.role}`, roleBasedFilter);
    }

    return this.prisma.package.findMany({
      skip,
      take,
      where: { ...where, ...roleBasedFilter },
      orderBy,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        branch: true, // Şube bilgilerini dahil et
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
        branch: true, // Şube bilgilerini dahil et
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

      // Update için data oluştur
      const updateData: any = {};
      
      // Temel alanlara öncelik ver
      if (packageData.name !== undefined) updateData.name = packageData.name;
      if (packageData.price !== undefined) updateData.price = Number(packageData.price);
      if (packageData.validityDays !== undefined) updateData.validityDays = Number(packageData.validityDays);
      // Description alanını boş string olarak kabul et
      updateData.description = packageData.description || ""
      
      // branchId kontrol
      if (packageData.branchId) {
        if (packageData.branchId.trim() !== '') {
          updateData.branchId = packageData.branchId;
        }
      }
      
      // Diğer alanlar
      if (packageData.isActive !== undefined) updateData.isActive = packageData.isActive;
      if (packageData.discountedPrice !== undefined) updateData.discountedPrice = Number(packageData.discountedPrice);
      if (packageData.totalSessions !== undefined) updateData.totalSessions = Number(packageData.totalSessions);
      if (packageData.totalMinutes !== undefined) updateData.totalMinutes = Number(packageData.totalMinutes);
      if (packageData.commissionRate !== undefined) updateData.commissionRate = Number(packageData.commissionRate);
      if (packageData.commissionFixed !== undefined) updateData.commissionFixed = Number(packageData.commissionFixed);
      
      // Type alanını kontrol et ve dönüştür
      if (packageData.type) {
        if (packageData.type === 'session') {
          updateData.type = 'SESSION';
        } else if (packageData.type === 'time') {
          updateData.type = 'TIME';
        }
      }
      
      // Servisleri ekle
      updateData.services = {
        create: services.map(service => ({
          quantity: Number(service.quantity),
          service: {
            connect: {
              id: service.serviceId,
            },
          },
        })),
      };
      
      console.log('Güncellenecek paket verisi:', JSON.stringify(updateData, null, 2));
      
      // Paketi güncelle
      return this.prisma.package.update({
        where: { id },
        data: updateData,
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
    const updateData: any = {};
    
    // Temel alanlara öncelik ver
    if (packageData.name !== undefined) updateData.name = packageData.name;
    if (packageData.price !== undefined) updateData.price = Number(packageData.price);
    if (packageData.validityDays !== undefined) updateData.validityDays = Number(packageData.validityDays);
    // NOT: Prisma şemasında description alanı yok, bu yüzden kaldırıldı
    
    // branchId kontrol
    if (packageData.branchId) {
      if (packageData.branchId.trim() !== '') {
        updateData.branchId = packageData.branchId;
      }
    }
    
    // Diğer alanlar
    if (packageData.isActive !== undefined) updateData.isActive = packageData.isActive;
    if (packageData.discountedPrice !== undefined) updateData.discountedPrice = Number(packageData.discountedPrice);
    if (packageData.totalSessions !== undefined) updateData.totalSessions = Number(packageData.totalSessions);
    if (packageData.totalMinutes !== undefined) updateData.totalMinutes = Number(packageData.totalMinutes);
    if (packageData.commissionRate !== undefined) updateData.commissionRate = Number(packageData.commissionRate);
    if (packageData.commissionFixed !== undefined) updateData.commissionFixed = Number(packageData.commissionFixed);
    
    // Type alanını kontrol et ve dönüştür
    if (packageData.type) {
      if (packageData.type === 'session') {
        updateData.type = 'SESSION';
      } else if (packageData.type === 'time') {
        updateData.type = 'TIME';
      }
    }
    
    console.log('Güncellenecek paket verisi (servis olmadan):', JSON.stringify(updateData, null, 2));
    
    return this.prisma.package.update({
      where: { id },
      data: updateData,
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
    try {
      console.log('Müşteri paketi oluşturma isteği alındı:', JSON.stringify(createCustomerPackageDto, null, 2));
      
      const { customerId, packageId, salesCode, notes, startDate } = createCustomerPackageDto;

      // Gerekli alanların kontrolü
      if (!customerId) {
        console.error('Müşteri ID eksik');
        throw new BadRequestException('Müşteri ID gereklidir');
      }

      if (!packageId) {
        console.error('Paket ID eksik');
        throw new BadRequestException('Paket ID gereklidir');
      }

      // Müşterinin var olduğundan emin ol
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        console.error(`Müşteri bulunamadı: ID ${customerId}`);
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
        console.error(`Paket bulunamadı: ID ${packageId}`);
        throw new NotFoundException(`Paket bulunamadı: ID ${packageId}`);
      }

      // Paket başlangıç ve bitiş tarihini hesapla
      let purchaseDate;
      try {
        purchaseDate = startDate ? new Date(startDate) : new Date();
        if (isNaN(purchaseDate.getTime())) {
          throw new Error('Geçersiz tarih formatı');
        }
      } catch (error) {
        console.error('Tarih ayrıştırma hatası:', error);
        throw new BadRequestException(`Geçersiz başlangıç tarihi formatı: ${startDate}`);
      }
      
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + packageItem.validityDays);

      // Kalan seanslar veya dakikalar için değerleri ayarla
      let remainingSessions = null;
      let remainingMinutes = null;
      
      if (packageItem.type === 'SESSION' && packageItem.totalSessions) {
        remainingSessions = packageItem.totalSessions;
      } else if (packageItem.type === 'TIME' && packageItem.totalMinutes) {
        remainingMinutes = packageItem.totalMinutes;
      }
      
      // Servis bazlı kalan seanslar için JSON oluştur
      const remainingServiceSessions = {};
      if (packageItem.services && packageItem.services.length > 0) {
        packageItem.services.forEach(service => {
          remainingServiceSessions[service.serviceId] = service.quantity;
        });
      } else {
        // Eğer servis yoksa, boş bir JSON objesi oluştur
        remainingServiceSessions['default'] = 0;
      }

      console.log('Oluşturulacak müşteri paketi verileri:', {
        purchaseDate,
        expiryDate,
        remainingSessions: remainingServiceSessions,
        customerId,
        packageId,
        salesCode,
        notes
      });

      // Müşteri paketini oluştur
      return this.prisma.customerPackage.create({
        data: {
          purchaseDate,
          expiryDate,
          remainingSessions: remainingServiceSessions, // Prisma şemasında Json tipinde
          customerId,
          packageId,
          ...(salesCode ? { salesCode } : {}), // Conditional spread operator ile ekle
          ...(notes ? { notes } : {}), // Conditional spread operator ile ekle
        } as any, // Type assertion kullanarak tip hatalarını geçici olarak çöz
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
  } catch (error) {
    console.error('Müşteri paketi oluşturma hatası:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      // Prisma hata kodlarına göre özel mesajlar
      if (error.code === 'P2002') {
        throw new BadRequestException('Bu müşteri için aynı paket zaten mevcut.');
      } else if (error.code === 'P2003') {
        throw new BadRequestException('Geçersiz müşteri veya paket ID.');
      }
    }
    // Diğer hatalar için
    throw new BadRequestException(error.message || 'Müşteri paketi oluşturulurken bir hata oluştu.');
  }
  }

  async findAllCustomerPackages(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    active?: boolean;
  }) {
    const { skip, take, customerId, active } = params;

    console.log('findAllCustomerPackages çağrıldı, parametreler:', { skip, take, customerId, active });

    // Filtreleri oluştur
    const where: any = {};
    
    // Özel durum: customerId 'all' ise tüm müşterilerin paketlerini getir
    if (customerId && customerId !== 'all') {
      where.customerId = customerId;
      console.log(`Müşteri ID'sine göre filtreleme yapılıyor: ${customerId}`);
    } else if (customerId === 'all') {
      console.log('Tüm müşterilerin paketleri getiriliyor (customerId=all)');
    } else {
      console.log('customerId belirtilmedi, tüm paketler getiriliyor');
    }
    
    console.log('CustomerPackage sorgusu için filtreler:', { skip, take, customerId, active, where });

    // Sadece aktif paketleri listele
    if (active) {
      where.expiryDate = { gte: new Date() };
    }

    try {
      const result = await this.prisma.customerPackage.findMany({
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
      
      console.log(`Bulunan paket sayısı: ${result.length}`);
      return result;
    } catch (error) {
      console.error('Paketleri getirirken hata oluştu:', error);
      throw error;
    }
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
