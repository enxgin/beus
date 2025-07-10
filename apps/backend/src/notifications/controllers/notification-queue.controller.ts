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
import { NotificationQueueService } from '../services/notification-queue.service';

@ApiTags('notification-queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-queue')
export class NotificationQueueController {
  constructor(
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Add notification to queue' })
  @ApiResponse({ status: 201, description: 'Notification queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: {
      customerId: string;
      type: 'SMS' | 'WHATSAPP' | 'EMAIL';
      content: string;
      scheduledFor?: Date;
      priority?: number;
    },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationQueueService.create(createDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification queue with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'], description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: ['SMS', 'WHATSAPP', 'EMAIL'], description: 'Filter by type' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'customerId', required: false, type: String, description: 'Filter by customer' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Queue retrieved successfully' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as any,
      type: type as any,
      branchId,
      customerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.notificationQueueService.findAll(filters, req.user);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: string,
  ): Promise<any> {
    return this.notificationQueueService.getStats(branchId, period as any, req.user);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get pending notifications' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiResponse({ status: 200, description: 'Pending notifications retrieved successfully' })
  async getPending(
    @Request() req: any,
    @Query('branchId') branchId?: string,
  ): Promise<any> {
    return this.notificationQueueService.getPending(branchId, req.user);
  }

  @Get('failed')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get failed notifications' })
  @ApiQuery({ name: 'branchId', required: false, type: String, description: 'Filter by branch (admin only)' })
  @ApiResponse({ status: 200, description: 'Failed notifications retrieved successfully' })
  async getFailed(
    @Request() req: any,
    @Query('branchId') branchId?: string,
  ): Promise<any> {
    return this.notificationQueueService.getFailed(branchId, req.user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationQueueService.findOne(id, req.user);
  }

  @Patch(':id/retry')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Retry failed notification' })
  @ApiResponse({ status: 200, description: 'Notification retry initiated' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 400, description: 'Notification cannot be retried' })
  async retry(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationQueueService.retry(id, req.user);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Cancel pending notification' })
  @ApiResponse({ status: 200, description: 'Notification cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 400, description: 'Notification cannot be cancelled' })
  async cancel(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationQueueService.cancel(id, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete notification from queue' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<any> {
    await this.notificationQueueService.remove(id, req.user);
    return { message: 'Notification deleted successfully' };
  }

  @Post('bulk-retry')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Retry multiple failed notifications' })
  @ApiResponse({ status: 200, description: 'Bulk retry initiated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkRetry(
    @Body() data: { ids: string[] },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationQueueService.bulkRetry(data.ids, req.user);
  }

  @Post('bulk-cancel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Cancel multiple pending notifications' })
  @ApiResponse({ status: 200, description: 'Bulk cancel completed' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkCancel(
    @Body() data: { ids: string[] },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationQueueService.bulkCancel(data.ids, req.user);
  }

  @Delete('bulk-delete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Bulk delete completed' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkDelete(
    @Body() data: { ids: string[] },
    @Request() req: any,
  ): Promise<any> {
    await this.notificationQueueService.bulkDelete(data.ids, req.user);
    return { message: 'Notifications deleted successfully' };
  }

  @Post('process-queue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Manually trigger queue processing' })
  @ApiResponse({ status: 200, description: 'Queue processing initiated' })
  async processQueue(@Request() req: any): Promise<any> {
    return this.notificationQueueService.processQueue(req.user);
  }

  @Post('clear-old')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Clear old processed notifications' })
  @ApiResponse({ status: 200, description: 'Old notifications cleared' })
  async clearOld(
    @Body() data: { olderThanDays?: number; status?: string[] },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationQueueService.clearOld(
      data.olderThanDays || 30,
      data.status || ['SENT', 'FAILED'],
      req.user,
    );
  }
}