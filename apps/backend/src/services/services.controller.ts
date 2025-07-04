import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Hizmet endpoint'leri
  @ApiOperation({ summary: 'Yeni bir hizmet oluştur' })
  @ApiResponse({ status: 201, description: 'Hizmet başarıyla oluşturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme hatası' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @ApiOperation({ summary: 'Tüm hizmetleri listele' })
  @ApiResponse({ status: 200, description: 'Hizmetler başarıyla listelendi' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'orderBy', required: false, example: '{"name":"asc"}' })
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('orderBy') orderByString?: string,
  ) {
    let orderBy = undefined;
    try {
      if (orderByString) {
        orderBy = JSON.parse(orderByString);
      }
    } catch (error) {
      orderBy = undefined;
    }

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (categoryId) where.categoryId = categoryId;

    return this.servicesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy,
    });
  }

  @ApiOperation({ summary: 'ID\'ye göre bir hizmet getir' })
  @ApiResponse({ status: 200, description: 'Hizmet başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Hizmet bulunamadı' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Bir hizmeti güncelle' })
  @ApiResponse({ status: 200, description: 'Hizmet başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Hizmet bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @ApiOperation({ summary: 'Bir hizmeti sil' })
  @ApiResponse({ status: 200, description: 'Hizmet başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Hizmet bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  // Kategori endpoint'leri
  @ApiOperation({ summary: 'Yeni bir hizmet kategorisi oluştur' })
  @ApiResponse({ status: 201, description: 'Kategori başarıyla oluşturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme hatası' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Post('categories')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.servicesService.createCategory(createCategoryDto);
  }

  @ApiOperation({ summary: 'Tüm hizmet kategorilerini listele' })
  @ApiResponse({ status: 200, description: 'Kategoriler başarıyla listelendi' })
  @Get('categories')
  async findAllCategories() {
    return this.servicesService.findAllCategories();
  }

  @ApiOperation({ summary: 'ID\'ye göre bir kategori getir' })
  @ApiResponse({ status: 200, description: 'Kategori başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.servicesService.findCategoryById(id);
  }

  @ApiOperation({ summary: 'Bir kategoriyi güncelle' })
  @ApiResponse({ status: 200, description: 'Kategori başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.servicesService.updateCategory(id, updateCategoryDto);
  }

  @ApiOperation({ summary: 'Bir kategoriyi sil' })
  @ApiResponse({ status: 200, description: 'Kategori başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  @ApiResponse({ status: 403, description: 'Erişim reddedildi' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    return this.servicesService.removeCategory(id);
  }
}

