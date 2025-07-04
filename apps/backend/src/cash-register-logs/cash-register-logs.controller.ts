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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CashRegisterLogsService, CashBalance, DailySummary } from './cash-register-logs.service';
import { CreateCashRegisterLogDto } from './dto/create-cash-register-log.dto';
import { UpdateCashRegisterLogDto } from './dto/update-cash-register-log.dto';
import { FindCashRegisterLogsDto } from './dto/find-cash-register-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';

@ApiTags('cash-register-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-register-logs')
export class CashRegisterLogsController {
  constructor(private readonly cashRegisterLogsService: CashRegisterLogsService) {}

  @ApiOperation({ summary: 'Kasa kaydı oluştur' })
  @ApiResponse({ status: 201, description: 'Kasa kaydı başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post()
  create(@Body() createCashRegisterLogDto: CreateCashRegisterLogDto) {
    return this.cashRegisterLogsService.create(createCashRegisterLogDto);
  }

  @ApiOperation({ summary: 'Kasa kayıtlarını listele ve filtrele' })
  @ApiResponse({ status: 200, description: 'Kasa kayıtları başarıyla listelendi' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Get()
  findAll(@Query() findCashRegisterLogsDto: FindCashRegisterLogsDto) {
    return this.cashRegisterLogsService.findAll(findCashRegisterLogsDto);
  }

  @ApiOperation({ summary: 'ID\'ye göre kasa kaydı getir' })
  @ApiResponse({ status: 200, description: 'Kasa kaydı başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Kasa kaydı bulunamadı' })
  @ApiParam({ name: 'id', description: 'Kasa Kaydı ID' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashRegisterLogsService.findOne(id);
  }

  @ApiOperation({ summary: 'Kasa kaydını güncelle' })
  @ApiResponse({ status: 200, description: 'Kasa kaydı başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Kasa kaydı bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Kasa Kaydı ID' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCashRegisterLogDto: UpdateCashRegisterLogDto) {
    return this.cashRegisterLogsService.update(id, updateCashRegisterLogDto);
  }

  @ApiOperation({ summary: 'Kasa kaydını sil' })
  @ApiResponse({ status: 200, description: 'Kasa kaydı başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Kasa kaydı bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Kasa Kaydı ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashRegisterLogsService.remove(id);
  }

  @ApiOperation({ summary: 'Günlük kasa özeti' })
  @ApiResponse({ status: 200, description: 'Günlük kasa özeti başarıyla getirildi' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Şubeye göre filtrele',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Tarih (YYYY-MM-DD)',
  })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER)
  @Get('reports/daily')
  getDailyReport(
    @Query('branchId') branchId?: string,
    @Query('date') dateStr?: string,
  ): Promise<DailySummary> {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.cashRegisterLogsService.getDailySummary(branchId, date);
  }
  
  @ApiOperation({ summary: 'Kasa bakiyesi hesapla' })
  @ApiResponse({ status: 200, description: 'Kasa bakiyesi başarıyla hesaplandı' })
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
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Get('reports/balance')
  getCashBalance(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CashBalance> {
    const startDateTime = startDate ? new Date(startDate) : undefined;
    const endDateTime = endDate ? new Date(endDate) : undefined;
    
    return this.cashRegisterLogsService.calculateCashBalance(branchId, startDateTime, endDateTime);
  }
  
  @ApiOperation({ summary: 'Kasa açılış kaydı oluştur' })
  @ApiResponse({ status: 201, description: 'Kasa açılış kaydı başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Kasa zaten açık veya geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        branchId: { type: 'string', example: '1a2b3c4d5e6f7g8h9i0j' },
        userId: { type: 'string', example: '1a2b3c4d5e6f7g8h9i0j' },
        initialAmount: { type: 'number', example: 500.00 },
        description: { type: 'string', example: 'Kasa açılışı' },
      },
      required: ['branchId', 'userId', 'initialAmount'],
    },
  })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post('open')
  openCashRegister(
    @Body() body: { branchId: string; userId: string; initialAmount: number; description?: string },
  ) {
    const { branchId, userId, initialAmount, description } = body;
    return this.cashRegisterLogsService.openCashRegister(branchId, userId, initialAmount, description);
  }
  
  @ApiOperation({ summary: 'Kasa kapanış kaydı oluştur' })
  @ApiResponse({ status: 201, description: 'Kasa kapanış kaydı başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Kasa henüz açılmamış veya zaten kapalı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        branchId: { type: 'string', example: '1a2b3c4d5e6f7g8h9i0j' },
        userId: { type: 'string', example: '1a2b3c4d5e6f7g8h9i0j' },
        finalAmount: { type: 'number', example: 2500.00 },
        description: { type: 'string', example: 'Kasa kapanışı' },
      },
      required: ['branchId', 'userId', 'finalAmount'],
    },
  })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION)
  @Post('close')
  closeCashRegister(
    @Body() body: { branchId: string; userId: string; finalAmount: number; description?: string },
  ) {
    const { branchId, userId, finalAmount, description } = body;
    return this.cashRegisterLogsService.closeCashRegister(branchId, userId, finalAmount, description);
  }
}



