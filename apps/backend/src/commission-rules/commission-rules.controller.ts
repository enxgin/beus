import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommissionRulesService } from './commission-rules.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('commission-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_BRANCH_MANAGER, UserRole.BRANCH_MANAGER)
export class CommissionRulesController {
  constructor(private readonly commissionRulesService: CommissionRulesService) {}

  @Post('/global')
  createGlobalRule(@Body() createCommissionRuleDto: CreateCommissionRuleDto) {
    return this.commissionRulesService.createGlobalRule(createCommissionRuleDto);
  }

  @Post('/service')
  createServiceRule(@Body() createCommissionRuleDto: CreateCommissionRuleDto) {
    return this.commissionRulesService.createServiceRule(createCommissionRuleDto);
  }

  @Post('/user')
  createUserRule(@Body() createCommissionRuleDto: CreateCommissionRuleDto) {
    return this.commissionRulesService.createUserRule(createCommissionRuleDto);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('isGlobal') isGlobal?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params: any = {};
    
    if (userId) params.userId = userId;
    if (serviceId) params.serviceId = serviceId;
    if (isGlobal === 'true') params.isGlobal = true;
    
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    
    return this.commissionRulesService.findAll(params, pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commissionRulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommissionRuleDto: Partial<CreateCommissionRuleDto>,
  ) {
    return this.commissionRulesService.update(id, updateCommissionRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commissionRulesService.remove(id);
  }
}
