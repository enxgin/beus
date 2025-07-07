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

    // Şubenin var olduğunu kontrol et
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Şube bulunamadı: ID ${branchId}`);
    }

    // Kullanıcının var olduğunu kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ID ${userId}`);
    }

    // Invoices ve Payments ile ilişkileri kontrol etme işlevleri burada yer alabilir
    // Not: CashRegisterLog modelinde bu alanlar yoksa bu kontroller kaldırılabilir veya model güncellenebilir

    // Kasa kaydını oluştur
    return this.prisma.cashRegisterLog.create({
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
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(findCashRegisterLogsDto: FindCashRegisterLogsDto) {
    const {
      skip,
      take,
      branchId,
      userId,
      type,
      startDate,
      endDate,
      orderBy,
    } = findCashRegisterLogsDto;

    // Filtreleri oluştur
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

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
        orderByObject = JSON.parse(orderBy);
      } catch (error) {
        orderByObject = { createdAt: 'desc' }; // Varsayılan sıralama
      }
    } else {
      orderByObject = { createdAt: 'desc' }; // Varsayılan sıralama
    }

    // Toplam kasa kaydı sayısını bul
    const total = await this.prisma.cashRegisterLog.count({ where });

    // Kasa kayıtlarını getir
    const cashRegisterLogs = await this.prisma.cashRegisterLog.findMany({
      skip: skipNumber,
      take: takeNumber,
      where,
      orderBy: orderByObject,
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

      },
    });

    return {
      data: cashRegisterLogs,
      meta: {
        total,
        skip: skipNumber,
        take: takeNumber,
      },
    };
  }

  async findOne(id: string) {
    const cashRegisterLog = await this.prisma.cashRegisterLog.findUnique({
      where: { id },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

      },
    });

    if (!cashRegisterLog) {
      throw new NotFoundException(`Kasa kaydı bulunamadı: ID ${id}`);
    }

    return cashRegisterLog;
  }

  async update(id: string, updateCashRegisterLogDto: UpdateCashRegisterLogDto) {
    // Kasa kaydının var olduğunu kontrol et
    const cashRegisterLog = await this.prisma.cashRegisterLog.findUnique({
      where: { id },
    });

    if (!cashRegisterLog) {
      throw new NotFoundException(`Kasa kaydı bulunamadı: ID ${id}`);
    }

    // Örnek kural: Belirli bir tipteki kayıtları güncellemeye izin vermeme
    if (cashRegisterLog.type === CashLogType.OPENING || cashRegisterLog.type === CashLogType.CLOSING) {
      throw new BadRequestException(
        'Açılış veya kapanış kayıtları güncellenemez.',
      );
    }

    // Şube ID güncellenirse, var olduğunu kontrol et
    if (updateCashRegisterLogDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateCashRegisterLogDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException(`Şube bulunamadı: ID ${updateCashRegisterLogDto.branchId}`);
      }
    }

    // Kullanıcı ID güncellenirse, var olduğunu kontrol et
    if (updateCashRegisterLogDto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: updateCashRegisterLogDto.userId },
      });

      if (!user) {
        throw new NotFoundException(`Kullanıcı bulunamadı: ID ${updateCashRegisterLogDto.userId}`);
      }
    }

    // Kasa kaydını güncelle
    return this.prisma.cashRegisterLog.update({
      where: { id },
      data: updateCashRegisterLogDto,
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

      },
    });
  }

  async remove(id: string) {
    // Kasa kaydının var olduğunu kontrol et
    const cashRegisterLog = await this.prisma.cashRegisterLog.findUnique({
      where: { id },
    });

    if (!cashRegisterLog) {
      throw new NotFoundException(`Kasa kaydı bulunamadı: ID ${id}`);
    }

    // Örnek kural: Belirli bir tipteki kayıtları silmeye izin vermeme
    if (cashRegisterLog.type === CashLogType.OPENING || cashRegisterLog.type === CashLogType.CLOSING) {
      throw new BadRequestException(
        'Açılış veya kapanış kayıtları silinemez.',
      );
    }

    // Kasa kaydını sil
    return this.prisma.cashRegisterLog.delete({
      where: { id },
    });
  }

  async calculateCashBalance(branchId?: string, startDate?: Date, endDate?: Date): Promise<CashBalance> {
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

    // Tüm kasa kayıtlarını getir
    const cashRegisterLogs = await this.prisma.cashRegisterLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Gelir ve giderleri hesapla
    let totalIncome = 0;
    let totalExpense = 0;

    cashRegisterLogs.forEach(log => {
      if (log.type === CashLogType.INCOME || log.type === CashLogType.MANUAL_IN) {
        totalIncome += log.amount;
      } else if (log.type === CashLogType.OUTCOME || log.type === CashLogType.MANUAL_OUT) {
        totalExpense += log.amount;
      }
    });

    // Toplam bakiyeyi hesapla
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  async getDailySummary(branchId?: string, date?: Date): Promise<DailySummary> {
    // Tarih yoksa bugünü kullan
    const targetDate = date || new Date();
    
    // Günün başlangıcı (00:00:00)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Günün sonu (23:59:59)
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Günlük açılış ve kapanış kayıtlarını bul
    const openingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.OPENING,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const closingLog = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.CLOSING,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Günlük işlemleri getir
    const transactions = await this.findAll({
      branchId,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      orderBy: '{"createdAt":"asc"}',
    });

    const transactionLogs = transactions.data;

    // Günlük bakiye hesapla
    const cashBalance = await this.calculateCashBalance(branchId, startOfDay, endOfDay);
    
    // Kasanın gün sonu özeti
    return {
      date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD formatı
      openingBalance: openingLog ? openingLog.amount : 0,
      closingBalance: closingLog ? closingLog.amount : 0,
      dailyIncome: cashBalance.totalIncome,
      dailyExpense: cashBalance.totalExpense,
      transactions: transactionLogs,
    };
  }

  async openCashRegister(branchId: string, userId: string, initialAmount: number, description: string = 'Kasa açılışı') {
    // Şubenin var olduğunu kontrol et
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Şube bulunamadı: ID ${branchId}`);
    }

    // Kullanıcının var olduğunu kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ID ${userId}`);
    }

    // Bugün için kasanın zaten açılıp açılmadığını kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingOpeningRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.OPENING,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingOpeningRecord) {
      throw new BadRequestException(`Bu şube için kasa zaten açılmış. Kasa Kaydı ID: ${existingOpeningRecord.id}`);
    }

    // Kasa açılış kaydı oluştur
    return this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.OPENING,
        amount: initialAmount,
        description,
        branch: {
          connect: { id: branchId }
        },
        user: {
          connect: { id: userId }
        },
      },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async closeCashRegister(branchId: string, userId: string, finalAmount: number, description: string = 'Kasa kapanışı') {
    // Şubenin var olduğunu kontrol et
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Şube bulunamadı: ID ${branchId}`);
    }

    // Kullanıcının var olduğunu kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı: ID ${userId}`);
    }

    // Bugün için kasanın açılıp açılmadığını kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingOpeningRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.OPENING,
        createdAt: {
          gte: today,
        },
      },
    });

    if (!existingOpeningRecord) {
      throw new BadRequestException('Bu şube için bugün kasa açılmamış, önce kasa açılış kaydı oluşturun.');
    }

    // Bugün için kasa kapanış kaydının olup olmadığını kontrol et
    const existingClosingRecord = await this.prisma.cashRegisterLog.findFirst({
      where: {
        branchId,
        type: CashLogType.CLOSING,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingClosingRecord) {
      throw new BadRequestException(`Bu şube için kasa zaten kapatılmış. Kasa Kaydı ID: ${existingClosingRecord.id}`);
    }

    // Günlük bakiye hesapla
    const dailySummary = await this.getDailySummary(branchId, today);
    
    // Gerçek bakiye ile teorik bakiye arasındaki farkı hesapla
    const difference = finalAmount - dailySummary.closingBalance;
    let differenceDescription = '';
    
    if (difference !== 0) {
      differenceDescription = difference > 0 ? 
        `Kasa fazlası: ${difference}` : 
        `Kasa açığı: ${Math.abs(difference)}`;
    }

    // Kasa kapanış kaydı oluştur
    return this.prisma.cashRegisterLog.create({
      data: {
        type: CashLogType.CLOSING,
        amount: finalAmount,
        description: description + (differenceDescription ? ` (${differenceDescription})` : ''),
        branch: {
          connect: { id: branchId }
        },
        user: {
          connect: { id: userId }
        },
      },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}



