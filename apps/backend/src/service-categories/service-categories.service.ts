import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceCategoryDto: CreateServiceCategoryDto, userRole?: string, userBranchId?: string) {
    console.log('🔍 ServiceCategoriesService.create() çağrıldı');
    console.log('📝 Gelen DTO:', JSON.stringify(createServiceCategoryDto, null, 2));
    console.log('👤 Kullanıcı rolü:', userRole);
    console.log('🏢 Kullanıcı şube ID:', userBranchId);
    
    try {
      // Rol tabanlı yetkilendirme ve şube ataması
      const data: any = {
        name: createServiceCategoryDto.name,
        description: createServiceCategoryDto.description,
        isActive: createServiceCategoryDto.isActive ?? true,
      };

      // Şube ataması mantığı
      if (userRole === 'ADMIN') {
        // Admin: İstediği şubeye atayabilir veya genel kategori oluşturabilir
        if (createServiceCategoryDto.branchId) {
          data.branchId = createServiceCategoryDto.branchId;
        }
        // branchId null ise genel kategori (tüm şubeler)
      } else if (userRole === 'SUPER_BRANCH_MANAGER') {
        // Süper şube yöneticisi: Bağlı olduğu şubelere atayabilir
        // TODO: Kullanıcının bağlı olduğu şubeleri kontrol et
        if (createServiceCategoryDto.branchId) {
          data.branchId = createServiceCategoryDto.branchId;
        } else if (userBranchId) {
          data.branchId = userBranchId;
        }
      } else if (['BRANCH_MANAGER', 'RECEPTION', 'STAFF'].includes(userRole)) {
        // Şube yöneticisi, resepsiyon, personel: Sadece kendi şubesi
        if (!userBranchId) {
          throw new ForbiddenException('Kullanıcının şube bilgisi bulunamadı');
        }
        data.branchId = userBranchId;
      }

      console.log('💾 Veritabanına kaydedilecek veri:', JSON.stringify(data, null, 2));

      return await this.prisma.serviceCategory.create({
        data,
        include: {
          branch: true,
        },
      });
    } catch (error) {
      console.error('❌ ServiceCategory oluşturma hatası:', error);
      throw error;
    }
  }

  async findAll(userRole?: string, userBranchId?: string) {
    console.log('🔍 ServiceCategoriesService.findAll() çağrıldı');
    console.log('👤 Kullanıcı rolü:', userRole);
    console.log('🏢 Kullanıcı şube ID:', userBranchId);

    try {
      let whereClause: any = {};

      // Rol tabanlı filtreleme
      if (userRole === 'ADMIN') {
        // Admin: Tüm kategorileri görebilir
        // whereClause boş kalır
      } else if (userRole === 'SUPER_BRANCH_MANAGER') {
        // Süper şube yöneticisi: Bağlı olduğu şubelere ait kategoriler + genel kategoriler
        // TODO: Kullanıcının bağlı olduğu şubeleri al
        whereClause = {
          OR: [
            { branchId: null }, // Genel kategoriler
            { branchId: userBranchId }, // Kendi şubesi
          ],
        };
      } else if (['BRANCH_MANAGER', 'RECEPTION', 'STAFF'].includes(userRole)) {
        // Şube yöneticisi, resepsiyon, personel: Sadece kendi şubesi + genel kategoriler
        whereClause = {
          OR: [
            { branchId: null }, // Genel kategoriler
            { branchId: userBranchId }, // Kendi şubesi
          ],
        };
      }

      console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

      return await this.prisma.serviceCategory.findMany({
        where: whereClause,
        include: {
          branch: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('❌ ServiceCategory listeleme hatası:', error);
      throw error;
    }
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
