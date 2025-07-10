import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionType, CommissionRuleType } from '../prisma/prisma-types';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';

@Injectable()
export class CommissionRulesService {
  constructor(private prisma: PrismaService) {}

  // Akıllı prim kuralı oluşturma - Hiyerarşik sistem
  async createRule(data: CreateCommissionRuleDto, userBranchId: string) {
    // Kural tipini belirle
    let ruleType: CommissionRuleType = 'GENERAL';
    let serviceId: string | null = null;
    let staffId: string | null = null;
    let ruleName = data.name;

    if (data.ruleType === 'STAFF_SPECIFIC' && data.staffId) {
      // Personele özel kural
      const staff = await this.prisma.user.findUnique({
        where: { id: data.staffId },
      });
      if (!staff) {
        throw new BadRequestException('Personel bulunamadı');
      }
      ruleType = 'STAFF_SPECIFIC';
      staffId = data.staffId;
      if (!ruleName) {
        ruleName = `${staff.name} - Personele Özel Prim`;
      }
    } else if (data.ruleType === 'SERVICE_SPECIFIC' && data.serviceId) {
      // Hizmete özel kural
      const service = await this.prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) {
        throw new BadRequestException('Hizmet bulunamadı');
      }
      ruleType = 'SERVICE_SPECIFIC';
      serviceId = data.serviceId;
      if (!ruleName) {
        ruleName = `${service.name} - Hizmete Özel Prim`;
      }
    } else {
      // Genel kural
      ruleType = 'GENERAL';
      if (!ruleName) {
        ruleName = 'Genel Prim Kuralı';
      }
    }

    return this.prisma.commissionRule.create({
      data: {
        name: ruleName,
        ruleType,
        type: data.type || 'PERCENTAGE',
        rate: data.type === 'PERCENTAGE' ? (data.rate || 0) : 0,
        fixedAmount: data.type === 'FIXED_AMOUNT' ? (data.fixedAmount || 0) : 0,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        branchId: data.branchId || userBranchId,
        serviceId,
        staffId,
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Prim hesaplama motoru - Hiyerarşik öncelik sistemi
  async calculateCommission(staffId: string, serviceId: string, invoiceAmount: number, branchId: string) {
    console.log(`🔍 Prim hesaplanıyor - Personel: ${staffId}, Hizmet: ${serviceId}, Tutar: ${invoiceAmount}`);
    
    // Seviye 1: Personele özel kural (En yüksek öncelik)
    const staffRule = await this.prisma.commissionRule.findFirst({
      where: {
        ruleType: 'STAFF_SPECIFIC',
        staffId: staffId,
        branchId: branchId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    if (staffRule) {
      // Personel bilgisini ayrı olarak çek
      const staff = await this.prisma.user.findUnique({
        where: { id: staffId },
        select: { name: true }
      });
      
      const amount = this.calculateAmount(staffRule, invoiceAmount);
      console.log(`✅ Personele özel kural uygulandı: ${staffRule.name} - ${amount} TL`);
      return {
        amount,
        appliedRule: staffRule,
        ruleDescription: `Personele Özel: ${staff?.name} - ${this.getRuleText(staffRule)}`
      };
    }

    // Seviye 2: Hizmete özel kural (Orta öncelik)
    const serviceRule = await this.prisma.commissionRule.findFirst({
      where: {
        ruleType: 'SERVICE_SPECIFIC',
        serviceId: serviceId,
        branchId: branchId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    if (serviceRule) {
      // Hizmet bilgisini ayrı olarak çek
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true }
      });
      
      const amount = this.calculateAmount(serviceRule, invoiceAmount);
      console.log(`✅ Hizmete özel kural uygulandı: ${serviceRule.name} - ${amount} TL`);
      return {
        amount,
        appliedRule: serviceRule,
        ruleDescription: `Hizmete Özel: ${service?.name} - ${this.getRuleText(serviceRule)}`
      };
    }

    // Seviye 3: Genel kural (En düşük öncelik - Varsayılan)
    const generalRule = await this.prisma.commissionRule.findFirst({
      where: {
        ruleType: 'GENERAL',
        branchId: branchId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    if (generalRule) {
      const amount = this.calculateAmount(generalRule, invoiceAmount);
      console.log(`✅ Genel kural uygulandı: ${generalRule.name} - ${amount} TL`);
      return {
        amount,
        appliedRule: generalRule,
        ruleDescription: `Genel Kural: ${this.getRuleText(generalRule)}`
      };
    }

    console.log(`❌ Hiçbir prim kuralı bulunamadı`);
    return {
      amount: 0,
      appliedRule: null,
      ruleDescription: 'Prim kuralı bulunamadı'
    };
  }

  private calculateAmount(rule: any, invoiceAmount: number): number {
    if (rule.type === 'PERCENTAGE') {
      return (invoiceAmount * rule.rate) / 100;
    } else {
      return rule.fixedAmount;
    }
  }

  private getRuleText(rule: any): string {
    if (rule.type === 'PERCENTAGE') {
      return `%${rule.rate}`;
    } else {
      return `${rule.fixedAmount} TL`;
    }
  }

  // CRUD operasyonları
  async findAll(filters: any = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters.userId) {
      where.staffId = filters.userId;
    }
    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }
    if (filters.isGlobal === true) {
      where.ruleType = 'GENERAL';
    }

    const [rules, total] = await Promise.all([
      this.prisma.commissionRule.findMany({
        where,
        skip,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.commissionRule.count({ where }),
    ]);

    return {
      data: rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.commissionRule.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateCommissionRuleDto>) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.description) updateData.description = data.description;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.branchId) updateData.branchId = data.branchId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    if (data.value !== undefined || data.rate !== undefined || data.fixedAmount !== undefined) {
      if (data.type === 'PERCENTAGE') {
        updateData.rate = data.value || data.rate || 0;
        updateData.fixedAmount = 0;
      } else if (data.type === 'FIXED_AMOUNT') {
        updateData.fixedAmount = data.value || data.fixedAmount || 0;
        updateData.rate = 0;
      }
    }

    return this.prisma.commissionRule.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.commissionRule.delete({
      where: { id },
    });
  }
}
