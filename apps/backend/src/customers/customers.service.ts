import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async seedCustomers() {
    // First, delete all existing CustomerTag records to avoid foreign key constraint violations
    await this.prisma.customerTag.deleteMany({});
    // Then, delete all existing customers
    await this.prisma.customer.deleteMany({});

    const customersToCreate = [];
    // Ensure these IDs are valid and exist in your 'branches' table
    const branch2Id = 'clx9c1o5s000214myn0y9c2m3';
    const branch3Id = 'clx9c1o5w000414myq2ol6xce';

    // Create 10 customers for Branch 2
    for (let i = 0; i < 10; i++) {
      customersToCreate.push({
        name: faker.person.fullName(),
        phone: `053${faker.string.numeric(8)}`,
        branchId: branch2Id,
      });
    }

    // Create 10 customers for Branch 3
    for (let i = 0; i < 10; i++) {
      customersToCreate.push({
        name: faker.person.fullName(),
        phone: `054${faker.string.numeric(8)}`,
        branchId: branch3Id,
      });
    }

    await this.prisma.customer.createMany({
      data: customersToCreate,
      skipDuplicates: true, // In case of phone number collision
    });

    return { message: 'Seed successful: 20 random customers created.' };
  }

  create(createCustomerDto: CreateCustomerDto) {
    const { tagIds, ...customerData } = createCustomerDto;
    return this.prisma.customer.create({
      data: {
        ...customerData,
        tags: {
          create: tagIds?.map((id) => ({
            tag: {
              connect: { id: id },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerWhereUniqueInput;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.customer.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        appointments: {
          include: {
            service: true,
            staff: true,
            customerPackage: true,
            invoice: true
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        customerPackages: {
          include: {
            package: true,
            usageHistory: true
          },
          orderBy: {
            purchaseDate: 'desc'
          }
        },
        invoices: {
          include: {
            payments: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });
    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı (ID: ${id})`);
    }
    return customer;
  }

  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException(`Telefon numarasına sahip müşteri bulunamadı: ${phone}`);
    }
    return customer;
  }

  async getCustomerPackages(id: string) {
    await this.findOne(id); // Check if customer exists
    return [];
  }

  update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const { tagIds, ...customerData } = updateCustomerDto;
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...customerData,
        tags: {
          deleteMany: {},
          create: tagIds?.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  async findAllForUser(user: { userId: string; role: string; branchId: string }, branchId?: string) {
    const where: Prisma.CustomerWhereInput = {};
    const { role, branchId: userBranchId } = user;

    switch (role) {
      case 'ADMIN':
        if (branchId) {
          where.branchId = branchId;
        }
        // No branchId means all branches
        break;

      case 'SUPER_BRANCH_MANAGER':
        const managedBranches = await this.prisma.branch.findMany({
          where: {
            OR: [
              { id: userBranchId }, // The main branch
              { parentBranchId: userBranchId }, // Sub-branches
            ],
          },
        });
        const managedBranchIds = managedBranches.map((b) => b.id);

        if (branchId) {
          if (!managedBranchIds.includes(branchId)) {
            throw new ForbiddenException('Bu şubeye erişim yetkiniz yok.');
          }
          where.branchId = branchId;
        } else {
          where.branchId = { in: managedBranchIds };
        }
        break;

      case 'BRANCH_MANAGER':
      case 'RECEPTION':
      case 'STAFF':
        where.branchId = userBranchId;
        break;

      default:
        throw new ForbiddenException('Müşterileri listelemek için yetkiniz yok.');
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        branch: true, // Frontend'de şube adını göstermek için
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(name: string, branchId: string) {
    console.log(`Searching database for customer with name or phone containing: "${name}" in branch: ${branchId}`);
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
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: 10,
    });
  }
}
