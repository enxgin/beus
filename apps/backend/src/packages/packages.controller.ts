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
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateCustomerPackageDto } from './dto/create-customer-package.dto';
import { UsePackageSessionDto } from './dto/use-package-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  // Paket Tanımlamaları API Endpointleri
  @ApiOperation({ summary: 'Yeni bir paket tanımlaması oluştur' })
  @ApiResponse({ status: 201, description: 'Paket başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Post()
  createPackage(@Body() createPackageDto: CreatePackageDto, @Req() req) {
    return this.packagesService.createPackage(createPackageDto, req.user);
  }

  @ApiOperation({ summary: 'Tüm paketleri listele' })
  @ApiResponse({ status: 200, description: 'Paketler başarıyla listelendi' })
  @ApiQuery({ name: 'skip', required: false, description: 'Atlanacak kayıt sayısı' })
  @ApiQuery({ name: 'take', required: false, description: 'Alınacak kayıt sayısı' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Paket adına göre arama',
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get()
  findAllPackages(@Query() query: any) {
    const { skip, take, ...where } = query;
    return this.packagesService.findAllPackages({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where,
    });
  }

  // Müşteri Paketleri API Endpointleri
  @ApiOperation({ summary: 'Müşteriye yeni bir paket satışı yap' })
  @ApiResponse({ status: 201, description: 'Müşteri paketi başarıyla oluşturuldu' })
  @ApiResponse({ status: 404, description: 'Müşteri veya paket bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  @Post('customer-package')
  createCustomerPackage(
    @Body() createCustomerPackageDto: CreateCustomerPackageDto,
  ) {
    return this.packagesService.createCustomerPackage(createCustomerPackageDto);
  }

  @ApiOperation({ summary: 'Tüm müşteri paketlerini listele' })
  @ApiResponse({ status: 200, description: 'Müşteri paketleri başarıyla listelendi' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Müşteri ID sine göre filtrele' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get('customer-package')
  findAllCustomerPackages(@Query() query: any) {
    const { skip, take, ...where } = query;
    return this.packagesService.findAllCustomerPackages({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where,
    });
  }

  @ApiOperation({ summary: 'ID ile tek bir müşteri paketini getir' })
  @ApiResponse({ status: 200, description: 'Müşteri paketi bulundu' })
  @ApiResponse({ status: 404, description: 'Müşteri paketi bulunamadı' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get('customer-package/:id')
  findCustomerPackageById(@Param('id') id: string) {
    return this.packagesService.findCustomerPackageById(id);
  }

  @ApiOperation({ summary: 'Müşteri paketinden bir seans kullan' })
  @ApiResponse({ status: 200, description: 'Seans başarıyla kullanıldı' })
  @ApiResponse({ status: 404, description: 'Müşteri paketi bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya seans kalmamış' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  @Post(':id/use-session')
  usePackageForAppointment(
    @Param('id') id: string,
    @Body() usePackageSessionDto: UsePackageSessionDto,
  ) {
    return this.packagesService.usePackageForAppointment(id, usePackageSessionDto.appointmentId);
  }

  @ApiOperation({ summary: 'Müşteri paketini sil' })
  @ApiResponse({ status: 200, description: 'Müşteri paketi başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Müşteri paketi bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete('customer-package/:id')
  removeCustomerPackage(@Param('id') id: string) {
    return this.packagesService.removeCustomerPackage(id);
  }

  // Paket Tanımlamaları (Devam)
  @ApiOperation({ summary: 'ID ile tek bir paket tanımlamasını getir' })
  @ApiResponse({ status: 200, description: 'Paket bulundu' })
  @ApiResponse({ status: 404, description: 'Paket bulunamadı' })
  @ApiParam({ name: 'id', description: 'Paket ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get(':id')
  findPackageById(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @ApiOperation({ summary: 'Paket bilgilerini güncelle' })
  @ApiResponse({ status: 200, description: 'Paket başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Paket bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Paket ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.STAFF)
  @Patch(':id')
  updatePackage(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.updatePackage(id, updatePackageDto);
  }

  @ApiOperation({ summary: 'Paket tanımlamasını sil' })
  @ApiResponse({ status: 200, description: 'Paket başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Paket bulunamadı' })
  @ApiResponse({
    status: 400,
    description: 'Paketi silmeden önce bağlı müşteri paketlerini silmelisiniz',
  })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Paket ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete(':id')
  removePackage(@Param('id') id: string) {
    return this.packagesService.removePackage(id);
  }
}
