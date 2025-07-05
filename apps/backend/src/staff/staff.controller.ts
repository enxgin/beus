import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'Belirli bir hizmeti verebilen personelleri listele' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiQuery({ name: 'serviceId', required: false, type: String, description: 'Filtrelemek için hizmet IDsi (opsiyonel)' })
  findAvailableStaff(
    @Query('branchId') branchId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.staffService.findAvailableStaff(branchId, serviceId);
  }
}
