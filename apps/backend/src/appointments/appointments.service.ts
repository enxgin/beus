import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  addMinutes,
  endOfDay,
  setHours,
  setMinutes,
  startOfDay,
  parse,
} from 'date-fns';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { Appointment, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const { startTime, endTime, staffId, customerPackageId, packageServiceId, serviceId } = createAppointmentDto;

    // Personel müsaitlik kontrolü
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        staffId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
        },
        OR: [
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gt: new Date(startTime) },
          },
        ],
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Personel bu saat aralığında meşgul.');
    }

    // Eğer paket kullanımı varsa
    if (customerPackageId && packageServiceId) {
      try {
        // Müşteri paketini kontrol et
        const customerPackage = await this.prisma.customerPackage.findUnique({
          where: { id: customerPackageId },
          include: {
            package: {
              include: {
                services: true
              }
            }
          }
        });

        if (!customerPackage) {
          throw new BadRequestException('Müşteri paketi bulunamadı.');
        }

        // Paketin süresi dolmuş mu kontrol et
        if (new Date(customerPackage.expiryDate) < new Date()) {
          throw new BadRequestException('Paket süresi dolmuş.');
        }

        // Paket hizmetini bul
        const packageService = customerPackage.package.services.find(ps => ps.packageId === customerPackage.packageId && ps.serviceId === packageServiceId);
        if (!packageService) {
          throw new BadRequestException('Belirtilen hizmet bu pakette bulunamadı.');
        }

        // Kalan seans sayısını kontrol et
        const remainingSessions = customerPackage.remainingSessions[packageService.serviceId] || 0;
        if (remainingSessions <= 0) {
          throw new BadRequestException('Bu hizmet için kalan seans kalmamış.');
        }

        // remainingSessions alanını güncelle
        const currentRemainingSessions = customerPackage.remainingSessions as Record<string, number>;
        const updatedRemainingSessions = {
          ...currentRemainingSessions,
          [packageServiceId]: remainingSessions - 1
        };

        // Prisma transaction ile hem randevuyu oluştur hem de paketteki kalan seans sayısını güncelle
        return this.prisma.$transaction(async (tx) => {
          // Müşteri paketini güncelle
          await tx.customerPackage.update({
            where: { id: customerPackageId },
            data: {
              remainingSessions: updatedRemainingSessions as any
            }
          });
          
          // Randevuyu oluştur
          return tx.appointment.create({
            data: createAppointmentDto,
          });
        });
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        console.error('Paket kullanımı sırasında hata:', error);
        throw new BadRequestException('Paket kullanımı sırasında bir hata oluştu.');
      }
    }

    // Normal randevu oluşturma (paket kullanımı yoksa)
    return this.prisma.appointment.create({
      data: createAppointmentDto,
    });
  }

  async findAll(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
    search?: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      status: {
        notIn: [AppointmentStatus.CANCELLED],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.startTime = { lt: endOfDay(endDate) };
      where.endTime = { gt: startOfDay(startDate) };
    } else if (startDate) {
      where.startTime = { gte: startOfDay(startDate) };
    } else if (endDate) {
      where.endTime = { lte: endOfDay(endDate) };
    }

    if (search) {
      where.OR = [
        {
          customer: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          customer: {
            phone: {
              contains: search,
            },
          },
        },
      ];
    }

    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          staff: true,
          service: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, totalCount };
  }


  async getAvailableSlots(
    staffId: string,
    serviceId: string,
    date: string,
    branchId: string,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı.');
    }
    const duration = service.duration;

    const targetDate = parse(date, 'yyyy-MM-dd', new Date());
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Personel bulunamadı.');
    }

    const workHours = await this.prisma.workHour.findMany({
      where: {
        staffId: staffId,
        branchId: branchId,
      },
    });

    if (!workHours.length) {
      return [];
    }

    const dayOfWeek = targetDate.getDay();
    const workHour = workHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (!workHour) {
      return [];
    }

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        staffId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    });

    const availableSlots = [];
    const [startHour, startMinute] = workHour.startTime.split(':').map(Number);
    const [endHour, endMinute] = workHour.endTime.split(':').map(Number);

    let currentTime = setMinutes(
      setHours(dayStart, startHour),
      startMinute,
    );
    const endTime = setMinutes(setHours(dayStart, endHour), endMinute);

    while (addMinutes(currentTime, duration) <= endTime) {
      const slotEnd = addMinutes(currentTime, duration);

      const isOverlapping = existingAppointments.some(
        (appointment) =>
          (currentTime < appointment.endTime && slotEnd > appointment.startTime) ||
          (currentTime >= appointment.startTime && currentTime < appointment.endTime),
      );

      if (!isOverlapping) {
        availableSlots.push(currentTime);
      }

      currentTime = addMinutes(currentTime, 15); // Slotları 15 dakikalık aralıklarla kontrol et
    }

    return availableSlots;
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        staff: true,
        service: true,
        customerPackage: {
          include: {
            package: {
              include: {
                services: {
                  include: { service: true },
                },
              },
            },
          },
        },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const { startTime, staffId, serviceId, status: newStatus } = updateAppointmentDto;

    // Mevcut randevuyu al
    const currentAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!currentAppointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı.');
    }

    const endTime = addMinutes(new Date(startTime), service.duration);

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        id: { not: id },
        staffId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: new Date(startTime) },
          },
        ],
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Personel bu saat aralığında meşgul.');
    }

    // Durum değişikliği kontrolü - COMPLETED'a geçiş
    const isCompleting =
      newStatus === AppointmentStatus.COMPLETED &&
      currentAppointment.status !== AppointmentStatus.COMPLETED;
    const hasPackageInfo =
      currentAppointment.customerPackageId && currentAppointment.serviceId;

    if (isCompleting && hasPackageInfo) {
      return this.prisma.$transaction(async (tx) => {
        const customerPackage = await tx.customerPackage.findUnique({
          where: { id: currentAppointment.customerPackageId },
        });

        if (!customerPackage) {
          throw new NotFoundException('İlişkili müşteri paketi bulunamadı.');
        }

        const appointmentServiceId = currentAppointment.serviceId;
        const remainingSessions = customerPackage.remainingSessions as Record<
          string,
          number
        > | null;

        if (
          !remainingSessions ||
          typeof remainingSessions[appointmentServiceId] !== 'number'
        ) {
          throw new BadRequestException(
            'Paket, bu hizmet için geçerli bir seans bilgisi içermiyor.',
          );
        }

        const currentSessions = remainingSessions[appointmentServiceId];

        if (currentSessions <= 0) {
          throw new BadRequestException(
            'Bu hizmet için yeterli seans kalmamıştır.',
          );
        }

        const newRemainingSessions = {
          ...remainingSessions,
          [appointmentServiceId]: currentSessions - 1,
        };

        await tx.customerPackage.update({
          where: { id: customerPackage.id },
          data: { remainingSessions: newRemainingSessions },
        });

        const existingHistory = await tx.packageUsageHistory.findUnique({
          where: { appointmentId: currentAppointment.id },
        });

        if (!existingHistory) {
          await tx.packageUsageHistory.create({
            data: {
              appointmentId: currentAppointment.id,
              customerPackageId: customerPackage.id,
            },
          });
        }

        const updatedAppointment = await tx.appointment.update({
          where: { id },
          data: {
            ...updateAppointmentDto,
            endTime: endTime,
          },
        });

        return updatedAppointment;
      });
    } else {
      return this.prisma.appointment.update({
        where: { id },
        data: {
          ...updateAppointmentDto,
          endTime: endTime,
        },
      });
    }
  }

  async remove(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }
    return this.prisma.appointment.delete({ where: { id } });
  }

  async rescheduleAppointment(
    id: string,
    rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    const { startTime, staffId } = rescheduleAppointmentDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    const endTime = addMinutes(new Date(startTime), appointment.service.duration);

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        id: { not: id },
        staffId: staffId || appointment.staffId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: new Date(startTime) },
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'Seçilen personel bu saatte başka bir randevuya sahip.',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        startTime,
        endTime,
        staffId: staffId || appointment.staffId,
      },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto) {
    const { status: newStatus } = updateStatusDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    const isCompleting =
      newStatus === AppointmentStatus.COMPLETED &&
      appointment.status !== AppointmentStatus.COMPLETED;
    const hasPackageInfo =
      appointment.customerPackageId && appointment.serviceId;

    if (isCompleting && hasPackageInfo) {
      return this.prisma.$transaction(async (tx) => {
        const customerPackage = await tx.customerPackage.findUnique({
          where: { id: appointment.customerPackageId },
        });

        if (!customerPackage) {
          throw new NotFoundException('İlişkili müşteri paketi bulunamadı.');
        }

        const serviceId = appointment.serviceId;
        const remainingSessions = customerPackage.remainingSessions as Record<
          string,
          number
        > | null;

        if (
          !remainingSessions ||
          typeof remainingSessions[serviceId] !== 'number'
        ) {
          throw new BadRequestException(
            'Paket, bu hizmet için geçerli bir seans bilgisi içermiyor.',
          );
        }

        const currentSessions = remainingSessions[serviceId];

        if (currentSessions <= 0) {
          throw new BadRequestException(
            'Bu hizmet için yeterli seans kalmamıştır.',
          );
        }

        const newRemainingSessions = {
          ...remainingSessions,
          [serviceId]: currentSessions - 1,
        };

        await tx.customerPackage.update({
          where: { id: customerPackage.id },
          data: { remainingSessions: newRemainingSessions },
        });

        const existingHistory = await tx.packageUsageHistory.findUnique({
          where: { appointmentId: appointment.id },
        });

        if (!existingHistory) {
          await tx.packageUsageHistory.create({
            data: {
              appointmentId: appointment.id,
              customerPackageId: customerPackage.id,
            },
          });
        }

        const updatedAppointment = await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: newStatus },
        });

        return updatedAppointment;
      });
    } else {
      return this.prisma.appointment.update({
        where: { id },
        data: { status: newStatus },
      });
    }
  }

  findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        staffId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
    });
  }

  findByCustomerAndDateRange(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.appointment.findMany({
      where: {
        customerId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
    });
  }

  async getCalendarData(branchId: string, start: Date, end: Date) {
    // 1. Şubedeki personeli (kaynakları) getir
    const staff = await this.prisma.user.findMany({
      where: {
        branchId: branchId,
        role: { in: ['STAFF', 'BRANCH_MANAGER', 'RECEPTION'] },
      },
    });

    const resources = staff.map((user) => ({
      id: user.id,
      title: user.name, // Hata düzeltildi: `surname` alanı User modelinde yok.
    }));

    // 2. Tarih aralığındaki randevuları (etkinlikleri) getir
    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId: branchId,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
    });

    const events = appointments.map((appointment) => ({
      id: appointment.id,
      resourceId: appointment.staffId,
      start: appointment.startTime,
      end: appointment.endTime,
      title: `${appointment.customer.name} - ${appointment.service.name}`,
      backgroundColor: this.getEventColor(appointment.status),
      borderColor: this.getEventColor(appointment.status),
      extendedProps: {
        staffName: appointment.staff.name,
        customerName: appointment.customer.name,
        serviceName: appointment.service.name,
        status: appointment.status,
      },
    }));

    return { resources, events };
  }

  private getEventColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return '#3498db'; // Mavi
      case AppointmentStatus.COMPLETED:
        return '#2ecc71'; // Yeşil
      case AppointmentStatus.SCHEDULED: // Hata düzeltildi: PENDING -> SCHEDULED
        return '#f1c40f'; // Sarı
      case AppointmentStatus.NO_SHOW: // Hata düzeltildi: NOSHOW -> NO_SHOW
        return '#e74c3c'; // Kırmızı
      case AppointmentStatus.CANCELLED:
        return '#bdc3c7'; // Gri
      default:
        return '#95a5a6'; // Diğer durumlar için Gri
    }
  }

  async getDashboardMetrics(
    branchId: string,
    period: 'day' | 'week' | 'month',
  ) {
    const now = new Date();
    let startDate: Date;

    if (period === 'day') {
      startDate = startOfDay(now);
    } else if (period === 'week') {
      startDate = startOfDay(new Date(now.setDate(now.getDate() - now.getDay())));
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        startTime: { gte: startDate },
      },
      include: { service: true },
    });

    const totalRevenue = completedAppointments.reduce(
      (sum, app) => sum + (app.service?.price || 0),
      0,
    );
    const totalAppointments = completedAppointments.length;

    const upcomingAppointments = await this.prisma.appointment.count({
      where: {
        branchId,
        status: AppointmentStatus.CONFIRMED,
        startTime: { gte: new Date() },
      },
    });

    return {
      totalRevenue,
      totalAppointments,
      upcomingAppointments,
    };
  }
}
