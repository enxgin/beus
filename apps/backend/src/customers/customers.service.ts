import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private tagsService: TagsService
  ) {}

  // Yeni bir müşteri oluştur
  async create(createCustomerDto: CreateCustomerDto) {
    try {
      console.log('Müşteri oluşturma işlemi başlıyor:', JSON.stringify(createCustomerDto, null, 2));
      
      // Eğer branchId yoksa hata fırlat (Şube zorunlu bir alan)
      if (!createCustomerDto.branchId) {
        console.error("HATA: Müşteri oluşturmak için şube ID'si eksik!");
        throw new Error("Müşteri oluşturmak için şube ID'si gereklidir.");
      }

      // Şube ID'sinin geçerli olduğunu kontrol et
      const branch = await this.prisma.branch.findUnique({
        where: { id: createCustomerDto.branchId }
      });

      if (!branch) {
        console.error(`HATA: ${createCustomerDto.branchId} ID'li şube bulunamadı!`);
        throw new Error(`Belirtilen ID ile şube bulunamadı: ${createCustomerDto.branchId}`);
      }

      // Etiketleri ayır
      const { tags, ...customerData } = createCustomerDto;
      
      // Müşteri veri nesnesini oluştur
      const customerCreateData = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        notes: customerData.notes,
        discountRate: customerData.discountRate ?? 0,
        creditBalance: customerData.creditBalance ?? 0,
        branchId: customerData.branchId
      };

      console.log('Prisma create için hazırlanan veri:', JSON.stringify(customerCreateData, null, 2));

      // Müşteriyi oluştur
      const customer = await this.prisma.customer.create({
        data: customerCreateData,
      });
      
      console.log('Müşteri oluşturuldu:', JSON.stringify(customer, null, 2));
      
      // Eğer etiketler varsa, onları işle
      if (tags && Array.isArray(tags) && tags.length > 0) {
        console.log('Etiketler işleniyor:', tags);
        await this.handleCustomerTags(customer.id, tags);
      } else {
        console.log('Etiket yok veya geçersiz format');
      }
      
      // Müşteri detaylarını getir
      const result = await this.findOne(customer.id);
      return result;
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      throw error;
    }
  }

  // Tüm müşterileri getir (sayfalama desteği ile)
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    try {
      const { skip, take, where, orderBy } = params;
      
      // Önce müşterileri getirelim
      const customers = await this.prisma.customer.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          branch: true
        }
      });
      
      // Her müşteri için etiketleri getirelim
      const customersWithTags = await Promise.all(
        customers.map(async (customer) => {
          try {
            console.log(`Müşteri ID ${customer.id} için etiketler getiriliyor...`);
            const tags = await this.prisma.$queryRaw<any[]>`
              SELECT t.* FROM "Tag" t
              JOIN "CustomerTag" ct ON t.id = ct."tagId"
              WHERE ct."customerId" = ${customer.id}
              ORDER BY t.name ASC
            `;
            console.log(`Müşteri ID ${customer.id} için bulunan etiketler:`, tags);
            return { ...customer, tags: tags || [] };
          } catch (error) {
            console.error(`Müşteri ID ${customer.id} için etiket getirme hatası:`, error);
            return { ...customer, tags: [] };
          }
        })
      );
      
      return customersWithTags;
    } catch (error) {
      console.error('Müşteri listesi getirme hatası:', error);
      throw error;
    }
  }

  // ID ile belirli bir müşteriyi getir
  async findOne(id: string) {
    // Müşteri bilgilerini getir
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
        customerPackages: {
          include: { package: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ID ${id}`);
    }

    // Etiketleri ayrı bir sorgu ile al
    try {
      console.log(`Müşteri ID ${id} için etiketler getiriliyor...`);
      const tags = await this.prisma.$queryRaw<any[]>`
        SELECT t.* 
        FROM "Tag" t
        JOIN "CustomerTag" ct ON t.id = ct."tagId"
        WHERE ct."customerId" = ${id}
        ORDER BY t.name ASC
      `;
      
      console.log('Bulunan etiketler:', tags);
      
      // Etiketleri müşteri nesnesine ekle
      return {
        ...customer,
        tags: tags || []
      };
    } catch (error) {
      console.error('Etiket getirme hatası:', error);
      // Hata durumunda etiketleri boş dizi olarak ekle
      return {
        ...customer,
        tags: []
      };
    }
  }

  // Telefon numarasıyla müşteri getir
  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
    });
    
    if (!customer) {
      throw new NotFoundException(`Telefon numarasına sahip müşteri bulunamadı: ${phone}`);
    }
    
    return customer;
  }

  // Müşteri bilgilerini güncelle
  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Önce müşterinin var olup olmadığını kontrol et
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ID ${id}`);
    }
    
    const { tags, ...customerData } = updateCustomerDto;
    
    // Müşteri bilgilerini güncelle
    await this.prisma.customer.update({
      where: { id },
      data: customerData,
    });
    
    // Eğer etiketler varsa, onları işle
    if (tags) {
      await this.handleCustomerTags(id, tags);
    }
    
    return this.findOne(id);
  }

  // Müşteriyi sil
  async remove(id: string) {
    // Önce müşterinin var olup olmadığını kontrol et
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ID ${id}`);
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }
  
  // Müşteri etiketlerini işle (ekle/güncelle)
  private async handleCustomerTags(customerId: string, tags: { name: string; color: string }[]) {
    try {
      console.log(`Müşteri ${customerId} için etiketler işleniyor:`, tags);
      
      // Önce mevcut tüm etiket ilişkilerini kaldır
      await this.prisma.$executeRaw`DELETE FROM "CustomerTag" WHERE "customerId" = ${customerId}`;
      
      // Her etiket için
      for (const tagData of tags) {
        // Etiketi bul veya oluştur
        const tag = await this.tagsService.findOrCreate(tagData.name, tagData.color);
        console.log('Bulunan/Oluşturulan etiket:', tag);
        
        // Müşteri-etiket ilişkisini oluştur
        await this.prisma.$executeRaw`INSERT INTO "CustomerTag" ("customerId", "tagId") VALUES (${customerId}, ${tag.id})`;
        console.log(`Müşteri ${customerId} ve etiket ${tag.id} arasında ilişki oluşturuldu.`);
      }
    } catch (error) {
      console.error('Etiket işleme hatası:', error);
    }
  }
}
