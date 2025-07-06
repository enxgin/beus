import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, CommissionStatus } from '../../src/prisma/prisma-types';
import { parse } from 'date-fns';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  private readonly logger = new Logger(CommissionsController.name);
  
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  findAll(
    @Query('userId') userId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (serviceId) filters.serviceId = serviceId;
    
    if (status && Object.values(CommissionStatus).includes(status as CommissionStatus)) {
      filters.status = status;
    } else if (status && status !== 'all') {
      throw new BadRequestException(`Geçersiz prim durumu: ${status}`);
    }
    
    // Tarih filtrelemeleri
    if (startDate && endDate) {
      try {
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        
        // Son günün 23:59:59'una kadar
        parsedEndDate.setHours(23, 59, 59, 999);
        
        filters.startDate = parsedStartDate;
        filters.endDate = parsedEndDate;
      } catch (error) {
        this.logger.error(`Tarih ayrıştırma hatası: ${error.message}`);
        throw new BadRequestException('Geçersiz tarih formatı. YYYY-MM-DD formatını kullanın.');
      }
    }
    
    return this.commissionsService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.commissionsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCommissionStatusDto,
  ) {
    return this.commissionsService.updateStatus(id, updateStatusDto);
  }

  // Faturaya ilişkin prim hesaplama (manuel tetikleme için)
  @Post('calculate/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  calculateCommission(@Param('invoiceId') invoiceId: string) {
    return this.commissionsService.calculateCommissionForInvoice(invoiceId);
  }
}
