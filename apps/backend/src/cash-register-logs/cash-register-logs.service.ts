import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashRegisterLogDto } from './dto/create-cash-register-log.dto';
import { UpdateCashRegisterLogDto } from './dto/update-cash-register-log.dto';
import { FindCashRegisterLogsDto } from './dto/find-cash-register-logs.dto';
import { CashLogType } from '../prisma/prisma-types';

export interface CashBalance {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface DailySummary {
  date: string;
  openingBalance: number;
  closingBalance: number;
  dailyIncome: number;
  dailyExpense: number;
  transactions: any[];
}

@Injectable()
export class CashRegisterLogsService {
  constructor(private prisma: PrismaService) {}

  async create(createCashRegisterLogDto: CreateCashRegisterLogDto) {
    const { branchId, userId, type, amount, description } = createCashRegisterLogDto;

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException(`Şube bulunamadı: ID ${branchId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Kullanıcı bulunamadı: ID ${userId}`);

    return this.prisma.cashRegisterLog.create({
      data: {
        type,
        amount,
        description,
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
      },
      include: {
        Branch: true,
        User: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async findAll(query: FindCashRegisterLogsDto) {
    const { branchId, userId, startDate, endDate, type, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cashRegisterLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Branch: true,
          User: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.cashRegisterLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.cashRegisterLog.findUnique({
      where: { id },
      include: {
        Branch: true,
        User: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!log) {
      throw new NotFoundException(`Kasa kaydı bulunamadı: ID ${id}`);
    }
    return log;
  }

  async update(id: string, updateCashRegisterLogDto: UpdateCashRegisterLogDto) {
    const existingLog = await this.findOne(id);
    if (existingLog.type === CashLogType.OPENING || existingLog.type === CashLogType.CLOSING) {
      throw new BadRequestException('Açılış ve kapanış kayıtları güncellenemez.');
    }
    
    return this.prisma.cashRegisterLog.update({
      where: { id },
      data: updateCashRegisterLogDto,
    });
  }

  async remove(id: string) {
    const existingLog = await this.findOne(id);
    if (existingLog.type === CashLogType.OPENING || existingLog.type === CashLogType.CLOSING) {
      throw new BadRequestException('Açılış ve kapanış kayıtları silinemez.');
    }
    return this.prisma.cashRegisterLog.delete({ where: { id } });
  }

  async getCashBalance(branchId: string): Promise<CashBalance> {
    const incomeTypes: CashLogType[] = [CashLogType.INCOME, CashLogType.MANUAL_IN, CashLogType.OPENING];
    const expenseTypes: CashLogType[] = [CashLogType.OUTCOME, CashLogType.MANUAL_OUT];

    const aggregations = await this.prisma.cashRegisterLog.groupBy({
      by: ['type'],
      where: { branchId },
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const group of aggregations) {
      if (incomeTypes.includes(group.type)) {
        totalIncome += group._sum.amount || 0;
      } else if (expenseTypes.includes(group.type)) {
        totalExpense += group._sum.amount || 0;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  async getDailySummary(branchId: string, date: Date): Promise<DailySummary> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.cashRegisterLog.findMany({
      where: {
        branchId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        Branch: true,
        User: { select: { id: true, name: true } },
      },
    });

    const openingLog = transactions.find(t => t.type === CashLogType.OPENING);
    const closingLog = transactions.find(t => t.type === CashLogType.CLOSING);

    const incomeTypes: CashLogType[] = [CashLogType.INCOME, CashLogType.MANUAL_IN];
    const expenseTypes: CashLogType[] = [CashLogType.OUTCOME, CashLogType.MANUAL_OUT];

    const dailyIncome = transactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyExpense = transactions
      .filter(t => expenseTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const openingBalance = openingLog ? openingLog.amount : 0;
    const calculatedClosingBalance = openingBalance + dailyIncome - dailyExpense;

    return {
      date: startDate.toISOString().split('T')[0],
      openingBalance,
      closingBalance: closingLog ? closingLog.amount : calculatedClosingBalance,
      dailyIncome,
      dailyExpense,
      transactions,
    };
  }

  async openCashRegister(branchId: string, userId: string, openingBalance: number, description?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingOpeningRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.OPENING,
        createdAt: { gte: today },
      },
    });

    if (existingOpeningRecord) {
      throw new BadRequestException(`Bu şube için bugün zaten kasa açılışı yapılmış. Kasa Kaydı ID: ${existingOpeningRecord.id}`);
    }

    return this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.OPENING,
        amount: openingBalance,
        description: description || 'Günlük kasa açılışı',
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
      },
      include: {
        Branch: true,
        User: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async closeCashRegister(branchId: string, userId: string, finalAmount: number, description?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingOpeningRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.OPENING,
        createdAt: { gte: today },
      },
    });

    if (!existingOpeningRecord) {
      throw new BadRequestException('Bu şube için bugün kasa açılmamış, önce kasa açılış kaydı oluşturun.');
    }

    const existingClosingRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.CLOSING,
        createdAt: { gte: today },
      },
    });

    if (existingClosingRecord) {
      throw new BadRequestException(`Bu şube için kasa zaten kapatılmış. Kasa Kaydı ID: ${existingClosingRecord.id}`);
    }

    const dailySummary = await this.getDailySummary(branchId, today);
    
    const difference = finalAmount - dailySummary.closingBalance;
    let differenceDescription = '';
    
    if (difference !== 0) {
      differenceDescription = difference > 0 ? 
        `Kasa fazlası: ${difference}` : 
        `Kasa açığı: ${Math.abs(difference)}`;
    }

    return this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.CLOSING,
        amount: finalAmount,
        description: (description || '') + (differenceDescription ? ` (${differenceDescription})` : ''),
        Branch: { connect: { id: branchId } },
        User: { connect: { id: userId } },
      },
      include: {
        Branch: true,
        User: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
