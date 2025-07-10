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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../prisma/prisma-types';
import { NotificationTriggerService } from '../services/notification-trigger.service';
import { CreateNotificationTriggerDto } from '../dto/create-notification-trigger.dto';
import { UpdateNotificationTriggerDto } from '../dto/update-notification-trigger.dto';

@ApiTags('notification-triggers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-triggers')
export class NotificationTriggerController {
  constructor(
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create a new notification trigger' })
  @ApiResponse({ status: 201, description: 'Trigger created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateNotificationTriggerDto,
    @Request() req: any,
  ): Promise<any> {
    // Set branchId based on user's role and permissions
    if (req.user.role === UserRole.ADMIN) {
      // Admin can create triggers for any branch
      if (!createDto.branchId) {
        throw new Error('Branch ID is required for admin users');
      }
    } else {
      // Other roles can only create triggers for their own branch
      createDto.branchId = req.user.branchId;
    }

    return this.notificationTriggerService.create(createDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all notification triggers' })
  @ApiResponse({ status: 200, description: 'Triggers retrieved successfully' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Request() req?: any,
  ): Promise<any> {
    return this.notificationTriggerService.findAll(req.user, branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a notification trigger by ID' })
  @ApiResponse({ status: 200, description: 'Trigger retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trigger not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationTriggerService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update a notification trigger' })
  @ApiResponse({ status: 200, description: 'Trigger updated successfully' })
  @ApiResponse({ status: 404, description: 'Trigger not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationTriggerDto,
    @Request() req: any,
  ): Promise<any> {
    return this.notificationTriggerService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete a notification trigger' })
  @ApiResponse({ status: 200, description: 'Trigger deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trigger not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<any> {
    await this.notificationTriggerService.remove(id, req.user);
    return { message: 'Trigger deleted successfully' };
  }

  @Get('event-type/:eventType')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get triggers by event type' })
  @ApiResponse({ status: 200, description: 'Triggers retrieved successfully' })
  async findByEventType(
    @Param('eventType') eventType: string,
    @Query('branchId') branchId: string,
    @Request() req: any,
  ): Promise<any> {
    return this.notificationTriggerService.findByEventType(eventType as any, branchId, req.user);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Toggle trigger active status' })
  @ApiResponse({ status: 200, description: 'Trigger status updated successfully' })
  @ApiResponse({ status: 404, description: 'Trigger not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async toggleActive(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationTriggerService.toggleActive(id, req.user);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Duplicate a notification trigger' })
  @ApiResponse({ status: 201, description: 'Trigger duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Trigger not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async duplicate(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.notificationTriggerService.duplicate(id, req.user);
  }

  @Get('branch/:branchId/active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get active triggers for a branch' })
  @ApiResponse({ status: 200, description: 'Active triggers retrieved successfully' })
  async findActiveByBranch(@Param('branchId') branchId: string): Promise<any> {
    return this.notificationTriggerService.findActiveByBranch(branchId);
  }

  @Get('event-types/available')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get available event types' })
  @ApiResponse({ status: 200, description: 'Available event types retrieved successfully' })
  async getAvailableEventTypes(): Promise<any> {
    return {
      eventTypes: [
        { value: 'APPOINTMENT_REMINDER', label: 'Randevu Hatırlatması' },
        { value: 'APPOINTMENT_CONFIRMATION', label: 'Randevu Onayı' },
        { value: 'BIRTHDAY', label: 'Doğum Günü' },
        { value: 'PACKAGE_EXPIRY', label: 'Paket Süresi Dolumu' },
        { value: 'PAYMENT_REMINDER', label: 'Ödeme Hatırlatması' },
        { value: 'WELCOME_MESSAGE', label: 'Hoş Geldin Mesajı' },
        { value: 'CUSTOM', label: 'Özel' },
      ],
    };
  }

  @Get('conditions/template/:eventType')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get condition template for event type' })
  @ApiResponse({ status: 200, description: 'Condition template retrieved successfully' })
  async getConditionTemplate(@Param('eventType') eventType: string): Promise<any> {
    const templates = {
      APPOINTMENT_REMINDER: {
        reminderHours: {
          type: 'number',
          label: 'Kaç saat önceden hatırlat',
          default: 24,
          min: 1,
          max: 168, // 7 days
        },
      },
      BIRTHDAY: {
        sendTime: {
          type: 'time',
          label: 'Gönderim saati',
          default: '09:00',
        },
      },
      PACKAGE_EXPIRY: {
        expiryDays: {
          type: 'number',
          label: 'Kaç gün önceden uyar',
          default: 7,
          min: 1,
          max: 30,
        },
      },
      PAYMENT_REMINDER: {
        reminderDays: {
          type: 'number',
          label: 'Kaç gün önceden hatırlat',
          default: 3,
          min: 1,
          max: 30,
        },
      },
      WELCOME_MESSAGE: {
        delayMinutes: {
          type: 'number',
          label: 'Kaç dakika sonra gönder',
          default: 5,
          min: 0,
          max: 1440, // 24 hours
        },
      },
      CUSTOM: {
        schedule: {
          type: 'cron',
          label: 'Cron ifadesi',
          default: '0 9 * * *', // Daily at 9 AM
        },
      },
    };

    return {
      template: templates[eventType] || {},
    };
  }
}