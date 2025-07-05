import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma-types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createBranchDto: any) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get all branches' })
  @ApiResponse({ status: 200, description: 'Return all branches.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(
    @Req() req: any, // Express request object'ini almak için
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.branchesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      user: req.user, // JWT'den decode edilen kullanıcı bilgisini service'e gönder
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get a branch by id' })
  @ApiResponse({ status: 200, description: 'Return the branch.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiParam({ name: 'id', type: 'string' })
  update(@Param('id') id: string, @Body() updateBranchDto: any) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
