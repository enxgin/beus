import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus, CommissionType } from '../prisma/prisma-types';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  
  constructor(private prisma: PrismaService) {}

  // Faturayla ilişkili prim hesaplama
  async calculateCommissionForInvoice(invoiceId: string) {
    // Faturayı ilgili detaylarla getir
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

    if (!invoice) {
      this.logger.log(`Fatura bulunamadı: ${invoiceId}`);
      throw new NotFoundException(`Fatura bulunamadı: ${invoiceId}`);
    }

    if (invoice.status !== 'PAID') {
      this.logger.log(`Fatura ödenmemiş durumda: ${invoiceId}`);
      return null;
    }

    // Mevcut prim var mı kontrol et
    const existingCommission = await this.prisma.staffCommission.findUnique({
      where: { invoiceId },
    });

    if (existingCommission) {
      this.logger.log(`Bu fatura için zaten bir prim hesaplanmış: ${invoiceId}`);
      return existingCommission;
    }

    const { appointment } = invoice;
    
    if (!appointment) {
      this.logger.log(`Faturaya bağlı randevu bulunamadı: ${invoiceId}`);
      return null;
    }
    
    const { service, staff: user } = appointment;
    const serviceId = service.id;
    const userId = user.id;
    const invoiceAmount = invoice.totalAmount;

    this.logger.log(`Prim hesaplanıyor: Fatura #${invoiceId}, Personel: ${userId}, Hizmet: ${serviceId}, Tutar: ${invoiceAmount}`);

    // 1. Personel için özel kural var mı?
    const userRule = await this.prisma.commissionRule.findFirst({
      where: {
        userId,
        isGlobal: false,
      },
    });

    // 2. Hizmete özel kural var mı?
    const serviceRule = await this.prisma.commissionRule.findFirst({
      where: {
        serviceId,
        userId: null, // Hizmete özel olduğu için personel bağlantısı olmayacak
        isGlobal: false,
      },
    });

    // 3. Genel kural var mı?
    const globalRule = await this.prisma.commissionRule.findFirst({
      where: {
        isGlobal: true,
      },
    });

    // Öncelik sıralamasına göre uygun kuralı seç
    const appliedRule = userRule || serviceRule || globalRule;

    if (!appliedRule) {
      this.logger.log(`Hiçbir prim kuralı bulunamadı: Fatura #${invoiceId}`);
      return null;
    }

    // Prim miktarını hesapla
    let commissionAmount = 0;
    if (appliedRule.type === CommissionType.PERCENTAGE) {
      commissionAmount = invoiceAmount * (appliedRule.value / 100);
    } else {
      commissionAmount = appliedRule.value; // Sabit tutar
    }

    // Sonuçları logla
    this.logger.log(`Prim hesaplandı: Personel: ${userId}, Kural tipi: ${appliedRule.type}, Değer: ${appliedRule.value}, Hesaplanan tutar: ${commissionAmount}`);

    // Prim kaydı oluştur
    return this.prisma.staffCommission.create({
      data: {
        amount: commissionAmount,
        // @ts-ignore - status field is defined in our schema
        status: CommissionStatus.PENDING,
        appliedRuleId: appliedRule.id,
        staffId: userId,
        serviceId,
        invoiceId,
      },
      include: {
        // @ts-ignore - appliedRule relation is defined in our schema
        appliedRule: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        invoice: true,
      },
    });
  }

  // Fatura iptal edildiğinde ilişkili primi iptal et
  async cancelCommissionForInvoice(invoiceId: string) {
    const commission = await this.prisma.staffCommission.findUnique({
      where: { invoiceId },
    });

    if (!commission) {
      this.logger.log(`İptal edilecek prim bulunamadı: Fatura #${invoiceId}`);
      return null;
    }

    return this.prisma.staffCommission.update({
      where: { invoiceId },
      data: {
        // @ts-ignore - status field is defined in our schema
        status: CommissionStatus.CANCELED,
        isReversed: true,
      },
    });
  }

  // Prim durumunu güncelle
  async updateStatus(id: string, updateStatusDto: UpdateCommissionStatusDto) {
    const commission = await this.prisma.staffCommission.findUnique({
      where: { id },
    });

    if (!commission) {
      throw new NotFoundException(`Prim kaydı bulunamadı: ${id}`);
    }

    return this.prisma.staffCommission.update({
      where: { id },
      data: { 
        // @ts-ignore - status field is defined in our schema
        status: updateStatusDto.status 
      },
      include: {
        // @ts-ignore - appliedRule relation is defined in our schema
        appliedRule: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        invoice: true,
      }
    });
  }

  // Prim listesi
  async findAll(filters?: {
    userId?: string;
    serviceId?: string;
    status?: CommissionStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { startDate, endDate, ...otherFilters } = filters || {};
    
    return this.prisma.staffCommission.findMany({
      where: {
        ...otherFilters,
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
      include: {
        // @ts-ignore - appliedRule relation is defined in our schema
        appliedRule: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Prim detayı
  async findOne(id: string) {
    const commission = await this.prisma.staffCommission.findUnique({
      where: { id },
      include: {
        // @ts-ignore - appliedRule relation is defined in our schema
        appliedRule: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        invoice: {
          include: {
            appointment: true
          }
        },
      },
    });

    if (!commission) {
      throw new NotFoundException(`Prim kaydı bulunamadı: ${id}`);
    }

    return commission;
  }
}
