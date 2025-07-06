import { Module } from '@nestjs/common';
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
import { TagsModule } from './tags/tags.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { StaffModule } from './staff/staff.module';
import { DashboardModule } from './dashboard/dashboard.module';

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
    BranchesModule,
    CustomersModule,
    ServicesModule,
    AppointmentsModule,
    PackagesModule,
    InvoicesModule,
    TagsModule,
    ServiceCategoriesModule,
    StaffModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
