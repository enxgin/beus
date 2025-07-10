import { Injectable, NotFoundException, BadRequestException, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';
import { CreateInvoiceFromServiceDto, InvoiceSourceType } from './dto/create-invoice-from-service.dto';
import { PaymentStatus, CashLogType } from '../prisma/prisma-types';
import { CashRegisterLogsService } from '../cash-register-logs/cash-register-logs.service';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private cashRegisterLogsService: CashRegisterLogsService,
    @Inject(forwardRef(() => CommissionsService))
    private commissionsService: CommissionsService
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
      include: { 
        payments: true,
        
        appointment: {
          include: {
            service: true,
            staff: true
          }
        }
      },
    });

    if (!existingInvoice) {
      throw new NotFoundException(`Fatura bulunamadı: ID ${id}`);
    }

    // Eğer amountPaid veya totalAmount değiştirilecekse, borç tutarını yeniden hesapla
    let updatedDebt = existingInvoice.debt;
    let updatedStatus = existingInvoice.status;
    let previousStatus = existingInvoice.status;
    
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

    // Status güncellemesi varsa kullan
    if (updateInvoiceDto.status !== undefined) {
      updatedStatus = updateInvoiceDto.status;
    }

    // Faturayı güncelle
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateInvoiceDto,
        debt: updatedDebt,
        status: updatedStatus,
      },
      include: {
        customer: true,
        branch: true,
        appointment: {
          include: {
            service: true,
            staff: true
          }
        },
        payments: true,
        
      },
    });

    // Ödeme durumu değiştiyse ve PAID durumuna geçtiyse prim hesapla
    if (updatedStatus === PaymentStatus.PAID && previousStatus !== PaymentStatus.PAID) {
      try {
        this.logger.log(`Fatura ödendi, prim hesaplanıyor: ${id}`);
        const commission = await this.commissionsService.calculateCommissionForInvoice(id);
        if (commission) {
          // Prim hesaplandı, bildirim için log ekle
          this.logger.log(`✅ Prim hesaplandı: ${commission.amount} TL - Fatura: ${id}`);
        }
      } catch (error) {
        this.logger.error(`Prim hesaplama hatası: ${error.message}`);
      }
    }
    
    // Fatura iptal edildi veya iade edildi ise, varsa primi iptal et
    if (updatedStatus === PaymentStatus.CANCELLED || updatedStatus === PaymentStatus.REFUNDED) {
      try {
        this.logger.log(`Fatura iptal edildi/iade edildi, prim iptal ediliyor: ${id}`);
      } catch (error) {
        this.logger.error(`Prim iptal hatası: ${error.message}`);
      }
    }

    return updatedInvoice;
  }

  async remove(id: string) {
    // Faturanın var olup olmadığını kontrol et
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { 
        payments: true
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
    const { amount, method, cashRegisterLogId, note } = createPaymentDto;

    // Faturanın var olup olmadığını kontrol et
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        payments: true,
        branch: true,
        customer: true,
        
        appointment: {
          include: {
            service: true,
            staff: true
          }
        }
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
      method: method,
      invoiceId,
    };

    if (method === 'CASH' && usedCashRegisterLogId) {
      paymentData.cashRegisterLogId = usedCashRegisterLogId;
    }
    
    const payment = await this.prisma.payment.create({
      data: paymentData,
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

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        debt: newDebt,
        status: newStatus,
      },
      include: {
        
      },
    });

    // Eğer fatura tamamen ödendi ise ve daha önce ödenmemiş ise, prim hesapla
    if (newStatus === PaymentStatus.PAID && invoice.status !== PaymentStatus.PAID) {
      try {
        this.logger.log(`Fatura ödendi, prim hesaplanıyor: ${invoiceId}`);
        const commission = await this.commissionsService.calculateCommissionForInvoice(invoiceId);
        if (commission) {
          // Prim hesaplandı, bildirim için log ekle
          this.logger.log(`✅ Prim hesaplandı: ${commission.amount} TL - Fatura: ${invoiceId}`);
        }
      } catch (error) {
        this.logger.error(`Prim hesaplama hatası: ${error.message}`);
      }
    }

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

  // StaffCommission creation temporarily disabled until commissionItem flow implemented
  async createStaffCommission(invoiceId: string, staffId: string, amount: number) {
    // Faturanın var olup olmadığını kontrol et
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
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

    // Komisyon tutarının geçerli olup olmadığını kontrol et
    if (amount <= 0) {
      throw new BadRequestException('Komisyon tutarı pozitif bir değer olmalıdır');
    }

    // Komisyonu oluştur
    // StaffCommission creation disabled until commission items flow ready
    return null; /*
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      */
  }

  /**
    * Bir paket satışından fatura oluşturur.
    * Bu işlem, daha önce oluşturulmuş müşteri paketini bulur ve faturayı ona bağlar.
   */
  async createInvoiceFromPackage(customerId: string, packageId: string, discountRate = 0) {
  this.logger.log(`Mevcut paket için fatura oluşturuluyor: Müşteri ID ${customerId}, Paket ID ${packageId}`);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Adım: Önceden oluşturulmuş müşteri paketini bul
  const customerPackage = await this.prisma.customerPackage.findFirst({
  where: {
  customerId,
  packageId,
  purchaseDate: { gte: todayStart },
  },
  orderBy: {
  purchaseDate: 'desc',
  },
  include: {
  package: true,
  customer: true,
  },
  });

  if (!customerPackage) {
  throw new NotFoundException(
  `Fatura oluşturulamadı: Müşteri (${customerId}) için bugün satılmış aktif bir paket (${packageId}) bulunamadı.`,
  );
  }

  const { package: packageItem, customer } = customerPackage;

  // 2. Adım: Fiyatı hesapla
  const originalPrice = packageItem.price;
  const discountAmount = originalPrice * (discountRate / 100);
  const finalPrice = originalPrice - discountAmount;

  // 3. Adım: Faturayı oluştur ve mevcut müşteri paketine bağla
  const invoice = await this.prisma.invoice.create({
  data: {
  totalAmount: finalPrice,
  amountPaid: 0,
  debt: finalPrice,
  status: PaymentStatus.UNPAID,
  customerId,
  branchId: packageItem.branchId ?? customer.branchId,
   // Mevcut pakete bağla
  },
  include: {
  customer: true,
  branch: true,
  },
  });

    // 4. Adım: Fatura ve bulunan müşteri paketini döndür
  return { invoice, customerPackage };
  }

  /**
   * Tamamlanan randevudan fatura oluşturur
   */
  async createInvoiceFromAppointment(appointmentId: string, discountRate: number = 0) {
    // Randevunun var olup olmadığını kontrol et
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        branch: true,
        invoice: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${appointmentId}`);
    }

    // Randevunun durumunu kontrol et
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException('Sadece tamamlanmış randevular için fatura oluşturulabilir');
    }

    // Randevunun zaten bir faturası var mı kontrol et
    if (appointment.invoice) {
      throw new BadRequestException(`Bu randevu için zaten bir fatura oluşturulmuş: ID ${appointment.invoice.id}`);
    }

    // İndirim oranını kontrol et
    if (discountRate < 0 || discountRate > 100) {
      throw new BadRequestException('İndirim oranı 0-100 arasında olmalıdır');
    }

    // Müşterinin indirim oranı yoksa ve parametre olarak gelen indirim oranı 0 ise, 
    // müşterinin indirim oranını kullan
    if (discountRate === 0 && appointment.customer.discountRate > 0) {
      discountRate = appointment.customer.discountRate;
    }

    // İndirimli fiyatı hesapla
    const originalPrice = appointment.service.price;
    const discountAmount = originalPrice * (discountRate / 100);
    const finalPrice = originalPrice - discountAmount;

    // Fatura oluştur
    const invoice = await this.prisma.invoice.create({
      data: {
        totalAmount: finalPrice,
        amountPaid: 0,
        debt: finalPrice,
        status: PaymentStatus.UNPAID,
        customerId: appointment.customerId,
        branchId: appointment.branchId,
        appointmentId: appointment.id,
      },
      include: {
        customer: true,
        branch: true,
        appointment: {
          include: {
            service: true,
            staff: true,
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Paket satışı veya tamamlanan randevudan fatura oluşturur
   */
  async createInvoiceFromService(createInvoiceDto: CreateInvoiceFromServiceDto) {
    const { invoiceType, customerId, packageId, appointmentId, discountRate = 0 } = createInvoiceDto;

    if (invoiceType === InvoiceSourceType.PACKAGE) {
      if (!packageId) {
        throw new BadRequestException('Paket satışı için paket ID gereklidir');
      }
      return this.createInvoiceFromPackage(customerId, packageId, discountRate);
    } else if (invoiceType === InvoiceSourceType.SERVICE) {
      if (!appointmentId) {
        throw new BadRequestException('Hizmet faturası için randevu ID gereklidir');
      }
      return this.createInvoiceFromAppointment(appointmentId, discountRate);
    } else {
      throw new BadRequestException('Geçersiz fatura kaynağı türü');
    }
  }
}
