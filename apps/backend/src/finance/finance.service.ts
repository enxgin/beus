import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getReceivables(user: { userId: string; role: string; branchId: string }) {
    const where: any = {
      status: {
        in: [PaymentStatus.UNPAID, PaymentStatus.PARTIALLY_PAID],
      },
    };

    // Rol bazlı filtreleme
    if (user.role !== UserRole.ADMIN) {
      // TODO: SUPER_BRANCH_MANAGER için alt şubeleri de dahil et
      where.customer = {
        branchId: user.branchId,
      };
    }

    const invoiceWithDetails = Prisma.validator<Prisma.InvoiceDefaultArgs>()({
      include: { customer: true, payments: true },
    });

    type InvoiceWithDetails = Prisma.InvoiceGetPayload<typeof invoiceWithDetails>;

    const invoices: InvoiceWithDetails[] = await this.prisma.invoice.findMany({
      where,
      include: { customer: true, payments: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Müşteriye göre gruplama
    const receivablesByCustomer = invoices.reduce((acc, invoice) => {
      const customerId = invoice.customer.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerId: customerId,
          customerName: invoice.customer.name,
          customerPhone: invoice.customer.phone,
          totalDebt: 0,
          totalPaid: 0,
          invoices: [],
        };
      }

      const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      acc[customerId].totalDebt += invoice.totalAmount;
      acc[customerId].totalPaid += paidAmount;
      acc[customerId].invoices.push({
        invoiceId: invoice.id,
        
        totalAmount: invoice.totalAmount,
        paidAmount: paidAmount,
        remainingAmount: invoice.totalAmount - paidAmount,
        status: invoice.status,
        createdAt: invoice.createdAt,
      });

      return acc;
    }, {} as Record<string, { customerId: string; customerName: string; customerPhone: string; totalDebt: number; totalPaid: number; invoices: any[] }>);

    // Obje'yi array'e çevir ve kalan borca göre sırala
    return Object.values(receivablesByCustomer).map((r: any) => ({
      ...r,
      remainingDebt: r.totalDebt - r.totalPaid,
    })).sort((a, b) => b.remainingDebt - a.remainingDebt);
  }
}
