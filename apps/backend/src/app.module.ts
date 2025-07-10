import { Module } from '@nestjs/common';
import { DebugModule } from './debug/debug.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PackagesModule } from './packages/packages.module';
import * as path from 'path';
import { InvoicesModule } from './invoices/invoices.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { StaffModule } from './staff/staff.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FinanceModule } from './finance/finance.module';
import { TagsModule } from './tags/tags.module';
import { CommissionRulesModule } from './commission-rules/commission-rules.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(__dirname, '..', '.env'),
    }),
    // Prisma module for database access
    PrismaModule,
    // Core business modules
    AuthModule,
    UsersModule,
    DebugModule,
    BranchesModule,
    CustomersModule,
    ServicesModule,
    AppointmentsModule,
    PackagesModule,
    InvoicesModule,
    ServiceCategoriesModule,
    StaffModule,
    DashboardModule,
    FinanceModule,
    TagsModule,
    CommissionRulesModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
