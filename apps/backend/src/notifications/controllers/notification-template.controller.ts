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
import { NotificationTemplateService } from '../services/notification-template.service';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../dto/update-notification-template.dto';

@ApiTags('notification-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-templates')
export class NotificationTemplateController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateNotificationTemplateDto,
    @Request() req: any,
  ) {
    // Set branchId based on user's role and permissions
    if (req.user.role === UserRole.ADMIN) {
      // Admin can create templates for any branch
      if (!createDto.branchId) {
        throw new Error('Branch ID is required for admin users');
      }
    } else {
      // Other roles can only create templates for their own branch
      createDto.branchId = req.user.branchId;
    }

    return this.notificationTemplateService.create(createDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAll(
    @Query('branchId') branchId?: string,
    @Request() req?: any,
  ) {
    return this.notificationTemplateService.findAll(req.user, branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a notification template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.notificationTemplateService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationTemplateDto,
    @Request() req: any,
  ) {
    return this.notificationTemplateService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.notificationTemplateService.remove(id, req.user);
    return { message: 'Template deleted successfully' };
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get templates by type' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findByType(
    @Param('type') type: string,
    @Query('branchId') branchId: string,
    @Request() req: any,
  ) {
    return this.notificationTemplateService.findByType(type as any, branchId, req.user);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Toggle template active status' })
  @ApiResponse({ status: 200, description: 'Template status updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    return this.notificationTemplateService.toggleActive(id, req.user);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Duplicate a notification template' })
  @ApiResponse({ status: 201, description: 'Template duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async duplicate(@Param('id') id: string, @Request() req: any) {
    return this.notificationTemplateService.duplicate(id, req.user);
  }

  @Get('types/available')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get available notification types' })
  @ApiResponse({ status: 200, description: 'Available types retrieved successfully' })
  async getAvailableTypes() {
    return {
      types: [
        { value: 'SMS', label: 'SMS' },
        { value: 'WHATSAPP', label: 'WhatsApp' },
        { value: 'EMAIL', label: 'E-posta' },
      ],
    };
  }

  @Get('variables/available')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get available template variables' })
  @ApiResponse({ status: 200, description: 'Available variables retrieved successfully' })
  async getAvailableVariables() {
    return {
      variables: [
        { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
        { key: 'branchName', label: 'Şube Adı', description: 'Şube adı' },
        { key: 'appointmentTime', label: 'Randevu Saati', description: 'Randevu tarihi ve saati' },
        { key: 'serviceName', label: 'Hizmet Adı', description: 'Alınan hizmetin adı' },
        { key: 'packageName', label: 'Paket Adı', description: 'Satın alınan paket adı' },
        { key: 'expiryDate', label: 'Son Kullanma Tarihi', description: 'Paket son kullanma tarihi' },
        { key: 'remainingSessions', label: 'Kalan Seans', description: 'Pakette kalan seans sayısı' },
        { key: 'amount', label: 'Tutar', description: 'Ödeme tutarı' },
        { key: 'dueDate', label: 'Vade Tarihi', description: 'Ödeme vade tarihi' },
      ],
    };
  }
}