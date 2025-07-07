import { Module } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesCompatController } from './service-categories-compat.controller';

@Module({
  controllers: [ServiceCategoriesController, ServiceCategoriesCompatController],
  providers: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
