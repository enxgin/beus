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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
    return this.cashRegisterService.openCashDay(openCashDayDto, req.user.id);
  }

  @Post('close-day')
  @ApiOperation({ summary: 'Günlük kasa kapanışı yap' })
  @ApiResponse({
    status: 200,
    description: 'Kasa günü başarıyla kapatıldı',
  })
  closeCashDay(@Body() closeCashDayDto: CloseCashDayDto, @Request() req) {
    return this.cashRegisterService.closeCashDay(closeCashDayDto, req.user.id);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Manuel gelir/gider ekle' })
  @ApiResponse({
    status: 201,
    description: 'Kasa işlemi başarıyla oluşturuldu',
  })
  createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user.id);
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
      type: CashLogType.MANUAL_INCOME,
    };
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user.id);
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
      type: CashLogType.MANUAL_EXPENSE,
    };
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user.id);
  }

  @Get('day/:id')
  @ApiOperation({ summary: 'Kasa günü detaylarını getir' })
  @ApiResponse({
    status: 200,
    description: 'Kasa günü detayları başarıyla getirildi',
  })
  getCashDayDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.getCashDayDetails(id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Bugünkü açık kasa günü bilgilerini getir' })
  @ApiResponse({
    status: 200,
    description: 'Bugünkü kasa günü başarıyla getirildi',
  })
  getCurrentCashDay(@Query('branchId', ParseUUIDPipe) branchId: string) {
    return this.cashRegisterService.getCurrentCashDay(branchId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Kasa raporlarını getir' })
  @ApiResponse({
    status: 200,
    description: 'Kasa raporları başarıyla getirildi',
  })
  getCashReports(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('branchId') branchId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.cashRegisterService.getCashReports(
      startDate,
      endDate,
      branchId,
      page,
      limit,
    );
  }
}
