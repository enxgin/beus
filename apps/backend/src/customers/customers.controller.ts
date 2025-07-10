import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni bir müşteri oluşturur' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm müşterileri listeler (Rol bazlı yetkilendirme ile)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Şube IDsi ile filtrele (Sadece Admin ve Üst Düzey Yöneticiler için)' })
  findAll(@Req() req, @Query('branchId') branchId?: string) {
    const user = req.user as any; // JWT'den gelen kullanıcı bilgisi
    return this.customersService.findAll(user, branchId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşteri istatistiklerini getirir' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Şube IDsi ile filtrele (Sadece Admin ve Üst Düzey Yöneticiler için)' })
  getStats(@Req() req, @Query('branchId') branchId?: string) {
    const user = req.user as any;
    return this.customersService.getCustomerStats(user, branchId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Genişletilmiş müşteri verilerini getirir (analytics ile)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Şube IDsi ile filtrele' })
  @ApiQuery({ name: 'tagIds', required: false, description: 'Tag IDleri ile filtrele (virgülle ayrılmış)' })
  getAnalytics(@Req() req, @Query('branchId') branchId?: string, @Query('tagIds') tagIds?: string) {
    const user = req.user as any;
    const tagIdArray = tagIds ? tagIds.split(',').filter(id => id.trim()) : undefined;
    return this.customersService.findAllWithAnalytics(user, branchId, tagIdArray);
  }

  @Get('tags/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tag istatistiklerini getirir' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Şube IDsi ile filtrele' })
  getTagStats(@Req() req, @Query('branchId') branchId?: string) {
    const user = req.user as any;
    return this.customersService.getTagStats(user, branchId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşterileri isme göre arar' })
  @ApiQuery({ name: 'name', required: true, type: String })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  search(@Query('name') name: string, @Query('branchId') branchId: string) {
    return this.customersService.search(name, branchId);
  }

  @Get('search/advanced')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşterileri isim, telefon ve email ile arar' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  searchAdvanced(@Query('query') query: string, @Query('branchId') branchId: string) {
    return this.customersService.searchAdvanced(query, branchId);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirtilen müşteri için detaylı analytics verileri getirir' })
  getCustomerAnalytics(@Param('id') id: string) {
    return this.customersService.getCustomerAnalytics(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirtilen ID ile tek bir müşteriyi getirir' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirtilen ID ile bir müşteriyi günceller' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirtilen ID ile bir müşteriyi siler' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
