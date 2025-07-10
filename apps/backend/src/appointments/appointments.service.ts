import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { Appointment, AppointmentStatus, Prisma, UserRole } from '@prisma/client'; // UserRole eklendi
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private packagesService: PackagesService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { startTime, endTime, staffId, serviceId, customerId, branchId, notes } = createAppointmentDto;

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW] },
        OR: [{ startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } }],
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Personel bu saat aralığında meşgul.');
    }

    const appointmentData: Prisma.AppointmentCreateInput = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
      status: AppointmentStatus.SCHEDULED,
      branch: { connect: { id: branchId } },
      customer: { connect: { id: customerId } },
      staff: { connect: { id: staffId } },
      service: { connect: { id: serviceId } },
    };

    return this.prisma.appointment.create({ data: appointmentData });
  }

  async updateStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto): Promise<Appointment> {
    const { status, cancellationReason } = updateStatusDto;
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Randevu bulunamadı (ID: ${id}).`);
    }

    

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(status === AppointmentStatus.CANCELLED && cancellationReason && { notes: `İptal Nedeni: ${cancellationReason}` }),
      },
    });
  }

  async reschedule(id: string, rescheduleDto: RescheduleAppointmentDto): Promise<Appointment> {
    const { startTime, endTime, staffId } = rescheduleDto;
    await this.prisma.appointment.findUniqueOrThrow({ where: { id } });

    return this.prisma.appointment.update({
      where: { id },
      data: { startTime, endTime, ...(staffId && { staff: { connect: { id: staffId } } }) },
    });
  }

  async getCalendarData(branchId: string, start: string, end: string) { // Metot adı düzeltildi
    console.log('🔍 AppointmentsService.getCalendarData() çağrıldı');
    console.log('📍 branchId:', branchId);
    console.log('📅 start:', start);
    console.log('📅 end:', end);
    
    const appointments = await this.prisma.appointment.findMany({
      where: { branchId, startTime: { gte: new Date(start) }, endTime: { lte: new Date(end) } },
      include: { staff: true, customer: true, service: true },
    });

    const resources = (await this.prisma.user.findMany({
      where: { branchId, role: { in: [UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.RECEPTION] } }, // RECEPTION eklendi
    })).map((staff) => ({ id: staff.id, title: staff.name }));

    console.log('👥 Takvim kaynakları (personel):', resources);
    console.log('📅 Randevular:', appointments.length);

    const events = appointments.map((appointment) => ({
      id: appointment.id,
      resourceId: appointment.staffId,
      start: appointment.startTime.toISOString(),
      end: appointment.endTime.toISOString(),
      title: `${appointment.customer.name} - ${appointment.service.name}`,
      color: this.getEventColor(appointment.status),
      extendedProps: { status: appointment.status },
    }));

    return { resources, events };
  }

  // Eksik CRUD metotları eklendi
  async findAll(branchId?: string, skip: number = 0, take: number = 10, search?: string, user?: any) {
    // Where clause oluştur
    const where: any = {};
    
    // Rol tabanlı yetkilendirme - Global kurallara göre
    if (user) {
      if (user.role === UserRole.ADMIN) {
        // ADMIN: Tüm şubelere erişim
        if (branchId) {
          where.branchId = branchId;
        }
      } else if (user.role === UserRole.SUPER_BRANCH_MANAGER) {
        // SUPER_BRANCH_MANAGER: Bağlantılı şubelere erişim
        // TODO: Kullanıcının bağlantılı şubelerini kontrol et
        if (branchId) {
          where.branchId = branchId;
        } else if (user.branchId) {
          where.branchId = user.branchId;
        }
      } else {
        // STAFF, BRANCH_MANAGER, RECEPTION: Sadece kendi şubesi
        where.branchId = user.branchId;
      }
    } else if (branchId) {
      where.branchId = branchId;
    }
    
    if (search) {
      where.OR = [
        {
          customer: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          customer: {
            phone: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Toplam kayıt sayısını al
    const totalCount = await this.prisma.appointment.count({ where });

    // Randevuları getir
    const data = await this.prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        },
        staff: {
          select: {
            name: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return { data, totalCount };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id }, include: { service: true, customer: true, staff: true } });
    if (!appointment) throw new NotFoundException('Randevu bulunamadı');
    return appointment;
  }

  async update(id: string, updateDto: UpdateAppointmentDto) {
    await this.prisma.appointment.findUniqueOrThrow({ where: { id } });
    return this.prisma.appointment.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.prisma.appointment.findUniqueOrThrow({ where: { id } });
    return this.prisma.appointment.delete({ where: { id } });
  }

  private getEventColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return '#3498db';
      case AppointmentStatus.COMPLETED: return '#2ecc71';
      case AppointmentStatus.SCHEDULED: return '#f1c40f';
      case AppointmentStatus.NO_SHOW: return '#e74c3c';
      case AppointmentStatus.CANCELLED: return '#bdc3c7';
      default: return '#95a5a6';
    }
  }

  async getAvailableSlots(staffId: string, serviceId: string, date: string, branchId: string): Promise<string[]> {
    // Tarih formatını kontrol et ve Date objesine çevir
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Geçersiz tarih formatı');
    }

    // Günün başlangıç ve bitiş saatlerini belirle
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Personelin o gün için mevcut randevularını getir
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        staffId,
        branchId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Hizmet süresini getir
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı');
    }

    const serviceDuration = service.duration; // dakika cinsinden

    // Çalışma saatleri (09:00 - 18:00 arası, 30 dakikalık slotlar)
    const workingHours = {
      start: 9, // 09:00
      end: 18,  // 18:00
      slotDuration: 30, // 30 dakika
    };

    const availableSlots: string[] = [];

    // Her 30 dakikalık slot için kontrol yap
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + serviceDuration);

        // Slot bitiş saati çalışma saatleri içinde mi kontrol et
        if (slotEnd.getHours() > workingHours.end ||
            (slotEnd.getHours() === workingHours.end && slotEnd.getMinutes() > 0)) {
          continue;
        }

        // Bu slot mevcut randevularla çakışıyor mu kontrol et
        const hasConflict = existingAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.startTime);
          const appointmentEnd = new Date(appointment.endTime);
          
          return (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          );
        });

        if (!hasConflict) {
          availableSlots.push(slotStart.toISOString());
        }
      }
    }

    return availableSlots;
  }
}
