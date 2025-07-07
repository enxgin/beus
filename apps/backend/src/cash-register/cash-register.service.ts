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
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingOpeningLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
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
        type: CashLogType.OPENING,
        amount: openingBalance,
        description: notes ? `Günlük kasa açılışı: ${notes}` : 'Günlük kasa açılışı',
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
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
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
        type: CashLogType.OPENING,
      },
    });

    if (!openingLog) {
      throw new BadRequestException('Bu şube için bugün kasa açılmamış.');
    }

    const existingClosingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
        type: CashLogType.CLOSING,
      },
    });

    if (existingClosingLog) {
      throw new BadRequestException('Bu şube için kasa zaten kapatılmış.');
    }

    const transactions = await this.prisma.cashRegisterLog.findMany({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
        type: { in: [CashLogType.INCOME, CashLogType.OUTCOME, CashLogType.MANUAL_IN, CashLogType.MANUAL_OUT] },
      },
    });

    const incomeTypes: CashLogType[] = [CashLogType.INCOME, CashLogType.MANUAL_IN];
    const outcomeTypes: CashLogType[] = [CashLogType.OUTCOME, CashLogType.MANUAL_OUT];

    const totalIncome = transactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutcome = transactions
      .filter(t => outcomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedBalance = openingLog.amount + totalIncome - totalOutcome;
    const difference = actualBalance - expectedBalance;

    const closingLog = await this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.CLOSING,
        amount: actualBalance,
        description: `Günlük kasa kapanışı. Beklenen: ${expectedBalance}, Fark: ${difference}`,
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
      },
    });

    this.logger.log(
      `Kasa kapanış kaydı oluşturuldu: ${closingLog.id}, Şube: ${branchId}, Kullanıcı: ${userId}`
    );

    return closingLog;
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string) {
    const { branchId, type, amount, description } = createTransactionDto;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
        type: CashLogType.OPENING,
      },
    });

    if (!openingLog) {
      throw new BadRequestException('İşlem yapabilmek için kasanın açık olması gerekir.');
    }

    const closingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        createdAt: { gte: today, lt: tomorrow },
        type: CashLogType.CLOSING,
      },
    });

    if (closingLog) {
      throw new BadRequestException('Kasa kapatıldığı için yeni işlem yapılamaz.');
    }

    const transaction = await this.prisma.cashRegisterLog.create({
      data: {
        type,
        amount,
        description,
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
      },
    });

    this.logger.log(
      `Yeni kasa işlemi oluşturuldu: ${transaction.id}, Tip: ${type}, Tutar: ${amount}`
    );

    return transaction;
  }

  async getCashDayDetails(day: Date, branchId: string) {
    const startDate = new Date(day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(day);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.cashRegisterLog.findMany({
      where: {
        branchId,
        createdAt: { gte: startDate, lt: endDate },
      },
      orderBy: { createdAt: 'asc' },
      include: { User: true, Branch: true },
    });

    const openingLog = transactions.find(t => t.type === CashLogType.OPENING) || null;
    const closingLog = transactions.find(t => t.type === CashLogType.CLOSING) || null;

    const incomeTypes: CashLogType[] = [CashLogType.INCOME, CashLogType.MANUAL_IN];
    const outcomeTypes: CashLogType[] = [CashLogType.OUTCOME, CashLogType.MANUAL_OUT];

    const incomeTransactions = transactions.filter(t => incomeTypes.includes(t.type));
    const outcomeTransactions = transactions.filter(t => outcomeTypes.includes(t.type));

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOutcome = outcomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const expectedBalance = openingLog ? openingLog.amount + totalIncome - totalOutcome : null;
    const actualBalance = closingLog ? closingLog.amount : null;
    const difference = actualBalance !== null && expectedBalance !== null ? actualBalance - expectedBalance : null;
    const status = closingLog ? 'CLOSED' : 'OPEN';

    return {
      date: day,
      status,
      openingBalance: openingLog ? openingLog.amount : null,
      expectedBalance,
      actualBalance,
      difference,
      branch: openingLog ? openingLog.Branch : null,
      openedBy: openingLog ? openingLog.User : null,
      closedBy: closingLog ? closingLog.User : null,
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
    };
  }

  async getCurrentCashDay(branchId: string) {
    const today = new Date();
    return this.getCashDayDetails(today, branchId);
  }

  async createInvoicePaymentTransaction(invoiceId: string, amount: number, branchId: string, userId: string) {
    const description = `Fatura ödemesi #${invoiceId}`;
    return this.createTransaction(
      {
        branchId,
        type: CashLogType.INCOME,
        amount,
        description,
        referenceId: invoiceId,
        referenceType: 'INVOICE',
      },
      userId
    );
  }

  async getCashReports(dto: GetCashReportsDto) {
    const { branchId, userId, startDate, endDate, page = 1, limit = 10 } = dto;
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
          difference: details.difference || null,
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
