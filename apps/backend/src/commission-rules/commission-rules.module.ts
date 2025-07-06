import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionRulesController } from './commission-rules.controller';
import { CommissionRulesService } from './commission-rules.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionRulesController],
  providers: [CommissionRulesService],
  exports: [CommissionRulesService],
})
export class CommissionRulesModule {}
