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

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Bir kullanıcıyı sil' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla silindi.' })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı.' })
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user);
  }
}
