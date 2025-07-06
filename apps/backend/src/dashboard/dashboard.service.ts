import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { AppointmentStatus, PaymentStatus } from '../prisma/prisma-types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(branchId: string) {
    if (!branchId) {
      return {
        todayAppointmentsCount: 0,
        totalCustomersCount: 0,
        dailyRevenue: 0,
        pendingPaymentsAmount: 0,
      };
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // 1. Today's appointments count
    const todayAppointmentsCount = await this.prisma.appointment.count({
      where: {
        branchId,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 2. Total customers for this branch
    const totalCustomersCount = await this.prisma.customer.count({
      where: {
        branchId,
      },
    });

    // 3. Daily revenue (from today's payments)
    const todayPayments = await this.prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        invoice: {
          branchId,
        },
      },
    });

    const dailyRevenue = todayPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    // 4. Pending payments amount
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        branchId,
        status: {
          in: [PaymentStatus.UNPAID, PaymentStatus.PARTIALLY_PAID],
        },
      },
    });

    const pendingPaymentsAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + invoice.debt,
      0,
    );

    return {
      todayAppointmentsCount,
      totalCustomersCount,
      dailyRevenue,
      pendingPaymentsAmount,
    };
  }

  async getRecentAppointments(branchId: string, limit: number = 5) {
    if (!branchId) {
      return [];
    }

    return this.prisma.appointment.findMany({
      where: {
        branchId,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getWeeklyPerformance(
    branchId: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    if (!branchId) {
      return {
        totalRevenue: 0,
        totalAppointments: 0,
        dailyData: [],
      };
    }

    // Default to last 7 days if dates not provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : subDays(endDate, 6);

    // Get appointments for the week
    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        startTime: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
    });

    // Get payments for the week
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
        invoice: {
          branchId,
        },
      },
      include: {
        invoice: true,
      },
    });

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Create daily data
    const dailyData = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Filter appointments for this day
      const dayAppointments = appointments.filter(
        (app) =>
          app.startTime >= startOfDay(currentDate) &&
          app.startTime < startOfDay(nextDay),
      );

      // Filter payments for this day
      const dayPayments = payments.filter(
        (payment) =>
          payment.paymentDate >= startOfDay(currentDate) &&
          payment.paymentDate < startOfDay(nextDay),
      );

      const dayRevenue = dayPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      dailyData.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        displayDate: format(currentDate, 'dd MMM'),
        revenue: dayRevenue,
        appointments: dayAppointments.length,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalRevenue,
      totalAppointments: appointments.length,
      dailyData,
    };
  }
}
