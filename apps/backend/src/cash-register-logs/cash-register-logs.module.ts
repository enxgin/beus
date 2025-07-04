import { Module } from '@nestjs/common';
import { CashRegisterLogsService } from './cash-register-logs.service';
import { CashRegisterLogsController } from './cash-register-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashRegisterLogsController],
  providers: [CashRegisterLogsService],
  exports: [CashRegisterLogsService],
})
export class CashRegisterLogsModule {}
