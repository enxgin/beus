import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAvailableStaff(branchId: string, serviceId?: string) {
    console.log('🔍 StaffService.findAvailableStaff() çağrıldı');
    console.log('📍 branchId:', branchId);
    console.log('🔧 serviceId:', serviceId);
    
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

    console.log('🔍 Where clause:', whereClause);

    const result = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
      },
    });
    
    console.log('👥 Bulunan personel sayısı:', result.length);
    console.log('👥 Personel listesi:', result);
    
    return result;
  }
}
