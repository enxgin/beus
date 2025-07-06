import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionType } from '../prisma/prisma-types';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';

@Injectable()
export class CommissionRulesService {
  constructor(private prisma: PrismaService) {}

  // Genel kural oluşturma
  async createGlobalRule(data: CreateCommissionRuleDto) {
    // Önceki genel kuralları pasif yap (sadece bir tane aktif genel kural olabilir)
    await this.prisma.commissionRule.updateMany({
      where: {
        isGlobal: true,
      },
      data: {
        isGlobal: false,
      },
    });

    return this.prisma.commissionRule.create({
      data: {
        type: data.type,
        value: data.value,
        description: data.description,
        isGlobal: true,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Hizmete özel kural oluşturma
  async createServiceRule(data: CreateCommissionRuleDto) {
    if (!data.serviceId) {
      throw new BadRequestException('Hizmet ID\'si gereklidir');
    }
    
    // Hizmetin varlığını kontrol et
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new BadRequestException('Hizmet bulunamadı');
    }
    
    return this.prisma.commissionRule.create({
      data: {
        type: data.type,
        value: data.value,
        description: data.description,
        service: {
          connect: {
            id: data.serviceId,
          },
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Personele özel kural oluşturma
  async createUserRule(data: CreateCommissionRuleDto) {
    if (!data.userId) {
      throw new BadRequestException('Personel ID\'si gereklidir');
    }
    
    // Personelin varlığını kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new BadRequestException('Personel bulunamadı');
    }
    
    return this.prisma.commissionRule.create({
      data: {
        type: data.type,
        value: data.value,
        description: data.description,
        user: {
          connect: {
            id: data.userId,
          },
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Kural listesi
  async findAll(params?: {
    userId?: string;
    serviceId?: string;
    isGlobal?: boolean;
  }) {
    return this.prisma.commissionRule.findMany({
      where: params,
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Kural silme
  async remove(id: string) {
    return this.prisma.commissionRule.delete({
      where: { id },
    });
  }

  // Kural güncelleme
  async update(id: string, data: Partial<CreateCommissionRuleDto>) {
    return this.prisma.commissionRule.update({
      where: { id },
      data,
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Kural detayı
  async findOne(id: string) {
    return this.prisma.commissionRule.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
