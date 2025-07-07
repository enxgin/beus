import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionRulesModule } from '../commission-rules/commission-rules.module';

@Module({
  imports: [
    PrismaModule, 
    CommissionRulesModule,
    forwardRef(() => require('../invoices/invoices.module').InvoicesModule)
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
