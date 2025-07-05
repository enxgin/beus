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

  findAll(params: {
    user?: any;
    branchId?: string;
  }) {
    const { user, branchId } = params;
    
    // Rol bazlı erişim filtreleme
    let roleBasedFilter = {};
    
    if (user) {
      // Kullanıcının rolüne göre filtreleme
      switch(user.role) {
        case 'ADMIN':
          // Admin tüm kategorileri görür, filtre yok
          break;
          
        case 'SUPER_BRANCH_MANAGER':
          // Şube yöneticisi bağlı olduğu tüm şubelerin kategorilerini görür
          if (user.branch && user.branch.id) {
            const managedBranchIds = user.managedBranches?.map(branch => branch.id) || [];
            roleBasedFilter = {
              OR: [
                { branchId: user.branch.id },
                { branchId: { in: managedBranchIds } },
                { branchId: null } // Şubesi olmayan (genel) kategoriler
              ]
            };
          }
          break;
          
        case 'BRANCH_MANAGER':
        case 'RECEPTION':
        case 'STAFF':
          // Bu roller sadece kendi şubelerine ait kategorileri görür
          if (user.branch && user.branch.id) {
            roleBasedFilter = { 
              OR: [
                { branchId: user.branch.id },
                { branchId: null } // Şubesi olmayan (genel) kategoriler
              ]
            };
          }
          break;
          
        default:
          // Diğer roller hiçbir kategori görmez - boş sonuc döner
          roleBasedFilter = { id: 'no-access' }; // Hiçbir kategori eşleşmeyecek
      }
      
      console.log(`Rol bazlı kategori filtreleme uygulanıyor: ${user.role}`, roleBasedFilter);
    }
    
    // Eğer manuel bir branchId belirtilmişse ve kullanıcı ADMIN ise, bu filtreyi kullan
    const branchFilter = (branchId && user?.role === 'ADMIN') ? { branchId } : {};

    return this.prisma.serviceCategory.findMany({
      where: { 
        AND: [
          roleBasedFilter, 
          branchFilter
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        branch: true
      }
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
