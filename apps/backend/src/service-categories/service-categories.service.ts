import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private prisma: PrismaService) {}

    create(createServiceCategoryDto: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: createServiceCategoryDto,
    });
  }

  findAll() {
    // ServiceCategory is not directly related to a branch.
    // Removed branch-based filtering to align with the current schema.
    return this.prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { id }
    });
  }

  update(id: string, updateServiceCategoryDto: UpdateServiceCategoryDto) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data: updateServiceCategoryDto,
    });
  }

  remove(id: string) {
    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }
}
