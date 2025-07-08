import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashDayDto } from './dto/open-cash-day.dto';
import { CloseCashDayDto } from './dto/close-cash-day.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetCashReportsDto } from './dto/get-cash-reports.dto';
import { CashLogType } from '../prisma/prisma-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  private readonly logger = new Logger(CashRegisterService.name);

  constructor(private prisma: PrismaService) {}

  async openCashDay(openCashDayDto: OpenCashDayDto, userId: string) {
    const { branchId, openingBalance, notes } = openCashDayDto;

    const today = new Date();
    const { startOfDay } = this.getStartAndEndOfDay(today);

    const existingOpeningLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: startOfDay },
        type: CashLogType.OPENING,
      },
    });

    if (existingOpeningLog) {
      throw new BadRequestException(
        `Bu şube için bugün zaten kasa açılışı yapılmış (ID: ${existingOpeningLog.id}).`
      );
    }
    
    const openingLog = await this.prisma.cashRegisterLog.create({
      data: {
        branchId,
        userId,
        type: CashLogType.OPENING,
        amount: openingBalance,
        description: notes ? `Günlük kasa açılışı: ${notes}` : 'Günlük kasa açılışı',
      },
    });
    
    this.logger.log(
      `Kasa açılış kaydı oluşturuldu: ${openingLog.id}, Şube: ${branchId}, Kullanıcı: ${userId}`
    );

    return openingLog;
  }

  async closeCashDay(closeCashDayDto: CloseCashDayDto, userId: string) {
    const { branchId, actualBalance, notes } = closeCashDayDto;

    const today = new Date();
    const { startOfDay, endOfDay } = this.getStartAndEndOfDay(today);

    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        type: CashLogType.OPENING,
      },
    });

    if (!openingLog) {
      throw new NotFoundException('Bugün için kasa açılışı bulunamadı.');
    }

    const existingClosingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        type: CashLogType.CLOSING,
      },
    });

    if (existingClosingLog) {
      throw new BadRequestException('Bu kasa zaten kapatılmış.');
    }

    const closingLog = await this.prisma.cashRegisterLog.create({
      data: {
        branchId,
        userId,
        type: CashLogType.CLOSING,
        amount: actualBalance,
        description: notes ? `Günlük kasa kapanışı: ${notes}` : 'Günlük kasa kapanışı',
      },
    });

    return closingLog;
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string) {
    const { branchId, type, amount, description } = createTransactionDto; // referenceId, referenceType kaldırıldı

    return this.prisma.cashRegisterLog.create({
      data: {
        branchId,
        userId, // Bu userId DTO'dan değil, guard'dan gelen auth user'dan alınır.
        type,
        amount,
        description,
        // referenceId, // DB senkronizasyon sorunu için geçici olarak kapatıldı
        // referenceType, // DB senkronizasyon sorunu için geçici olarak kapatıldı
      },
    });
  }

  private getStartAndEndOfDay(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  async getCashDayDetails(date: Date, branchId: string) {
    try {
      this.logger.debug(`getCashDayDetails çağrıldı: tarih=${date}, branchId=${branchId}`);
      const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);

      // Şube kontrolü geçici olarak kaldırıldı. Render.com üzerinde test için.

      this.logger.debug(`Transactions sorgusu yapılıyor: startOfDay=${startOfDay}, endOfDay=${endOfDay}`);
      const transactions = await this.prisma.cashRegisterLog.findMany({
        where: {
          branchId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          User: { select: { name: true, id: true } },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      
      this.logger.debug(`${transactions.length} adet işlem bulundu.`);

      const openingLog = transactions.find((t) => t.type === CashLogType.OPENING);
      const closingLog = transactions.find((t) => t.type === CashLogType.CLOSING);

      if (!openingLog) {
        this.logger.debug('Kasa açılış kaydı bulunamadı.');
        return {
          status: 'NOT_OPENED',
          currentBalance: 0,
          dailyIncome: 0,
          dailyOutcome: 0,
          netChange: 0,
          transactions: [],
        };
      }

      const incomeTypes = [CashLogType.INCOME, CashLogType.MANUAL_IN, CashLogType.INVOICE_PAYMENT] as const;
      const outcomeTypes = [CashLogType.OUTCOME, CashLogType.MANUAL_OUT] as const;

      this.logger.debug('Gelir ve gider hesaplanıyor...');
      const dailyIncome = transactions
        .filter(t => incomeTypes.includes(t.type as typeof incomeTypes[number]))
        .reduce((sum, t) => sum + t.amount, 0);

      const dailyOutcome = transactions
        .filter(t => outcomeTypes.includes(t.type as typeof outcomeTypes[number]))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const openingBalance = openingLog.amount;
      const currentBalance = openingBalance + dailyIncome - dailyOutcome;

      this.logger.debug(`Kasa durumu: Açılış bakiyesi=${openingBalance}, Gelir=${dailyIncome}, Gider=${dailyOutcome}, Güncel bakiye=${currentBalance}`);
      
      return {
        status: closingLog ? 'CLOSED' : 'OPEN',
        currentBalance,
        dailyIncome,
        dailyOutcome,
        netChange: dailyIncome - dailyOutcome,
        transactions,
        // Raporlama için ek alanlar
        openingBalance: openingLog.amount,
        actualBalance: closingLog ? closingLog.amount : null,
        closedAt: closingLog ? closingLog.createdAt : null,
        closedBy: closingLog ? (closingLog as any).User : null,
        expectedBalance: currentBalance
      };
    } catch (error) {
      this.logger.error(`getCashDayDetails hatası: ${error.message}`, error.stack);
      throw new BadRequestException(`Kasa günü detayları alınırken bir hata oluştu: ${error.message}`);
    }
  }

  async getCurrentCashDay(branchId: string) {
    const today = new Date();
    return this.getCashDayDetails(today, branchId);
  }

  async createInvoicePaymentTransaction(invoiceId: string, amount: number, branchId: string, userId: string) {
    const description = `Fatura ödemesi #${invoiceId}`;
    const transactionDto: CreateTransactionDto = {
      branchId,
      type: CashLogType.INVOICE_PAYMENT,
      amount,
      description,
      // referenceId: invoiceId, // DB senkronizasyon sorunu için geçici olarak kapatıldı
      // referenceType: 'INVOICE', // DB senkronizasyon sorunu için geçici olarak kapatıldı
    };
    return this.createTransaction(transactionDto, userId);
  }

  async getCashReports(getCashReportsDto: GetCashReportsDto) {
    const { page = 1, limit = 10, branchId, userId, startDate, endDate } = getCashReportsDto;
    const skip = (page - 1) * limit;

    const where: Prisma.CashRegisterLogWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }
    if (userId) {
      where.userId = userId;
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

    where.type = CashLogType.OPENING;

    const total = await this.prisma.cashRegisterLog.count({ where });
    
    const openingLogs = await this.prisma.cashRegisterLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        Branch: true,
        User: true,
      },
    });

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
          difference: details.actualBalance !== null ? details.actualBalance - (details.expectedBalance || 0) : null,
          openedBy: log.userId,
          closedBy: details.closedBy?.id || null,
          branchId: log.branchId,
          openedAt: log.createdAt,
          closedAt: details.closedAt || null,
          branch: log.Branch || { id: log.branchId, name: 'Bilinmeyen Şube' },
          openedByUser: log.User || { id: log.userId, name: 'Bilinmeyen Kullanıcı' },
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
