import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../prisma/prisma-types';
import { NotificationSettingsService } from '../services/notification-settings.service';
import { CreateNotificationSettingsDto } from '../dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';

@ApiTags('notification-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-settings')
export class NotificationSettingsController {
  constructor(
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create notification settings for a branch' })
  @ApiResponse({ status: 201, description: 'Settings created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDto: CreateNotificationSettingsDto,
    @Request() req: any,
  ): Promise<any> {
    // Set branchId based on user's role and permissions
    if (req.user.role === UserRole.ADMIN) {
      // Admin can create settings for any branch
      if (!createDto.branchId) {
        throw new Error('Branch ID is required for admin users');
      }
    } else {
      // Other roles can only create settings for their own branch
      createDto.branchId = req.user.branchId;
    }

    return this.notificationSettingsService.create(createDto, req.user);
  }

  @Get('branch/:branchId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification settings for a branch' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  async findByBranch(@Param('branchId') branchId: string, @Request() req: any): Promise<any> {
    return this.notificationSettingsService.findByBranch(branchId, req.user);
  }

  @Get('my-branch')
  @Roles(UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification settings for current user branch' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  async findMyBranch(@Request() req: any): Promise<any> {
    return this.notificationSettingsService.findByBranch(req.user.branchId, req.user);
  }

  @Patch('branch/:branchId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update notification settings for a branch' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('branchId') branchId: string,
    @Body() updateDto: UpdateNotificationSettingsDto,
    @Request() req: any,
  ): Promise<any> {
    return this.notificationSettingsService.update(branchId, updateDto, req.user);
  }

  @Delete('branch/:branchId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete notification settings for a branch' })
  @ApiResponse({ status: 200, description: 'Settings deleted successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('branchId') branchId: string, @Request() req: any): Promise<any> {
    await this.notificationSettingsService.remove(branchId, req.user);
    return { message: 'Settings deleted successfully' };
  }

  @Patch('branch/:branchId/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Toggle notification settings active status' })
  @ApiResponse({ status: 200, description: 'Settings status updated successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async toggleActive(@Param('branchId') branchId: string, @Request() req: any): Promise<any> {
    return this.notificationSettingsService.toggleActive(branchId, req.user);
  }

  @Post('branch/:branchId/test-sms')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Test SMS configuration' })
  @ApiResponse({ status: 200, description: 'SMS test completed' })
  @ApiResponse({ status: 400, description: 'SMS configuration invalid' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async testSms(
    @Param('branchId') branchId: string,
    @Body() testData: { phoneNumber: string; message?: string },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationSettingsService.testSmsConfig(
      branchId,
      testData.phoneNumber,
      testData.message || 'Test mesajı',
      req.user,
    );
  }

  @Post('branch/:branchId/test-whatsapp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Test WhatsApp configuration' })
  @ApiResponse({ status: 200, description: 'WhatsApp test completed' })
  @ApiResponse({ status: 400, description: 'WhatsApp configuration invalid' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async testWhatsApp(
    @Param('branchId') branchId: string,
    @Body() testData: { phoneNumber: string; message?: string },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationSettingsService.testWhatsAppConfig(
      branchId,
      testData.phoneNumber,
      testData.message || 'Test mesajı',
      req.user,
    );
  }

  @Post('branch/:branchId/test-email')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Test Email configuration' })
  @ApiResponse({ status: 200, description: 'Email test completed' })
  @ApiResponse({ status: 400, description: 'Email configuration invalid' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async testEmail(
    @Param('branchId') branchId: string,
    @Body() testData: { email: string; subject?: string; message?: string },
    @Request() req: any,
  ): Promise<any> {
    return this.notificationSettingsService.testEmailConfig(
      branchId,
      testData.email,
      testData.subject || 'Test E-postası',
      testData.message || 'Bu bir test e-postasıdır.',
      req.user,
    );
  }

  @Get('providers/sms')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get available SMS providers' })
  @ApiResponse({ status: 200, description: 'SMS providers retrieved successfully' })
  async getSmsProviders(): Promise<any> {
    return {
      providers: [
        {
          value: 'netgsm',
          label: 'NetGSM',
          fields: [
            { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
            { key: 'password', label: 'Şifre', type: 'password', required: true },
            { key: 'header', label: 'Başlık', type: 'text', required: false },
          ],
        },
        {
          value: 'iletimerkezi',
          label: 'İletim Merkezi',
          fields: [
            { key: 'apiKey', label: 'API Anahtarı', type: 'text', required: true },
            { key: 'apiSecret', label: 'API Gizli Anahtarı', type: 'password', required: true },
            { key: 'sender', label: 'Gönderici', type: 'text', required: false },
          ],
        },
        {
          value: 'twilio',
          label: 'Twilio',
          fields: [
            { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
            { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
            { key: 'phoneNumber', label: 'Telefon Numarası', type: 'text', required: true },
          ],
        },
      ],
    };
  }

  @Get('providers/whatsapp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get available WhatsApp providers' })
  @ApiResponse({ status: 200, description: 'WhatsApp providers retrieved successfully' })
  async getWhatsAppProviders(): Promise<any> {
    return {
      providers: [
        {
          value: 'meta',
          label: 'Meta WhatsApp Business',
          fields: [
            { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
            { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
            { key: 'webhookToken', label: 'Webhook Token', type: 'password', required: false },
          ],
        },
        {
          value: 'twilio',
          label: 'Twilio WhatsApp',
          fields: [
            { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
            { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
            { key: 'phoneNumber', label: 'WhatsApp Numarası', type: 'text', required: true },
          ],
        },
      ],
    };
  }

  @Get('providers/email')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get available Email providers' })
  @ApiResponse({ status: 200, description: 'Email providers retrieved successfully' })
  async getEmailProviders(): Promise<any> {
    return {
      providers: [
        {
          value: 'smtp',
          label: 'SMTP',
          fields: [
            { key: 'host', label: 'SMTP Sunucusu', type: 'text', required: true },
            { key: 'port', label: 'Port', type: 'number', required: true, default: 587 },
            { key: 'secure', label: 'Güvenli Bağlantı', type: 'boolean', required: false, default: false },
            { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
            { key: 'password', label: 'Şifre', type: 'password', required: true },
            { key: 'fromEmail', label: 'Gönderen E-posta', type: 'email', required: true },
            { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
          ],
        },
        {
          value: 'gmail',
          label: 'Gmail',
          fields: [
            { key: 'username', label: 'Gmail Adresi', type: 'email', required: true },
            { key: 'password', label: 'Uygulama Şifresi', type: 'password', required: true },
            { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
          ],
        },
        {
          value: 'sendgrid',
          label: 'SendGrid',
          fields: [
            { key: 'apiKey', label: 'API Anahtarı', type: 'password', required: true },
            { key: 'fromEmail', label: 'Gönderen E-posta', type: 'email', required: true },
            { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
          ],
        },
      ],
    };
  }
}