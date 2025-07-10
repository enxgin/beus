import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, StaffCommission } from '@prisma/client';
import { CommissionStatus } from '../prisma/prisma-types';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private prisma: PrismaService) {}

  // Yeni hiyerarşik prim sistemi ile prim hesaplama
  async calculateCommissionForInvoice(invoiceId: string): Promise<StaffCommission | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        appointment: {
          include: {
            service: true,
            staff: true,
          },
        },
      },
    });

    if (!invoice || !invoice.appointment || invoice.status !== 'PAID') {
      this.logger.log(`Prim hesaplaması için uygun olmayan fatura: ${invoiceId}`);
      return null;
    }

    const existingCommission = await this.prisma.staffCommission.findFirst({
      where: { invoiceId },
    });

    if (existingCommission) {
      this.logger.log(`Bu fatura için zaten bir prim mevcut: ${invoiceId}`);
      return existingCommission;
    }

    const { appointment } = invoice;
    const { service, staff } = appointment;

    // Hiyerarşik prim kuralını bul (en yüksek öncelikten başlayarak)
    let applicableRule = null;

    // 1. Personel özel kural (en yüksek öncelik)
    applicableRule = await this.prisma.commissionRule.findFirst({
      where: {
        ruleType: 'STAFF_SPECIFIC',
        staffId: staff.id,
        isActive: true,
        branchId: invoice.branchId,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Hizmet özel kural (orta öncelik)
    if (!applicableRule) {
      applicableRule = await this.prisma.commissionRule.findFirst({
        where: {
          ruleType: 'SERVICE_SPECIFIC',
          serviceId: service.id,
          isActive: true,
          branchId: invoice.branchId,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 3. Genel kural (en düşük öncelik)
    if (!applicableRule) {
      applicableRule = await this.prisma.commissionRule.findFirst({
        where: {
          ruleType: 'GENERAL',
          isActive: true,
          branchId: invoice.branchId,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!applicableRule) {
      this.logger.log(`Bu fatura için geçerli prim kuralı bulunamadı: ${invoiceId}`);
      return null;
    }

    // Prim tutarını hesapla
    let commissionAmount = 0;
    if (applicableRule.type === 'PERCENTAGE') {
      commissionAmount = invoice.totalAmount * (applicableRule.rate / 100);
    } else if (applicableRule.type === 'FIXED_AMOUNT') {
      commissionAmount = applicableRule.fixedAmount;
    }

    this.logger.log(`Prim hesaplandı: Fatura #${invoiceId}, Kural: ${applicableRule.name}, Tutar: ${commissionAmount}`);

    // Önce CommissionItem oluştur
    const commissionItem = await this.prisma.commissionItem.create({
      data: {
        invoiceId: invoice.id,
        serviceId: service.id,
        amount: commissionAmount,
        status: 'PENDING',
        appliedRuleId: applicableRule.id
      }
    });

    // Prim kaydını oluştur
    const commission = await this.prisma.staffCommission.create({
      data: {
        amount: commissionAmount,
        status: 'PENDING',
        staffId: staff.id,
        serviceId: service.id,
        invoiceId: invoice.id,
        appliedRuleId: applicableRule.id,
        commissionItemId: commissionItem.id
      },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        service: true,
        invoice: true,
        commissionItem: {
          include: {
            appliedRule: true
          }
        }
      }
    });

    this.logger.log(`Prim kaydı oluşturuldu: ${commission.id}`);
    return commission;
  }

  async updateStatus(id: string, dto: UpdateCommissionStatusDto): Promise<StaffCommission> {
    await this.prisma.staffCommission.findUniqueOrThrow({ where: { id } });
    return this.prisma.staffCommission.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findAll(filters?: {
    userId?: string;
    serviceId?: string;
    status?: CommissionStatus;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...where } = filters || {};
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.staffCommission.findMany({
        where,
        include: {
          // Hatalı 'appliedRule' ilişkisi kaldırıldı.
          staff: { select: { id: true, name: true, email: true } },
          service: true,
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.staffCommission.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<StaffCommission> {
    const commission = await this.prisma.staffCommission.findUnique({
      where: { id },
      include: {
        // Hatalı 'appliedRule' ilişkisi kaldırıldı.
        staff: { select: { id: true, name: true, email: true } },
        service: true,
        invoice: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Prim kaydı bulunamadı: ${id}`);
    }

    return commission;
  }
}
