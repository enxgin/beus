import { Module, forwardRef } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => InvoicesModule), // Fatura modülü ile döngüsel bağımlılığı önlemek için
  ],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
