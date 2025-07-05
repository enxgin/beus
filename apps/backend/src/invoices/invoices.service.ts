import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';
import { PaymentStatus, CashLogType } from '../prisma/prisma-types';
import { CashRegisterLogsService } from '../cash-register-logs/cash-register-logs.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private cashRegisterLogsService: CashRegisterLogsService
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { customerId, branchId, appointmentId, amountPaid = 0, totalAmount } = createInvoiceDto;

    // Müşterinin var olup olmadığını kontrol et
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ID ${customerId}`);
    }

    // Şubenin var olup olmadığını kontrol et
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Şube bulunamadı: ID ${branchId}`);
    }

    // Eğer randevu ID verilmişse, randevunun var olup olmadığını ve
    // daha önce bir faturaya bağlı olup olmadığını kontrol et
    if (appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { invoice: true },
      });

      if (!appointment) {
        throw new NotFoundException(`Randevu bulunamadı: ID ${appointmentId}`);
      }

      if (appointment.invoice) {
        throw new BadRequestException(`Bu randevu için zaten bir fatura oluşturulmuş: ID ${appointment.invoice.id}`);
      }

      // Randevudaki müşteri ile faturadaki müşteri aynı mı kontrol et
      if (appointment.customerId !== customerId) {
        throw new BadRequestException('Faturadaki müşteri, randevudaki müşteri ile eşleşmiyor');
      }
    }

    // Borç hesaplama
    const debt = totalAmount - amountPaid;
    
    // Ödeme durumunu belirle
    let status: PaymentStatus = PaymentStatus.UNPAID;
    if (amountPaid > 0 && amountPaid < totalAmount) {
      status = PaymentStatus.PARTIALLY_PAID;
    } else if (amountPaid >= totalAmount) {
      status = PaymentStatus.PAID;
    }

    return this.prisma.invoice.create({
      data: {
        totalAmount,
        amountPaid,
        debt,
        status,
        customerId,
        branchId,
        appointmentId,
      },
      include: {
        customer: true,
        branch: true,
        appointment: true,
        payments: true,
      },
    });
  }

  async findAll(findInvoicesDto: FindInvoicesDto) {
    const {
      skip,
      take,
      customerId,
      branchId,
      appointmentId,
      status,
      startDate,
      endDate,
      orderBy,
    } = findInvoicesDto;

    // Filtreleri oluştur
    const where: any = {};
    
    if (customerId) where.customerId = customerId;
    if (branchId) where.branchId = branchId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (status) where.status = status;

    // Tarih aralığı filtresi
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Skip ve take değerlerini sayı olarak dönüştür
    const skipNumber = skip ? parseInt(skip) : undefined;
    const takeNumber = take ? parseInt(take) : undefined;

    // Sıralama parametresi
    let orderByObject = undefined;
    if (orderBy) {
      try {
        if (typeof orderBy === 'string') {
          orderByObject = JSON.parse(orderBy);
        } else {
          orderByObject = orderBy;
        }
      } catch (error) {
        orderByObject = { createdAt: 'desc' }; // Varsayılan sıralama
      }
    } else {
      orderByObject = { createdAt: 'desc' }; // Varsayılan sıralama
    }

    return this.prisma.invoice.findMany({
      skip: skipNumber,
      take: takeNumber,
      where,
      orderBy: orderByObject,
      include: {
        customer: true,
        branch: true,
        appointment: {
          include: {
            service: true,
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payments: true,
        commission: true,
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        appointment: {
          include: {
            service: true,
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payments: true,
        commission: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${id}`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    // Faturanın var olup olmadığını kontrol et
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existingInvoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${id}`);
    }

    // Eğer amountPaid veya totalAmount değiştirilecekse, borç tutarını yeniden hesapla
    let updatedDebt = existingInvoice.debt;
    let updatedStatus = existingInvoice.status;
    
    if (updateInvoiceDto.totalAmount !== undefined || updateInvoiceDto.amountPaid !== undefined) {
      const totalAmount = updateInvoiceDto.totalAmount ?? existingInvoice.totalAmount;
      const amountPaid = updateInvoiceDto.amountPaid ?? existingInvoice.amountPaid;
      
      updatedDebt = totalAmount - amountPaid;
      
      // Ödeme durumunu güncelle
      if (amountPaid <= 0) {
        updatedStatus = PaymentStatus.UNPAID;
      } else if (amountPaid < totalAmount) {
        updatedStatus = PaymentStatus.PARTIALLY_PAID;
      } else {
        updatedStatus = PaymentStatus.PAID;
      }
    }

    // Faturayı güncelle
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateInvoiceDto,
        debt: updatedDebt,
        status: updateInvoiceDto.status ?? updatedStatus,
      },
      include: {
        customer: true,
        branch: true,
        appointment: true,
        payments: true,
        commission: true,
      },
    });
  }

  async remove(id: string) {
    // Faturanın var olup olmadığını kontrol et
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { 
        payments: true,
        commission: true 
      },
    });

    if (!existingInvoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${id}`);
    }

    // Fatura silme işleminden önce bağlı ödemeleri sil
    // Prisma cascade işlemini otomatik yapacaktır, ancak 
    // burada ödemeleri silme sebebi, kasa kayıtlarını güncellemek olabilir
    // Bu örnekte basitlik için atlıyoruz.

    return this.prisma.invoice.delete({
      where: { id },
      include: {
        customer: true,
        branch: true,
        appointment: true,
      },
    });
  }

  async createPayment(invoiceId: string, createPaymentDto: CreatePaymentDto) {
    const { amount, method, cashRegisterLogId } = createPaymentDto;

    // Faturanın var olup olmadığını kontrol et
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        payments: true,
        branch: true,
        customer: true 
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${invoiceId}`);
    }

    // Ödeme tutarının geçerli olup olmadığını kontrol et
    if (amount <= 0) {
      throw new BadRequestException('Ödeme tutarı pozitif bir değer olmalıdır');
    }

    // Ödeme tutarı kalan borçtan fazla olamaz
    const totalPaidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingDebt = invoice.totalAmount - totalPaidAmount;
    
    if (amount > remainingDebt) {
      throw new BadRequestException(`Ödeme tutarı kalan borçtan fazla olamaz. Kalan borç: ${remainingDebt}`);
    }

    let usedCashRegisterLogId = cashRegisterLogId;
    
    // Nakit ödeme için kasa kaydı oluştur
    if (method === 'CASH') {
      if (!cashRegisterLogId) {
        // Eğer cashRegisterLogId belirtilmemişse, otomatik olarak bir kasa kaydı oluştur
        const cashDescription = `Fatura #${invoice.id} için nakit tahsilat - ${invoice.customer?.name || 'Müşteri'}` 
        
        try {
          // Şube yöneticisini bul (kasa kaydı oluşturmak için)
          const branchManager = await this.prisma.user.findFirst({
            where: {
              branchId: invoice.branchId,
              role: {
                in: ['BRANCH_MANAGER', 'SUPER_BRANCH_MANAGER', 'ADMIN']
              }
            }
          });
          
          if (!branchManager) {
            throw new BadRequestException(`Şube için yetkili kullanıcı bulunamadı, kasa kaydı oluşturulamıyor`);
          }
          
          // Kasa gelir kaydı oluştur
          const cashRegisterLog = await this.cashRegisterLogsService.create({
            branchId: invoice.branchId,
            userId: branchManager.id,
            type: CashLogType.INCOME,
            amount: amount,
            description: cashDescription
          });
          
          usedCashRegisterLogId = cashRegisterLog.id;
        } catch (error) {
          throw new BadRequestException(`Kasa kaydı oluşturulamadı: ${error.message}`);
        }
      } else {
        // Kasa kaydının var olup olmadığını kontrol et
        const cashRegisterLog = await this.prisma.cashRegisterLog.findUnique({
          where: { id: cashRegisterLogId },
        });

        if (!cashRegisterLog) {
          throw new NotFoundException(`Kasa kaydı bulunamadı: ID ${cashRegisterLogId}`);
        }
      }
    }

    // Ödemeyi oluştur
    const paymentData: any = {
      amount,
      method,
      invoiceId,
    };

    if (method === 'CASH' && usedCashRegisterLogId) {
      paymentData.cashRegisterLogId = usedCashRegisterLogId;
    }
    
    const payment = await this.prisma.payment.create({
      data: paymentData,
      include: {
        invoice: true,
        cashRegisterLog: true,
      },
    });

    // Faturanın ödenen tutarını ve durumunu güncelle
    const newAmountPaid = totalPaidAmount + amount;
    const newDebt = invoice.totalAmount - newAmountPaid;
    let newStatus = invoice.status;
    
    if (newAmountPaid <= 0) {
      newStatus = PaymentStatus.UNPAID;
    } else if (newAmountPaid < invoice.totalAmount) {
      newStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      newStatus = PaymentStatus.PAID;
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        debt: newDebt,
        status: newStatus,
      },
    });

    return payment;
  }

  async refundPayment(invoiceId: string, paymentId: string, refundDto: { reason: string; userId: string }) {
    const { reason, userId } = refundDto;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ID ${userId}`);
    }
    
    // Faturanın var olup olmadığını kontrol et
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        payments: true,
        branch: true,
        customer: true 
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${invoiceId}`);
    }
    
    // Ödemenin var olup olmadığını kontrol et
    const payment = await this.prisma.payment.findFirst({
      where: { 
        id: paymentId,
        invoiceId: invoiceId
      },
      include: {
        cashRegisterLog: true
      }
    });
    
    if (!payment) {
      throw new NotFoundException(`Ödeme bulunamadı veya bu faturaya ait değil: ID ${paymentId}`);
    }
    
    // İade işlemi için kasa kaydı oluştur (nakit ödeme yapıldıysa)
    if (payment.method === 'CASH') {
      const refundDescription = `Fatura #${invoice.id} için iade - ${reason} - ${invoice.customer?.name || 'Müşteri'}`;
      
      try {
        // Kasa gider kaydı oluştur
        await this.cashRegisterLogsService.create({
          branchId: invoice.branchId,
          userId: userId,
          type: CashLogType.OUTCOME,
          amount: payment.amount,
          description: refundDescription
        });
      } catch (error) {
        throw new BadRequestException(`Kasa kaydı oluşturulamadı: ${error.message}`);
      }
    }
    
    // Ödemeyi iptal edildi olarak işaretle
    // NOT: Gerçek senaryoda ödemeyi silmek yerine 'isRefunded' gibi bir alan ekleyebilirsiniz
    // Bu örnekte basit tutmak için siliyoruz
    await this.prisma.payment.delete({
      where: { id: paymentId }
    });
    
    // Faturanın ödenen tutarını ve durumunu güncelle
    const updatedInvoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    
    const newAmountPaid = updatedInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newDebt = updatedInvoice.totalAmount - newAmountPaid;
    let newStatus = updatedInvoice.status;
    
    if (newAmountPaid <= 0) {
      newStatus = PaymentStatus.UNPAID;
    } else if (newAmountPaid < updatedInvoice.totalAmount) {
      newStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      newStatus = PaymentStatus.PAID;
    }
    
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        debt: newDebt,
        status: newStatus
      },
      include: {
        customer: true,
        branch: true,
        payments: true
      }
    });
  }

  async calculateInvoiceStats(branchId?: string, startDate?: Date, endDate?: Date) {
    // Filtreleri oluştur
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    // Tarih aralığı filtresi
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // İstatistikleri hesapla
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        payments: true,
      },
    });

    const stats = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      totalAmountPaid: 0,
      totalDebt: 0,
      paidInvoices: 0,
      partiallyPaidInvoices: 0,
      unpaidInvoices: 0,
      paymentMethods: {
        CASH: 0,
        CREDIT_CARD: 0,
        BANK_TRANSFER: 0,
        CUSTOMER_CREDIT: 0,
      },
    };

    invoices.forEach(invoice => {
      stats.totalAmount += invoice.totalAmount;
      stats.totalAmountPaid += invoice.amountPaid;
      stats.totalDebt += invoice.debt;

      if (invoice.status === PaymentStatus.PAID) {
        stats.paidInvoices++;
      } else if (invoice.status === PaymentStatus.PARTIALLY_PAID) {
        stats.partiallyPaidInvoices++;
      } else {
        stats.unpaidInvoices++;
      }

      // Ödeme yöntemlerine göre sayı
      invoice.payments.forEach(payment => {
        stats.paymentMethods[payment.method as keyof typeof stats.paymentMethods]++;
      });
    });

    return stats;
  }

  async createStaffCommission(invoiceId: string, staffId: string, amount: number) {
    // Faturanın var olup olmadığını kontrol et
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { commission: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${invoiceId}`);
    }

    // Personelin var olup olmadığını kontrol et
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException(`Personel bulunamadı: ID ${staffId}`);
    }

    // Bu fatura için daha önce bir prim kaydı var mı kontrol et
    if (invoice.commission) {
      throw new BadRequestException(`Bu fatura için zaten bir prim kaydı var: ID ${invoice.commission.id}`);
    }

    // Prim tutarı geçerli mi kontrol et
    if (amount <= 0) {
      throw new BadRequestException('Prim tutarı pozitif bir değer olmalıdır');
    }

    // Prim kaydını oluştur
    return this.prisma.staffCommission.create({
      data: {
        amount,
        staffId,
        invoiceId,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: true,
      },
    });
  }
}



