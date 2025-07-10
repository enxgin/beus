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
    const appointments = await this.prisma.appointment.findMany({
      where: { branchId, startTime: { gte: new Date(start) }, endTime: { lte: new Date(end) } },
      include: { staff: true, customer: true, service: true },
    });

    const resources = (await this.prisma.user.findMany({
      where: { branchId, role: { in: [UserRole.STAFF, UserRole.BRANCH_MANAGER] } }, // UserRole artık tanımlı
    })).map((staff) => ({ id: staff.id, title: staff.name }));

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
  async findAll(branchId: string) {
    return this.prisma.appointment.findMany({ where: { branchId } });
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
}
