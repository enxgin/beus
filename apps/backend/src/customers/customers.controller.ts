import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni müşteri oluştur' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  async create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    // Kullanıcı bilgilerini al ve detaylı log ekleyelim
    const user = req.user;
    
    console.log('DEBUG - Kullanıcı kimliği:', JSON.stringify(user, null, 2));
    console.log('DEBUG - Branch bilgisi:', user?.branch);
    console.log('DEBUG - JWT içindeki bilgiler:', user);
    
    // Eğer createCustomerDto içinde branchId yoksa ve kullanıcının şubesi varsa
    // otomatik olarak kullanıcının şubesini ata
    if (!createCustomerDto.branchId && user?.branch?.id) {
      createCustomerDto.branchId = user.branch.id;
      console.log(`Müşteriye otomatik şube atanıyor: ${user.branch.id}`);
    } else {
      console.log("Müşteriye şube atanamadı veya zaten bir şube ID'si var", { 
        kullanıcı: user?.email,
        branchNesnesi: user?.branch,
        branchId: user?.branchId,
        userBranchId: user?.branch?.id,
        dtoHasBranchId: !!createCustomerDto.branchId
      });
    }
    
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm müşterileri listele (şubeye göre filtrelenebilir)' })
  findAll(
    @Request() req,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('branchId') branchId?: string
  ) {
    // Kullanıcı bilgilerini al
    const user = req.user;
    const userRole = user?.role;
    const userBranchId = user?.branch?.id;
    
    // Admin ve super_branch_manager tüm müşterileri görebilir (isteğe bağlı filtre ile)
    // Diğer kullanıcılar sadece kendi şubelerinin müşterilerini görebilir
    let whereCondition = {};
    
    if (userRole === 'admin' || userRole === 'super_branch_manager') {
      // Admin ve super_branch_manager için, eğer branchId belirtilmişse filtreleme yap
      if (branchId) {
        whereCondition = { branchId };
      }
    } else {
      // Diğer kullanıcılar sadece kendi şubelerindeki müşterileri görebilir
      if (!userBranchId) {
        return { customers: [], totalCount: 0 }; // Kullanıcının şube bilgisi yoksa boş liste dön
      }
      whereCondition = { branchId: userBranchId };
    }
    
    console.log('Müşteri listeleme filtreleri:', { userRole, userBranchId, whereCondition });
    
    return this.customersService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      where: whereCondition,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile müşteri bilgisi getir' })
  @ApiResponse({ status: 200, description: 'Müşteri bulundu' })
  @ApiResponse({ status: 404, description: 'Müşteri bulunamadı' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Telefon numarası ile müşteri getir' })
  @ApiResponse({ status: 200, description: 'Müşteri bulundu' })
  @ApiResponse({ status: 404, description: 'Müşteri bulunamadı' })
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Müşteri bilgilerini güncelle' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Müşteriyi sil' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

