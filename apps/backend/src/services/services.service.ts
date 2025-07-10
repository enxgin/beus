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
          connect: { id: branchId },
        },
        category: {
          connect: { id: categoryId },
        },
        staff: {
          create: staffIds.map((staffId) => ({
            staff: {
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
            staff: true,
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
      ignoreBranchFilter?: string;
    },
  ) {
    const { skip, take, branchId, categoryId, search, orderBy, ignoreBranchFilter } = params;

    const where: any = {
      isActive: true,
    };

    if (ignoreBranchFilter !== 'true') {
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
        where.branchId = user.branchId;
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const services = await this.prisma.service.findMany({
      where,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: orderBy ? JSON.parse(orderBy) : { name: 'asc' },
      include: {
        category: true,
        branch: true,
        staff: {
          include: {
            staff: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    const totalCount = await this.prisma.service.count({ where });

    return {
      data: services,
      totalCount,
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        branch: true,
        staff: {
          include: {
            staff: true,
          },
        },
      },
    });
    if (!service) {
      throw new NotFoundException(`Hizmet bulunamadı: ID ${id}`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const { staffIds, categoryId, branchId, ...serviceData } = updateServiceDto;

    return this.prisma.$transaction(async (prisma) => {
      await prisma.service.update({
        where: { id },
        data: {
          ...serviceData,
          ...(categoryId && { category: { connect: { id: categoryId } } }),
          ...(branchId && { branch: { connect: { id: branchId } } }),
        },
      });

      if (staffIds) {
        const existingStaff = await prisma.staffService.findMany({
          where: { serviceId: id },
          select: { staffId: true },
        });
        const existingStaffIds = existingStaff.map((s) => s.staffId);

        const staffToConnect = staffIds.filter((sid) => !existingStaffIds.includes(sid));
        const staffToDisconnect = existingStaffIds.filter((sid) => !staffIds.includes(sid));

        if (staffToDisconnect.length > 0) {
          await prisma.staffService.deleteMany({
            where: {
              serviceId: id,
              staffId: { in: staffToDisconnect },
            },
          });
        }

        if (staffToConnect.length > 0) {
          await prisma.staffService.createMany({
            data: staffToConnect.map((staffId) => ({
              serviceId: id,
              staffId: staffId,
            })),
          });
        }
      }

      return prisma.service.findUnique({
        where: { id },
        include: {
          category: true,
          branch: true,
          staff: {
            include: {
              staff: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const appointmentCount = await this.prisma.appointment.count({
      where: { serviceId: id },
    });

    if (appointmentCount > 0) {
      throw new NotFoundException(
        `Bu hizmete ait ${appointmentCount} adet randevu bulunmaktadır. Hizmeti silemezsiniz.`,
      );
    }

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
