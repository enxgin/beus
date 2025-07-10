import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Yeni bir kullanıcı oluştur' })
  @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla oluşturuldu.' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi.' })
  create(@Body() createUserDto: CreateUserDto, @Req() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Kullanıcı istatistiklerini getir' })
  @ApiResponse({ status: 200, description: 'İstatistikler başarıyla getirildi.' })
  getStatistics(@Req() req, @Query() query: any) {
    return this.usersService.getStatistics(req.user, query);
  }

  @Get('with-performance')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Performans verileri ile kullanıcıları listele' })
  @ApiResponse({ status: 200, description: 'Kullanıcılar performans verileri ile listelendi.' })
  findAllWithPerformance(@Req() req, @Query() query: any) {
    return this.usersService.findAllWithPerformance(req.user, query);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Tüm kullanıcıları listele' })
  @ApiResponse({ status: 200, description: 'Kullanıcılar başarıyla listelendi.' })
  findAll(@Req() req) {
    return this.usersService.findAll(req.user);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Tek bir kullanıcıyı getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla bulundu.' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı.' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Bir kullanıcıyı güncelle' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla güncellendi.' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Get(':id/performance')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Kullanıcının performans verilerini getir' })
  @ApiResponse({ status: 200, description: 'Performans verileri başarıyla getirildi.' })
  getUserPerformance(@Param('id') id: string, @Req() req, @Query() query: any) {
    return this.usersService.getUserPerformance(id, req.user, query);
  }

  @Get(':id/activities')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Kullanıcının aktivite geçmişini getir' })
  @ApiResponse({ status: 200, description: 'Aktivite geçmişi başarıyla getirildi.' })
  getUserActivities(@Param('id') id: string, @Req() req, @Query('limit') limit?: string) {
    return this.usersService.getUserActivities(id, req.user, limit ? parseInt(limit) : 20);
  }

  @Get(':id/financial')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION,
    UserRole.STAFF
  )
  @ApiOperation({ summary: 'Kullanıcının mali bilgilerini getir' })
  @ApiResponse({ status: 200, description: 'Mali bilgiler başarıyla getirildi.' })
  getUserFinancial(@Param('id') id: string, @Req() req, @Query() query: any) {
    return this.usersService.getUserFinancial(id, req.user, query);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Bir kullanıcıyı sil' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla silindi.' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı.' })
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user);
  }
}
