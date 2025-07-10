import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus, Prisma, StaffCommission } from '@prisma/client'; // Doğru import
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private prisma: PrismaService) {}

  // NOT: Bu fonksiyon, build hatalarını çözmek için basitleştirilmiştir.
  // Komisyon hesaplama mantığının (CommissionRule) şema ile uyumlu hale getirilmesi gerekir.
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
    const commissionAmount = invoice.totalAmount * 0.1; // Geçici olarak %10'luk basit bir hesaplama

    this.logger.log(`Geçici prim hesaplanıyor: Fatura #${invoiceId}, Tutar: ${commissionAmount}`);

    // Şema uyumsuzluğu nedeniyle commissionItem zorunlu; bu nedenle
    // şimdilik prim kaydı oluşturmayı pas geçiyoruz.
    return null;
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
