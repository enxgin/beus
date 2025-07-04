import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../prisma/prisma-types';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Hizmetin süresini kontrol et
    const service = await this.prisma.service.findUnique({
      where: { id: createAppointmentDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Hizmet bulunamadı: ID ${createAppointmentDto.serviceId}`);
    }

    // Hizmetin süresini kontrol et ve bitiş zamanını hesapla
    const startTime = new Date(createAppointmentDto.startTime);
    let endTime: Date;

    // Başlangıç zamanı service.duration kadar ilerletilir
    if (service.duration) {
      endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);
    } else if (createAppointmentDto.endTime) {
      // Eğer hizmetin süresi yoksa endTime değerini al
      endTime = new Date(createAppointmentDto.endTime);
    } else {
      // Süre yoksa varsayılan olarak 60 dakika ekle
      endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 60);
    }

    // Personelin o saatte müsait olup olmadığını kontrol et
    const staffConflict = await this.prisma.appointment.findFirst({
      where: {
        staffId: createAppointmentDto.staffId,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.ARRIVED] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ],
      },
    });

    if (staffConflict) {
      throw new BadRequestException(`Personel bu zaman diliminde başka bir randevu için rezerve edilmiş.`);
    }

    // Randevuyu oluştur
    // Check if branchId is provided
    if (!createAppointmentDto.branchId) {
      throw new BadRequestException('Branch ID is required for appointment creation');
    }

    return this.prisma.appointment.create({
      data: {
        customerId: createAppointmentDto.customerId,
        staffId: createAppointmentDto.staffId,
        serviceId: createAppointmentDto.serviceId,
        branchId: createAppointmentDto.branchId,
        startTime: createAppointmentDto.startTime,
        endTime,
        status: AppointmentStatus.SCHEDULED,
        notes: createAppointmentDto.notes || '',
      },
      include: {
        customer: true,
        staff: true,
        service: true,
        branch: true,
      },
    });
  }

  async findAll(params: FindAppointmentsDto) {
    const { 
      startDate, 
      endDate, 
      customerId, 
      staffId, 
      branchId, 
      serviceId,
      status,
      skip,
      take,
      orderBy
    } = params;

    // Filtreleri oluştur
    const where: any = {};
    
    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (status) {
      where.status = status;
    }

    // Varsayılan sıralama
    let orderByOption = orderBy || { startTime: 'asc' };

    // Toplam randevu sayısı
    const total = await this.prisma.appointment.count({ where });

    // Sayfalama ile randevuları getir
    const appointments = await this.prisma.appointment.findMany({
      where,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: orderByOption,
      include: {
        customer: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        service: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        packageUsage: true,
      },
    });

    return { data: appointments, total };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        service: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        packageUsage: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${id}`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${id}`);
    }

    // Güncelleme verilerini hazırla
    const updateData: any = { ...updateAppointmentDto };
    let endTime = existingAppointment.endTime;

    // Servis veya başlangıç zamanı değişmişse endTime'ı güncelle
    if (updateAppointmentDto.serviceId || updateAppointmentDto.startTime) {
      // Yeni servisi veya mevcut servisi al
      const serviceId = updateAppointmentDto.serviceId || existingAppointment.serviceId;
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Hizmet bulunamadı: ID ${serviceId}`);
      }

      // Yeni başlangıç zamanını veya mevcut başlangıç zamanını kullan
      const startTime = updateAppointmentDto.startTime 
        ? new Date(updateAppointmentDto.startTime)
        : existingAppointment.startTime;

      // Bitiş zamanını güncelle
      if (service.duration) {
        endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration);
        updateData.endTime = endTime;
      } else if (updateAppointmentDto.endTime) {
        endTime = new Date(updateAppointmentDto.endTime);
        updateData.endTime = endTime;
      }

      // Personelin o saatte müsait olup olmadığını kontrol et
      const staffId = updateAppointmentDto.staffId || existingAppointment.staffId;
      const staffConflict = await this.prisma.appointment.findFirst({
        where: {
          id: { not: id }, // Mevcut randevu hariç
          staffId: staffId,
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.ARRIVED] },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ],
        },
      });

      if (staffConflict) {
        throw new BadRequestException(`Personel bu zaman diliminde başka bir randevu için rezerve edilmiş.`);
      }
    }

    // Randevuyu güncelle
    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        staff: true,
        service: true,
        branch: true,
        packageUsage: true,
      },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto) {
    const { status } = updateStatusDto;
    
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${id}`);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        staff: true,
        service: true,
        branch: true,
      },
    });
  }

  async remove(id: string) {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Randevu bulunamadı: ID ${id}`);
    }

    return this.prisma.appointment.delete({
      where: { id },
      include: {
        customer: true,
        staff: true,
        service: true,
      },
    });
  }

  // Tarih aralığına göre personelin randevularını getir
  async findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        staffId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  // Tarih aralığına göre müşterinin randevularını getir
  async findByCustomerAndDateRange(customerId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.findMany({
      where: {
        customerId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }
}



