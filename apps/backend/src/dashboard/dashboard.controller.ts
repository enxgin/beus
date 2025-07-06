import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Dashboard istatistiklerini getirir' })
  @ApiResponse({ status: 200, description: 'İstatistikler başarıyla getirildi' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get('stats')
  getStats(@Query('branchId') branchId: string, @Req() req) {
    // Kullanıcı kendi şubesinin verilerini görüntüleyebilir
    const userBranchId = req.user.branchId;
    
    // Eğer branchId belirtilmemişse ve kullanıcının bir şubesi varsa, o şubenin verilerini getir
    const targetBranchId = branchId || userBranchId;
    
    return this.dashboardService.getDashboardStats(targetBranchId);
  }

  @ApiOperation({ summary: 'Son randevuları getirir' })
  @ApiResponse({ status: 200, description: 'Randevular başarıyla getirildi' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get('recent-appointments')
  getRecentAppointments(
    @Query('branchId') branchId: string,
    @Query('limit') limit: number = 5,
    @Req() req
  ) {
    const userBranchId = req.user.branchId;
    const targetBranchId = branchId || userBranchId;
    
    return this.dashboardService.getRecentAppointments(targetBranchId, limit);
  }

  @ApiOperation({ summary: 'Haftalık performans verilerini getirir' })
  @ApiResponse({ status: 200, description: 'Veriler başarıyla getirildi' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.SUPER_BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get('weekly-performance')
  getWeeklyPerformance(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req
  ) {
    const userBranchId = req.user.branchId;
    const targetBranchId = branchId || userBranchId;
    
    return this.dashboardService.getWeeklyPerformance(targetBranchId, startDate, endDate);
  }
}
