import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { staffIds, ...serviceData } = createServiceDto;

    return this.prisma.service.create({
      data: {
        ...serviceData,
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

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;
    // 1. Get services without staff
    const services = await this.prisma.service.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        category: true,
        branch: true,
      },
    });

    const serviceIds = services.map((s) => s.id);

    // 2. Get all relevant staff links
    const staffLinks = await this.prisma.staffService.findMany({
      where: { serviceId: { in: serviceIds } },
      select: { userId: true, serviceId: true },
    });

    const userIds = [...new Set(staffLinks.map((sl) => sl.userId))];

    // 3. Get all relevant users
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const usersMap = new Map(users.map((u) => [u.id, u]));

    // 4. Manually combine the data
    const servicesWithStaff = services.map((service) => {
      const relevantLinks = staffLinks.filter(
        (sl) => sl.serviceId === service.id,
      );
      const staff = relevantLinks
        .map((rl) => usersMap.get(rl.userId))
        .filter(Boolean);
      return { ...service, staff };
    });

    return servicesWithStaff;
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

    const updatePayload: any = { ...serviceData };

    if (staffIds) {
      updatePayload.staff = {
        // Önce mevcut ilişkileri sil
        deleteMany: {},
        // Sonra yeni ilişkileri oluştur
        create: staffIds.map((staffId) => ({
          user: {
            connect: { id: staffId },
          },
        })),
      };
    }

    return this.prisma.service.update({
      where: { id },
      data: updatePayload,
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
      throw new NotFoundException(
        `Bu kategoriye ait ${serviceCount} adet hizmet bulunmaktadır. Kategoriyi silemezsiniz.`,
      );
    }

    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }
}
