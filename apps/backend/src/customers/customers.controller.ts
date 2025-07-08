import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Veritabanını rastgele müşterilerle doldurur (test için)' })
  seedCustomers() {
    return this.customersService.seedCustomers();
  }

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
    return this.customersService.findAllForUser(user, branchId);
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirtilen ID ile tek bir müşteriyi getirir' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/packages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bir müşterinin sahip olduğu paketleri getirir (henüz aktif değil)' })
  getCustomerPackages(@Param('id') id: string) {
    return this.customersService.getCustomerPackages(id);
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
