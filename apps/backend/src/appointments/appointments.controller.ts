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
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
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
  @ApiOperation({
    summary: 'Belirtilen tarih aralığındaki tüm randevuları listeler',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query() findAppointmentsDto: FindAppointmentsDto,
    @Query('search') search?: string,
  ) {
    const { branchId, startDate, endDate } = findAppointmentsDto;
    return this.appointmentsService.findAll(
      branchId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      search,
    );
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
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.appointmentsService.getCalendarData(branchId, startDate, endDate);
  }

  @Get('available-slots')
  @ApiOperation({
    summary: 'Belirtilen personel, tarih ve hizmet için uygun saatleri getirir',
  })
  @ApiQuery({ name: 'staffId', required: true, type: String })
  @ApiQuery({ name: 'serviceId', required: true, type: String })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'YYYY-MM-DD formatında tarih',
  })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  getAvailableSlots(
    @Query('staffId') staffId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('branchId') branchId: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      staffId,
      serviceId,
      date,
      branchId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirtilen ID ile tek bir randevuyu getirir' })
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
  rescheduleAppointment(
    @Param('id') id: string,
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(
      id,
      rescheduleAppointmentDto,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bir randevunun durumunu günceller' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Belirtilen ID ile bir randevuyu siler' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Get('staff/:staffId')
  @ApiOperation({
    summary: 'Belirtilen personele ait randevuları tarih aralığına göre getirir',
  })
  findByStaffAndDateRange(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.findByStaffAndDateRange(
      staffId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Belirtilen müşteriye ait randevuları tarih aralığına göre getirir',
  })
  findByCustomerAndDateRange(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.findByCustomerAndDateRange(
      customerId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
