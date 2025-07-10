import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';

/**
 * Bu controller, eski '/service-categories' endpoint'ini desteklemek için oluşturulmuştur.
 * Frontend'deki mevcut isteklerin çalışmaya devam etmesini sağlar.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-categories')
export class ServiceCategoriesCompatController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  create(@Body() createServiceCategoryDto: CreateServiceCategoryDto, @Req() req: any) {
    const user = req.user;
    return this.serviceCategoriesService.create(
      createServiceCategoryDto,
      user?.role,
      user?.branchId
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER, UserRole.RECEPTION, UserRole.STAFF)
  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    return await this.serviceCategoriesService.findAll(
      user?.role,
      user?.branchId
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  update(@Param('id') id: string, @Body() updateServiceCategoryDto: UpdateServiceCategoryDto) {
    return this.serviceCategoriesService.update(id, updateServiceCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  remove(@Param('id') id: string) {
    return this.serviceCategoriesService.remove(id);
  }
}
