import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAvailableStaff(branchId: string, serviceId?: string) {
    const whereClause: any = {
      branchId: branchId,
      role: {
        in: [UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.RECEPTION],
      },
    };

    // Eğer serviceId varsa, sorguya hizmet filtresini ekle
    if (serviceId) {
      whereClause.services = {
        some: {
          serviceId: serviceId,
        },
      };
    }

    return this.prisma.user.findMany({
      where: whereClause,
    });
  }
}
