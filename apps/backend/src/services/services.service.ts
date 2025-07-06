import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // Hizmet İşlemleri
  async create(createServiceDto: CreateServiceDto) {
    const { staffIds, branchId, categoryId, ...serviceData } = createServiceDto;

    return this.prisma.service.create({
      data: {
        ...serviceData,
        branch: {
          connect: { id: branchId }
        },
        category: {
          connect: { id: categoryId }
        },
        staff: {
          create: staffIds.map((staffId) => ({
            user: {
              connect: { id: staffId },
            },
          })),
        },
      },
      include: {
        category: true,
        branch: true,
        staff: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(
    user: any,
    params: {
      skip?: number;
      take?: number;
      branchId?: string;
      categoryId?: string;
      search?: string;
      orderBy?: any;
    },
  ) {
    const { skip, take, branchId, categoryId, search, orderBy } = params;

    const where: any = {
      isActive: true,
    };

    // Role-based branch filtering
    if (user.role === 'ADMIN') {
      if (branchId) {
        where.branchId = branchId;
      }
    } else if (user.role === 'SUPER_BRANCH_MANAGER') {
      const managedBranchIds = user.branches?.map((b) => b.id) || [];
      if (branchId && managedBranchIds.includes(branchId)) {
        where.branchId = branchId;
      } else {
        where.branchId = { in: managedBranchIds };
      }
    } else {
      // STAFF, BRANCH_MANAGER, RECEPTION
      if (user.branchId) {
        where.branchId = user.branchId;
      } else {
        // If user has no branch, they see no services.
        return { data: [], totalCount: 0 };
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [services, totalCount] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          category: true,
          branch: true,
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      totalCount,
    };
  }

  async findOne(id: string) {
    // 1. Get service without staff
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        branch: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Hizmet bulunamadı: ID ${id}`);
    }

    // 2. Get all relevant staff links
    const staffLinks = await this.prisma.staffService.findMany({
      where: { serviceId: service.id },
      select: { userId: true },
    });

    const userIds = staffLinks.map((sl) => sl.userId);

    // 3. Get all relevant users
    const staff = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    // 4. Manually combine the data
    return { ...service, staff };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const { staffIds, ...serviceData } = updateServiceDto;

    // Tüm işlemleri tek bir atomik transaction içinde güvenli bir şekilde yap
    return this.prisma.$transaction(async (tx) => {
      // 1. Hizmetin kendi alanlarını (fiyat, süre vb.) güncelle
      //    Eğer DTO içinde hizmetle ilgili başka alanlar varsa, onlar güncellenir.
      if (Object.keys(serviceData).length > 0) {
        await tx.service.update({
          where: { id },
          data: serviceData,
        });
      }

      // 2. Personel ID'leri (staffIds) DTO içinde gönderildiyse, ilişkileri senkronize et.
      //    Eğer staffIds gönderilmediyse (undefined), personel ilişkilerine dokunulmaz.
      if (staffIds !== undefined) {
        // Önce bu hizmete bağlı mevcut TÜM personel ilişkilerini sil.
        await tx.staffService.deleteMany({
          where: { serviceId: id },
        });

        // Ardından, yeni listedeki her bir personel için yeni ilişki kayıtları oluştur.
        // Eğer staffIds boş bir array ise, kimse eklenmez ve hizmet personelsiz kalır.
        if (staffIds.length > 0) {
          await tx.staffService.createMany({
            data: staffIds.map((userId) => ({
              serviceId: id,
              userId: userId,
            })),
          });
        }
      }

      // 3. Son olarak, güncellenmiş hizmeti tüm ilişkileriyle birlikte döndür.
      return tx.service.findUnique({
        where: { id },
        include: {
          category: true,
          branch: true,
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    // İlişkili randevu olup olmadığını kontrol et
    const appointmentCount = await this.prisma.appointment.count({
      where: { serviceId: id },
    });

    if (appointmentCount > 0) {
      throw new NotFoundException(
        `Bu hizmete ait ${appointmentCount} adet randevu bulunmaktadır. Hizmeti silemezsiniz.`,
      );
    }

    // Prisma şemasında onDelete: Cascade olduğu için StaffService kayıtları otomatik silinecektir.
    return this.prisma.service.delete({
      where: { id },
    });
  }

  // Kategori İşlemleri
  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.serviceCategory.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ID ${id}`);
    }
    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async removeCategory(id: string) {
    const serviceCount = await this.prisma.service.count({
      where: { categoryId: id },
    });

    if (serviceCount > 0) {
      // NotFoundException yerine BadRequestException kullanıyoruz
      throw new BadRequestException(
        `Bu kategoriye ait ${serviceCount} adet hizmet bulunmaktadır. Önce bu hizmetleri başka bir kategoriye taşıyın veya silin.`,
      );
    }

    try {
      return await this.prisma.serviceCategory.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Kategori silme hatası:', error);
      throw new BadRequestException(
        'Kategori silinemedi. Başka kayıtlarla ilişkili olabilir.',
      );
    }
  }
}
