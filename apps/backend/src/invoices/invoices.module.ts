import { Module, forwardRef } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CashRegisterLogsModule } from '../cash-register-logs/cash-register-logs.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';

@Module({
  imports: [
    PrismaModule, 
    CashRegisterLogsModule, 
    forwardRef(() => CommissionsModule),
    forwardRef(() => CashRegisterModule)
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
