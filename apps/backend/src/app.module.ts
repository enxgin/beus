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
import { InvoicesModule } from './invoices/invoices.module';
import { TagsModule } from './tags/tags.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
