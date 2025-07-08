import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashDayDto } from './dto/open-cash-day.dto';
import { CloseCashDayDto } from './dto/close-cash-day.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetCashReportsDto } from './dto/get-cash-reports.dto';
import { User, UserRole } from '@prisma/client';
import { CashLogType } from '../prisma/prisma-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  private readonly logger = new Logger(CashRegisterService.name);

  constructor(private prisma: PrismaService) {}

  async openCashDay(openCashDayDto: OpenCashDayDto, user: User) {
    const { openingBalance, notes } = openCashDayDto;
    let { branchId } = openCashDayDto;

    if (user.role !== UserRole.ADMIN) {
      if (!user.branchId) {
        throw new ForbiddenException('Bu kullanıcının atanmış bir şubesi yok.');
      }
      branchId = user.branchId;
    }

    if (!branchId) {
      throw new BadRequestException('ADMIN rolü için bir şube IDsi belirtilmelidir.');
    }

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
        userId: user.id,
        type: CashLogType.OPENING,
        amount: openingBalance,
        description: notes ? `Kasa açılışı: ${notes}` : 'Kasa açılışı',
      },
    });

    return openingLog;
  }

  async closeCashDay(closeCashDayDto: CloseCashDayDto, user: User) {
    let { branchId } = closeCashDayDto;
    const { actualBalance, notes } = closeCashDayDto;

    if (user.role !== UserRole.ADMIN) {
      if (!user.branchId) {
        throw new ForbiddenException('Bu kullanıcının atanmış bir şubesi yok.');
      }
      branchId = user.branchId;
    }

    if (!branchId) {
      throw new BadRequestException('ADMIN rolü için bir şube IDsi belirtilmelidir.');
    }

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
      throw new BadRequestException('Bu şube için bugün açılmış bir kasa bulunamadı.');
    }

    const existingClosingLog = await this.prisma.cashRegisterLog.findFirst({
        where: {
            branchId,
            createdAt: { gte: startOfDay, lte: endOfDay },
            type: CashLogType.CLOSING,
        },
    });

    if (existingClosingLog) {
        throw new BadRequestException('Bu şube için bugün zaten kasa kapanışı yapılmış.');
    }

    const closingLog = await this.prisma.cashRegisterLog.create({
      data: {
        branchId,
        userId: user.id,
        type: CashLogType.CLOSING,
        amount: actualBalance,
        description: notes ? `Günlük kasa kapanışı: ${notes}` : 'Günlük kasa kapanışı',
      },
    });

    return closingLog;
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, user: User) {
    let { branchId } = createTransactionDto;
    const { type, amount, description } = createTransactionDto;

    if (user.role !== UserRole.ADMIN) {
      if (!user.branchId) {
        throw new ForbiddenException('Bu kullanıcının atanmış bir şubesi yok.');
      }
      branchId = user.branchId;
    }

    if (!branchId) {
      throw new BadRequestException('ADMIN rolü için bir şube IDsi belirtilmelidir.');
    }

    return this.prisma.cashRegisterLog.create({
      data: {
        branchId,
        userId: user.id,
        type,
        amount,
        description,
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

  async getCashDayDetails(date: Date, branchId: string, user: User) {
    let effectiveBranchId = branchId;

    if (user.role !== UserRole.ADMIN) {
      if (!user.branchId) {
        throw new ForbiddenException('Bu kullanıcının atanmış bir şubesi yok.');
      }
      effectiveBranchId = user.branchId;
    }

    if (!effectiveBranchId) {
      throw new BadRequestException('Şube IDsi belirtilmelidir.');
    }

    const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);

    try {
      const existingOpeningLog = await this.prisma.cashRegisterLog.findFirst({
        where: {
          branchId: effectiveBranchId,
          createdAt: { gte: startOfDay },
          type: CashLogType.OPENING,
        },
      });

      if (!existingOpeningLog) {
        return {
          status: 'NOT_OPENED',
          transactions: [],
          dailyIncome: 0,
          dailyOutcome: 0,
          currentBalance: 0,
          expectedBalance: 0,
          openingBalance: 0,
          closedAt: null,
          closedBy: null,
          actualBalance: null,
        };
      }

      const logs = await this.prisma.cashRegisterLog.findMany({
        where: {
          branchId: effectiveBranchId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const closingLog = logs.find((log) => log.type === CashLogType.CLOSING);

      let dailyIncome = 0;
      let dailyOutcome = 0;

      logs.forEach((log) => {
        if (log.type === CashLogType.OPENING || log.type === CashLogType.CLOSING) return;

        if ([CashLogType.SALE, CashLogType.MANUAL_IN, CashLogType.INVOICE_PAYMENT].includes(log.type)) {
          dailyIncome += log.amount;
        } else {
          dailyOutcome += log.amount;
        }
      });

      const openingBalance = existingOpeningLog.amount;
      const expectedBalance = openingBalance + dailyIncome - dailyOutcome;

      return {
        status: closingLog ? 'CLOSED' : 'OPEN',
        transactions: logs,
        dailyIncome,
        dailyOutcome,
        currentBalance: expectedBalance,
        expectedBalance,
        openingBalance,
        closedAt: closingLog?.createdAt || null,
        closedBy: closingLog?.User || null,
        actualBalance: closingLog?.amount || null,
      };
    } catch (error) {
      this.logger.error(`Kasa günü detayları alınırken hata: ${error.message}`, error.stack);
      throw new BadRequestException(`Kasa günü detayları alınırken bir hata oluştu: ${error.message}`);
    }
  }

  async getCurrentCashDay(branchId: string, user: User) {
    const today = new Date();
    return this.getCashDayDetails(today, branchId, user);
  }

  async createInvoicePaymentTransaction(invoiceId: string, amount: number, branchId: string, user: User) {
    const description = `Fatura ödemesi #${invoiceId}`;
    const transactionDto: CreateTransactionDto = {
      branchId,
      type: CashLogType.INVOICE_PAYMENT,
      amount,
      description,
    };
    return this.createTransaction(transactionDto, user);
  }

  async getCashReports(getCashReportsDto: GetCashReportsDto, user: User) {
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
        const details = await this.getCashDayDetails(date, log.branchId, user);
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