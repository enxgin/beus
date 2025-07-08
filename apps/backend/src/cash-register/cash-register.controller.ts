import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { OpenCashDayDto } from './dto/open-cash-day.dto';
import { CloseCashDayDto } from './dto/close-cash-day.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CashLogType } from '../prisma/prisma-types';

@ApiTags('cash-register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open-day')
  @ApiOperation({ summary: 'Günlük kasa açılışı yap' })
  @ApiResponse({
    status: 201,
    description: 'Kasa günü başarıyla açıldı',
  })
  openCashDay(@Body() openCashDayDto: OpenCashDayDto, @Request() req) {
    return this.cashRegisterService.openCashDay(openCashDayDto, req.user);
  }

  @Post('close-day')
  @ApiOperation({ summary: 'Günlük kasa kapanışı yap' })
  @ApiResponse({
    status: 200,
    description: 'Kasa günü başarıyla kapatıldı',
  })
  closeCashDay(@Body() closeCashDayDto: CloseCashDayDto, @Request() req) {
    // TODO: Servis katmanını da user nesnesi alacak şekilde güncelle
    return this.cashRegisterService.closeCashDay(closeCashDayDto, req.user);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Manuel gelir/gider ekle' })
  @ApiResponse({
    status: 201,
    description: 'Kasa işlemi başarıyla oluşturuldu',
  })
  createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    // TODO: Servis katmanını da user nesnesi alacak şekilde güncelle
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user);
  }

  @Post('manual-income')
  @ApiOperation({ summary: 'Manuel gelir ekle' })
  @ApiResponse({
    status: 201,
    description: 'Manuel gelir başarıyla oluşturuldu',
  })
  createManualIncome(@Body() dto: Omit<CreateTransactionDto, 'type'>, @Request() req) {
    const createTransactionDto = {
      ...dto,
      type: CashLogType.MANUAL_IN,
    };
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user);
  }

  @Post('manual-expense')
  @ApiOperation({ summary: 'Manuel gider ekle' })
  @ApiResponse({
    status: 201,
    description: 'Manuel gider başarıyla oluşturuldu',
  })
  createManualExpense(@Body() dto: Omit<CreateTransactionDto, 'type'>, @Request() req) {
    const createTransactionDto = {
      ...dto,
      type: CashLogType.MANUAL_OUT,
    };
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user);
  }

  @Get('day-details')
  @ApiOperation({ summary: 'Belirli bir tarihteki kasa günü detaylarını getir' })
  @ApiResponse({
    status: 200,
    description: 'Kasa günü detayları başarıyla getirildi',
  })
  getCashDayDetails(
    @Query('date') dateStr: string,
    @Query('branchId') branchId: string,
    @Request() req,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.cashRegisterService.getCashDayDetails(date, branchId, req.user);
  }

  @Get('current')
  @ApiOperation({ summary: 'Bugünkü açık kasa günü bilgilerini getir' })
  @ApiResponse({
    status: 200,
    description: 'Bugünkü kasa günü başarıyla getirildi',
  })
  getCurrentCashDay(@Query('branchId', ParseUUIDPipe) branchId: string, @Request() req) {
    return this.cashRegisterService.getCurrentCashDay(branchId, req.user);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Kasa raporlarını getir' })
  @ApiResponse({
    status: 200,
    description: 'Kasa raporları başarıyla getirildi',
  })
  getCashReports(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const dto = {
      startDate,
      endDate,
      branchId,
      page,
      limit,
    };
    return this.cashRegisterService.getCashReports(dto, req.user);
  }
}
