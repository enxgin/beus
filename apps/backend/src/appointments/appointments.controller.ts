import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @ApiOperation({ summary: 'Yeni bir randevu oluştur' })
  @ApiResponse({ status: 201, description: 'Randevu başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya çakışan randevu' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @ApiOperation({ summary: 'Randevuları listele ve filtrele' })
  @ApiResponse({ status: 200, description: 'Randevular başarıyla listelendi' })
  @Get()
  findAll(@Query() findAppointmentsDto: FindAppointmentsDto) {
    return this.appointmentsService.findAll(findAppointmentsDto);
  }

  @ApiOperation({ summary: 'ID\'ye göre randevu getir' })
  @ApiResponse({ status: 200, description: 'Randevu başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Randevu bulunamadı' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Randevu bilgilerini güncelle' })
  @ApiResponse({ status: 200, description: 'Randevu başarıyla güncellendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya çakışan randevu' })
  @ApiResponse({ status: 404, description: 'Randevu bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @ApiOperation({ summary: 'Randevu durumunu güncelle (tamamlandı, iptal, vb.)' })
  @ApiResponse({ status: 200, description: 'Randevu durumu başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Randevu bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, updateStatusDto);
  }

  @ApiOperation({ summary: 'Randevu sil' })
  @ApiResponse({ status: 200, description: 'Randevu başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Randevu bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @ApiOperation({ summary: 'Personele ait randevuları belirli bir tarih aralığında getir' })
  @ApiResponse({ status: 200, description: 'Randevular başarıyla listelendi' })
  @Get('staff/:staffId/range')
  findByStaffAndDateRange(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.findByStaffAndDateRange(
      staffId,
      new Date(startDate || new Date()),
      new Date(endDate || new Date()),
    );
  }

  @ApiOperation({ summary: 'Müşteriye ait randevuları belirli bir tarih aralığında getir' })
  @ApiResponse({ status: 200, description: 'Randevular başarıyla listelendi' })
  @Get('customer/:customerId/range')
  findByCustomerAndDateRange(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.findByCustomerAndDateRange(
      customerId,
      new Date(startDate || new Date()),
      new Date(endDate || new Date()),
    );
  }
}



