import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';

@ApiTags('tags')
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni etiket oluştur' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm etiketleri listele' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'İsim ile etiket bilgisi getir' })
  @ApiResponse({ status: 200, description: 'Etiket bulundu' })
  @ApiResponse({ status: 404, description: 'Etiket bulunamadı' })
  findByName(@Param('name') name: string) {
    return this.tagsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile etiket bilgisi getir' })
  @ApiResponse({ status: 200, description: 'Etiket bulundu' })
  @ApiResponse({ status: 404, description: 'Etiket bulunamadı' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Etiket bilgilerini güncelle' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.RECEPTION)
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Etiketi sil' })
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}

