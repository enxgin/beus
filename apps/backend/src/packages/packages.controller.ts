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
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';
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
    description: 'Paket adına göre filtreleme',
  })
  @Get()
  findAllPackages(
    @Req() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('name') name?: string
  ) {
    const params: any = {};
    
    if (skip) params.skip = Number(skip);
    if (take) params.take = Number(take);
    
    if (name) {
      params.where = {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      };
    }
    
    // Rol bazlı filtreleme için kullanıcı bilgisi ekle
    params.user = req.user;

    return this.packagesService.findAllPackages(params);
  }

  @ApiOperation({ summary: 'ID\'ye göre paket getir' })
  @ApiResponse({ status: 200, description: 'Paket başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Paket bulunamadı' })
  @ApiParam({ name: 'id', description: 'Paket ID' })
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

  @ApiOperation({ summary: 'Paketteki bir hizmetin miktarını güncelle' })
  @ApiResponse({
    status: 200,
    description: 'Paket hizmet miktarı başarıyla güncellendi',
  })
  @ApiResponse({ status: 404, description: 'Paket veya hizmet bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Paket ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Patch(':id/service')
  updatePackageService(
    @Param('id') id: string,
    @Body() updatePackageServiceDto: UpdatePackageServiceDto,
  ) {
    return this.packagesService.updatePackageService(id, updatePackageServiceDto);
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

  // Müşteri Paketleri API Endpointleri
  @ApiOperation({ summary: 'Müşteriye paket satışı yap' })
  @ApiResponse({ status: 201, description: 'Müşteri paketi başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 404, description: 'Müşteri veya paket bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.RECEPTION,
  )
  @Post('customer')
  createCustomerPackage(@Body() createCustomerPackageDto: CreateCustomerPackageDto) {
    return this.packagesService.createCustomerPackage(createCustomerPackageDto);
  }

  @ApiOperation({ summary: 'Müşteri paketlerini listele' })
  @ApiResponse({ status: 200, description: 'Müşteri paketleri başarıyla listelendi' })
  @ApiQuery({ name: 'skip', required: false, description: 'Atlanacak kayıt sayısı' })
  @ApiQuery({ name: 'take', required: false, description: 'Alınacak kayıt sayısı' })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Müşteriye göre filtreleme',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Sadece aktif paketleri getir',
  })
  @Get('customer')
  findAllCustomerPackages(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('customerId') customerId?: string,
    @Query('active') active?: string,
  ) {
    const params: any = {};

    if (skip) params.skip = Number(skip);
    if (take) params.take = Number(take);
    if (customerId) params.customerId = customerId;
    if (active === 'true') params.active = true;

    return this.packagesService.findAllCustomerPackages(params);
  }

  @ApiOperation({ summary: 'ID\'ye göre müşteri paketi getir' })
  @ApiResponse({ status: 200, description: 'Müşteri paketi başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Müşteri paketi bulunamadı' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Get('customer/:id')
  findCustomerPackageById(@Param('id') id: string) {
    return this.packagesService.findCustomerPackageById(id);
  }

  @ApiOperation({ summary: 'Randevu için paket kullanımı kaydet' })
  @ApiResponse({ status: 200, description: 'Paket kullanımı başarıyla kaydedildi' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek veya yetersiz seans' })
  @ApiResponse({ status: 404, description: 'Paket veya randevu bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.SUPER_BRANCH_MANAGER,
    UserRole.RECEPTION,
  )
  @Post('customer/:id/use')
  usePackageSession(
    @Param('id') id: string,
    @Body() usePackageSessionDto: UsePackageSessionDto,
  ) {
    return this.packagesService.usePackageSession(id, usePackageSessionDto.appointmentId);
  }

  @ApiOperation({ summary: 'Müşteri paketini sil/iptal et' })
  @ApiResponse({ status: 200, description: 'Müşteri paketi başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Müşteri paketi bulunamadı' })
  @ApiResponse({
    status: 400,
    description: 'Paketi silmeden önce kullanım kayıtlarını silmelisiniz',
  })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @ApiParam({ name: 'id', description: 'Müşteri Paketi ID' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete('customer/:id')
  removeCustomerPackage(@Param('id') id: string) {
    return this.packagesService.removeCustomerPackage(id);
  }
}



