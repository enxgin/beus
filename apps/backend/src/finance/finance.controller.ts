import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('receivables')
  @ApiOperation({ summary: 'Ödenmemiş veya kısmen ödenmiş faturaları olan müşterileri (borçluları) listeler' })
  getReceivables(@Req() req) {
    const user = req.user as any;
    return this.financeService.getReceivables(user);
  }
}
