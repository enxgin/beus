import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';
import { CreateInvoiceFromServiceDto } from './dto/create-invoice-from-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @ApiOperation({ summary: 'Yeni bir fatura oluştur' })
  @ApiResponse({ status: 201, description: 'Fatura başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 404, description: 'Müşteri veya şube bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @ApiOperation({ summary: 'Faturaları listele ve filtrele' })
  @ApiResponse({ status: 200, description: 'Faturalar başarıyla listelendi' })
  @Get()
  findAll(@Query() findInvoicesDto: FindInvoicesDto) {
    return this.invoicesService.findAll(findInvoicesDto);
  }

  @ApiOperation({ summary: 'ID\'ye göre fatura getir' })
  @ApiResponse({ status: 200, description: 'Fatura başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Fatura bulunamadı' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Fatura bilgilerini güncelle' })
  @ApiResponse({ status: 200, description: 'Fatura başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Fatura bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @ApiOperation({ summary: 'Fatura sil' })
  @ApiResponse({ status: 200, description: 'Fatura başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Fatura bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @ApiOperation({ summary: 'Faturaya ödeme ekle' })
  @ApiResponse({ status: 201, description: 'Ödeme başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya borçtan fazla ödeme' })
  @ApiResponse({ status: 404, description: 'Fatura bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post(':id/payments')
  createPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.invoicesService.createPayment(id, createPaymentDto);
  }

  @ApiOperation({ summary: 'Paket satışı veya tamamlanan randevudan fatura oluştur' })
  @ApiResponse({ status: 201, description: 'Fatura başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 404, description: 'Müşteri, paket veya randevu bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post('from-service')
  createInvoiceFromService(@Body() createInvoiceFromServiceDto: CreateInvoiceFromServiceDto) {
    return this.invoicesService.createInvoiceFromService(createInvoiceFromServiceDto);
  }

  @ApiOperation({ summary: 'Faturadan iade al' })
  @ApiResponse({ status: 200, description: 'İade başarıyla alındı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 404, description: 'Fatura veya ödeme bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @ApiParam({ name: 'paymentId', description: 'Ödeme ID' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Post(':id/payments/:paymentId/refund')
  refundPayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() refundDto: { reason: string; userId: string }
  ) {
    return this.invoicesService.refundPayment(id, paymentId, refundDto);
  }

  @ApiOperation({ summary: 'Fatura istatistiklerini hesapla' })
  @ApiResponse({ status: 200, description: 'İstatistikler başarıyla hesaplandı' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Şubeye göre filtrele',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Başlangıç tarihi (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Bitiş tarihi (YYYY-MM-DD)',
  })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Get('stats/calculate')
  calculateStats(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateTime = startDate ? new Date(startDate) : undefined;
    const endDateTime = endDate ? new Date(endDate) : undefined;
    
    return this.invoicesService.calculateInvoiceStats(branchId, startDateTime, endDateTime);
  }

  @ApiOperation({ summary: 'Personel primi oluştur' })
  @ApiResponse({ status: 201, description: 'Prim başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya fatura için zaten prim var' })
  @ApiResponse({ status: 404, description: 'Fatura veya personel bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Fatura ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        staffId: { type: 'string', example: '1a2b3c4d5e6f7g8h9i0j' },
        amount: { type: 'number', example: 100.00 },
      },
    },
  })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Post(':id/commission')
  createCommission(
    @Param('id') id: string,
    @Body() body: { staffId: string; amount: number },
  ) {
    return this.invoicesService.createStaffCommission(id, body.staffId, body.amount);
  }
}



