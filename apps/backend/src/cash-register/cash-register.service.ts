import { Injectable, Logger, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashDayDto } from './dto/open-cash-day.dto';
import { CloseCashDayDto } from './dto/close-cash-day.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetCashReportsDto } from './dto/get-cash-reports.dto';
import { CashDayStatus, CashLogType } from '../prisma/prisma-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  private readonly logger = new Logger(CashRegisterService.name);

  constructor(private prisma: PrismaService) {}

  // Günlük kasa açılışı yap
  async openCashDay(openCashDayDto: OpenCashDayDto, userId: string) {
    const { branchId, openingBalance, notes } = openCashDayDto;

    // Bugün için açık kasa var mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Bugün için açılış kaydı var mı kontrol et
    const existingOpeningLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: CashLogType.OPENING,
      },
    });

    if (existingOpeningLog) {
      throw new BadRequestException(
        `Bu şube için bugün zaten kasa açılışı yapılmış (ID: ${existingOpeningLog.id}).`
      );
    }
    
    // Kasa açılış kaydı oluştur
    const openingLog = await this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.OPENING,
        amount: openingBalance,
        description: notes ? `Günlük kasa açılışı: ${notes}` : 'Günlük kasa açılışı',
        branch: {
          connect: { id: branchId }
        },
        user: {
          connect: { id: userId }
        },
      },
    });
    
    this.logger.log(
      `Kasa açılış kaydı oluşturuldu. ID: ${openingLog.id}, Şube: ${branchId}, Açılış: ${openingBalance}, Kullanıcı: ${userId}`
    );
    
    return openingLog;
  }

  // Günlük kasa kapanışı yap
  async closeCashDay(closeCashDayDto: CloseCashDayDto, userId: string) {
    const { branchId, actualBalance, notes } = closeCashDayDto;

    // Bugün için açık kasa var mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Günün başlangıcı

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Yarının başlangıcı

    // Açılış logu bul
    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: CashLogType.OPENING,
      },
    });

    if (!openingLog) {
      throw new NotFoundException(
        `Bu şube için bugün açık bir kasa bulunamadı.`
      );
    }
    
    // Kapanış logu var mı kontrol et
    const existingClosingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: CashLogType.CLOSING,
      },
    });
    
    if (existingClosingLog) {
      throw new BadRequestException(
        `Bu şube için bugün zaten kasa kapanışı yapılmış (ID: ${existingClosingLog.id}).`
      );
    }

    // Gün içindeki tüm hareketleri hesapla
    const openingBalance = openingLog.amount;

    // Tüm gelir ve giderleri hesapla
    const transactions = await this.prisma.cashRegisterLog.findMany({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: {
          notIn: [CashLogType.OPENING, CashLogType.CLOSING],
        },
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (
        transaction.type === CashLogType.MANUAL_IN ||
        transaction.type === 'INCOME'
      ) {
        totalIncome += transaction.amount;
      } else if (transaction.type === CashLogType.MANUAL_OUT) {
        totalExpense += transaction.amount;
      }
    });

    // Beklenen bakiyeyi hesapla
    const expectedBalance = openingBalance + totalIncome - totalExpense;
    const difference = actualBalance - expectedBalance;

    // Kasa kapanış kaydı oluştur
    const closingLog = await this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.CLOSING,
        amount: actualBalance,
        description: `Günlük kasa kapanışı. Beklenen: ${expectedBalance}, Fark: ${difference}`,
        branch: {
          connect: { id: branchId }
        },
        user: {
          connect: { id: userId }
        },
      },
    });

    this.logger.log(
      `Kasa kapanış kaydı oluşturuldu. ID: ${closingLog.id}, Şube: ${branchId}, Kapanış: ${actualBalance}, Beklenen: ${expectedBalance}, Fark: ${difference}, Kullanıcı: ${userId}`
    );

    // Kasa kapanış raporunu döndür
    return {
      openingLog,
      closingLog,
      summary: {
        openingBalance,
        totalIncome,
        totalExpense,
        expectedBalance,
        actualBalance,
        difference,
      },
    };
  }

  // Manuel gelir/gider ekle
  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string) {
    const { branchId, type, amount, description } = createTransactionDto;

    // Bugün için kasa açılışı yapılmış mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: CashLogType.OPENING,
      },
    });

    if (!openingLog) {
      throw new BadRequestException(
        `Bu şube için bugün kasa açılışı yapılmamış. Önce kasa açılışı yapmalısınız.`
      );
    }

    // Yeni işlem kaydı oluştur
    const transaction = await this.prisma.cashRegisterLog.create({
      data: {
        type,
        amount,
        description,
        branch: {
          connect: { id: branchId }
        },
        user: {
          connect: { id: userId }
        },
      },
    });

    this.logger.log(
      `Kasa işlemi oluşturuldu. ID: ${transaction.id}, Tip: ${type}, Tutar: ${amount}, Açıklama: ${description}`
    );

    return transaction;
  }

  // Günlük kasa detaylarını getir
  async getCashDayDetails(date: Date, branchId: string) {
    // Tarih aralığını ayarla
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    // Gün içindeki tüm hareketleri getir
    const transactions = await this.prisma.cashRegisterLog.findMany({
      where: {
        branchId,
        createdAt: {
          gte: day,
          lt: nextDay,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (transactions.length === 0) {
      throw new NotFoundException(`Belirtilen tarih ve şube için kasa kaydı bulunamadı.`);
    }

    // Açılış ve kapanış loglarını bul
    const openingLog = transactions.find(t => t.type === CashLogType.OPENING);
    const closingLog = transactions.find(t => t.type === CashLogType.CLOSING);

    // Gelir ve gider hareketlerini ayır
    const incomeTransactions = transactions.filter(t => t.type === 'INCOME' || t.type === CashLogType.MANUAL_IN);
    const outcomeTransactions = transactions.filter(t => t.type === CashLogType.MANUAL_OUT);

    // Hesaplanan değerler
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOutcome = outcomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const expectedBalance = openingLog ? openingLog.amount + totalIncome - totalOutcome : null;
    const actualBalance = closingLog ? closingLog.amount : null;
    const difference = actualBalance !== null ? actualBalance - expectedBalance : null;
    const status = closingLog ? 'CLOSED' : 'OPEN';

    return {
      date: day,
      status,
      openingBalance: openingLog ? openingLog.amount : null,
      expectedBalance,
      actualBalance,
      difference,
      branch: openingLog ? openingLog.branch : null,
      openedBy: openingLog ? openingLog.user : null,
      closedBy: closingLog ? closingLog.user : null,
      openedAt: openingLog ? openingLog.createdAt : null,
      closedAt: closingLog ? closingLog.createdAt : null,
      notes: null,
      transactions: {
        all: transactions,
        opening: openingLog,
        closing: closingLog,
        income: incomeTransactions,
        outcome: outcomeTransactions,
      },
      summary: {
        totalIncome,
        totalOutcome,
        transactionCount: transactions.length - (openingLog ? 1 : 0) - (closingLog ? 1 : 0),
      },
    };
  }

  // Güncel kasa gününü getir
  async getCurrentCashDay(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Bugün için açılış kaydı var mı kontrol et
    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        type: CashLogType.OPENING,
      },
    });
    
    if (!openingLog) {
      return null;
    }
    
    return this.getCashDayDetails(today, branchId);
  }

  // Fatura ödemesi için otomatik kasa geliri oluştur
  async createInvoicePaymentTransaction(
    invoiceId: string,
    amount: number,
    branchId: string,
    userId: string,
  ) {
    try {
      // Bugün için kasa açılışı yapılmış mı kontrol et
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const openingLog = await this.prisma.cashRegisterLog.findFirst({
        where: {
          branchId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          type: CashLogType.OPENING,
        },
      });

      if (!openingLog) {
        throw new BadRequestException(
          `Bu şube için açık bir kasa bulunamadı. Önce kasa açılışı yapmalısınız.`
        );
      }

      // Fatura bilgilerini çek
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          appointment: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Fatura bulunamadı: ${invoiceId}`);
      }

      // Açıklama metni oluştur
      const customerName = invoice.appointment?.customer?.name || 'Bilinmeyen Müşteri';
      const description = `Fatura Ödemesi - Fatura No: ${invoice.id.substring(0, 8)} - Müşteri: ${customerName}`;

      // Kasa geliri oluştur
      const cashRegisterLog = await this.prisma.cashRegisterLog.create({
        data: {
          type: 'INCOME' as CashLogType, // Geçici olarak INCOME kullanıyoruz, INVOICE_PAYMENT yerine
          amount,
          description,
          branch: {
            connect: { id: branchId }
          },
          user: {
            connect: { id: userId }
          },
          // referenceId ve referenceType alanlarını Prisma migrasyonu sonrası ekleyeceğiz
        },
      });

      this.logger.log(
        `Fatura ödemesi için kasa geliri oluşturuldu. Fatura ID: ${invoiceId}, Tutar: ${amount}, İşlem ID: ${cashRegisterLog.id}`
      );

      return cashRegisterLog;
    } catch (error) {
      this.logger.error(
        `Fatura ödemesi için kasa geliri oluşturulamadı. Fatura ID: ${invoiceId}, Hata: ${error.message}`
      );
      throw error;
    }
  }

  // Kasa raporlarını getir
  async getCashReports(dto: GetCashReportsDto) {
    const { page = 1, limit = 10, startDate, endDate, branchId } = dto;
    const skip = (page - 1) * limit;

    // Filtreleme koşullarını oluştur
    const where: any = {};
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateObj;
      }
    }

    // Açılış kayıtlarına göre grupla
    where.type = CashLogType.OPENING;

    // Toplam sayıyı al
    const total = await this.prisma.cashRegisterLog.count({ where });
    
    // Kasa günlerini getir (açılış kayıtlarını baz alarak)
    const openingLogs = await this.prisma.cashRegisterLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        branch: true,
        user: true,
      },
    });

    // Her açılış kaydı için o günün detaylarını getir
    const cashDays = await Promise.all(
      openingLogs.map(async (log) => {
        const date = new Date(log.createdAt);
        date.setHours(0, 0, 0, 0);
        const details = await this.getCashDayDetails(date, log.branchId);
        return {
          id: log.id,
          date: log.createdAt,
          status: details.status,
          openingBalance: log.amount,
          expectedBalance: details.expectedBalance || log.amount,
          actualBalance: details.actualBalance || null,
          difference: details.difference || null,
          openedBy: log.userId,
          closedBy: details.closedBy?.id || null,
          branchId: log.branchId,
          openedAt: log.createdAt,
          closedAt: details.closedAt || null,
          branch: log.branch || { id: log.branchId, name: 'Bilinmeyen Şube' },
          openedByUser: log.user || { id: log.userId, name: 'Bilinmeyen Kullanıcı' },
          closedByUser: details.closedBy || null,
        };
      })
    );

    return {
      data: cashDays,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
