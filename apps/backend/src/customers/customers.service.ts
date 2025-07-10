import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Etiketlerle ilgili `tagIds` alanı DTO'dan kaldırıldı.
    const { branchId, ...customerData } = createCustomerDto;

    try {
      // Etiket işlemleri olmadığı için transaction kaldırıldı.
      const newCustomer = await this.prisma.customer.create({
        data: {
          ...customerData,
          branch: {
            connect: { id: branchId },
          },
        },
      });
      return newCustomer;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Bu telefon numarası zaten kayıtlı.');
      }
      throw error;
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Etiketlerle ilgili `tagIds` alanı DTO'dan kaldırıldı.
    const { branchId, ...customerData } = updateCustomerDto;

    await this.prisma.customer.findUniqueOrThrow({ where: { id } });

    // Etiket işlemleri olmadığı için transaction kaldırıldı.
    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
      ...customerData,
      ...(branchId && { branch: { connect: { id: branchId } } }),
    },
    });

    return updatedCustomer;
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      // Etiketler (`tags`) artık include edilmiyor.
      include: {
        branch: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı (ID: ${id})`);
    }
    return customer;
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
      // Etiketler (`tags`) artık include edilmiyor.
      include: {
        branch: true, // Frontend'de şube adını göstermek için
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
}
