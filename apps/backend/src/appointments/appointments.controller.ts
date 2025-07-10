import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni bir randevu oluşturur' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Bir şubedeki tüm randevuları listeler' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;
    return this.appointmentsService.findAll(branchId, skipNum, takeNum, search, req?.user);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Takvim için randevu verilerini getirir' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  getCalendarData(
    @Query('branchId') branchId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    // Servis metoduyla uyumlu hale getirildi.
    return this.appointmentsService.getCalendarData(branchId, start, end);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Belirtilen personel, hizmet ve tarih için müsait saatleri getirir' })
  @ApiQuery({ name: 'staffId', required: true, type: String })
  @ApiQuery({ name: 'serviceId', required: true, type: String })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'YYYY-MM-DD formatında tarih' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  getAvailableSlots(
    @Query('staffId') staffId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('branchId') branchId: string,
  ) {
    return this.appointmentsService.getAvailableSlots(staffId, serviceId, date, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile tek bir randevuyu getirir' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Belirtilen ID ile bir randevuyu günceller' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Bir randevuyu yeniden zamanlar' })
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleAppointmentDto,
  ) {
    // Servis metoduyla uyumlu hale getirildi: reschedule
    return this.appointmentsService.reschedule(id, rescheduleDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bir randevunun durumunu günceller' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    // Servis metoduyla uyumlu hale getirildi.
    return this.appointmentsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Belirtilen ID ile bir randevuyu siler' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  // Serviste karşılığı olmayan ve hata üreten endpoint'ler kaldırıldı.
}
