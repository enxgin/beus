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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../prisma/prisma-types';
import { NotificationHistoryService } from '../services/notification-history.service';

@ApiTags('notification-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-history')
export class NotificationHistoryController {
  constructor(
    private readonly notificationHistoryService: NotificationHistoryService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification history with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['SENT', 'FAILED'], description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: ['SMS', 'WHATSAPP', 'EMAIL'], description: 'Filter by type' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'customerId', required: false, type: String, description: 'Filter by customer' })
  @ApiQuery({ name: 'templateId', required: false, type: String, description: 'Filter by template' })
  @ApiQuery({ name: 'triggerId', required: false, type: String, description: 'Filter by trigger' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in content or customer name' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('templateId') templateId?: string,
    @Query('triggerId') triggerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as any,
      type: type as any,
      branchId,
      customerId,
      templateId,
      triggerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    };

    return this.notificationHistoryService.findAll(req.user, filters);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification history statistics' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Group statistics by period' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
    @Query('groupBy') groupBy?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getStats(req.user, {
      branchId,
    });
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Export notification history' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'excel'], description: 'Export format' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Export completed successfully' })
  async exportHistory(
    @Request() req: any,
    @Query('format') format?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const filters = {
      branchId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.notificationHistoryService.exportHistory(
      filters,
      format as any || 'csv',
      req.user,
    );
  }

  @Get('delivery-rates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get delivery rates by type and period' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiResponse({ status: 200, description: 'Delivery rates retrieved successfully' })
  async getDeliveryRates(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getDeliveryRates(
      branchId,
      period as any,
      req.user,
    );
  }

  @Get('popular-templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get most used templates' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of templates to return' })
  @ApiResponse({ status: 200, description: 'Popular templates retrieved successfully' })
  async getPopularTemplates(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getPopularTemplates(
      branchId,
      period as any,
      limit ? parseInt(limit) : 10,
      req.user,
    );
  }

  @Get('customer-activity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer notification activity' })
  @ApiQuery({ name: 'customerId', required: true, type: String, description: 'Customer ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records to return' })
  @ApiResponse({ status: 200, description: 'Customer activity retrieved successfully' })
  async getCustomerActivity(
    @Request() req: any,
    @Query('customerId') customerId: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getCustomerActivity(
      customerId,
      limit ? parseInt(limit) : 50,
      req.user,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification history by ID' })
  @ApiResponse({ status: 200, description: 'History record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'History record not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationHistoryService.findOne(id, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete notification history record' })
  @ApiResponse({ status: 200, description: 'History record deleted successfully' })
  @ApiResponse({ status: 404, description: 'History record not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<any> {
    await this.notificationHistoryService.remove(id, req.user);
    return { message: 'History record deleted successfully' };
  }

  @Delete('bulk-delete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete multiple history records' })
  @ApiResponse({ status: 200, description: 'Bulk delete completed' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkDelete(
    @Body() data: { ids: string[] },
    @Request() req: any,
  ): Promise<any> {
    const result = await this.notificationHistoryService.bulkDelete(data.ids, req.user);
    return { message: 'History records deleted successfully', ...result };
  }

  @Post('cleanup')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Clean up old history records' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanup(
    @Body() data: { 
      olderThanDays?: number; 
      keepSuccessful?: boolean; 
      branchId?: string;
    },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationHistoryService.cleanup(
      data.olderThanDays || 90,
      data.keepSuccessful ?? true,
      data.branchId,
      req.user,
    );
  }

  @Get('analytics/trends')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification trends analytics' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'], description: 'Time period for trends' })
  @ApiResponse({ status: 200, description: 'Trends analytics retrieved successfully' })
  async getTrends(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getTrends(
      branchId,
      period as any || 'month',
      req.user,
    );
  }

  @Get('analytics/performance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification performance analytics' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Time period for performance' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved successfully' })
  async getPerformance(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
  ): Promise<any> {
    return this.notificationHistoryService.getPerformance(
      branchId,
      period as any || 'month',
      req.user,
    );
  }
}