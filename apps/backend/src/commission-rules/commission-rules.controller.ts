import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommissionRulesService } from './commission-rules.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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
  findAll(
    @Query('userId') userId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('isGlobal') isGlobal?: string,
  ) {
    const params: any = {};
    
    if (userId) params.userId = userId;
    if (serviceId) params.serviceId = serviceId;
    if (isGlobal === 'true') params.isGlobal = true;
    
    return this.commissionRulesService.findAll(params);
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
