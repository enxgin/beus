import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  // Yeni bir etiket oluştur (Upsert mantığı ile)
  async create(createTagDto: CreateTagDto) {
    const { name, color } = createTagDto;

    try {
      // 1. Bu isimde bir etiket zaten var mı diye kontrol et (büyük-küçük harf duyarsız)
      const existingTag = await this.prisma.tag.findFirst({
        where: { 
          name: { 
            equals: name, 
            mode: 'insensitive' 
          } 
        },
      });

      // 2. Etiket zaten varsa, onu döndür
      if (existingTag) {
        console.log(`Mevcut etiket bulundu, tekrar oluşturulmuyor: ${name}`);
        return existingTag;
      }

      // 3. Etiket yoksa, yenisini oluştur
      console.log(`Yeni etiket oluşturuluyor: ${name}`);
      return await this.prisma.tag.create({
        data: {
          name,
          color: color || '#000000',
        },
      });

    } catch (error) {
      console.error(`Etiket oluşturma/bulma hatası (${name}):`, error);
      // Prisma'nın bilinen bir hatası ise daha anlamlı bir mesaj fırlat
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Unique constraint failed
          throw new ConflictException(`'${name}' adında bir etiket zaten mevcut.`);
        }
      }
      throw new InternalServerErrorException('Etiket oluşturulurken bir sunucu hatası oluştu.');
    }
  }

  // Tüm etiketleri getir
  async findAll() {
    try {
      return await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Tag" ORDER BY "name" ASC
      `;
    } catch (error) {
      console.error('Etiketleri getirme hatası:', error);
      return [];
    }
  }

  // ID ile belirli bir etiketi getir
  async findOne(id: string) {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Tag" WHERE "id" = ${id}
      `;

      if (!result || result.length === 0) {
        throw new NotFoundException(`Etiket bulunamadı: ID ${id}`);
      }

      return result[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Etiket getirme hatası (ID: ${id}):`, error);
      throw new NotFoundException(`Etiket bulunamadı: ID ${id}`);
    }
  }

  // İsim ile belirli bir etiketi getir
  async findByName(name: string) {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Tag" WHERE "name" = ${name}
      `;

      if (!result || result.length === 0) {
        throw new NotFoundException(`Etiket bulunamadı: İsim ${name}`);
      }

      return result[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Etiket getirme hatası (İsim: ${name}):`, error);
      throw new NotFoundException(`Etiket bulunamadı: İsim ${name}`);
    }
  }

  // Etiket bilgilerini güncelle
  async update(id: string, updateTagDto: UpdateTagDto) {
    try {
      // Önce etiketin var olup olmadığını kontrol et
      await this.findOne(id);
      
      // Güncellenecek alanları belirle
      const updates = [];
      
      if (updateTagDto.name !== undefined) {
        updates.push(`"name" = '${updateTagDto.name}'`);
      }
      
      if (updateTagDto.color !== undefined) {
        updates.push(`"color" = '${updateTagDto.color}'`);
      }
      
      // Güncellenecek alan varsa güncelle
      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        const updateStr = updates.join(', ');
        
        // Raw SQL sorgusu kullanarak güncelleme yapıyoruz
        await this.prisma.$executeRaw`
          UPDATE "Tag" 
          SET ${updateStr} 
          WHERE "id" = ${id}
        `;
      }
      
      return this.findOne(id);
    } catch (error) {
      console.error(`Etiket güncelleme hatası (ID: ${id}):`, error);
      throw error;
    }
  }

  // Etiketi sil
  async remove(id: string) {
    try {
      // Önce etiketin var olup olmadığını kontrol et
      const tag = await this.findOne(id);
      
      await this.prisma.$executeRaw`
        DELETE FROM "Tag" WHERE "id" = ${id}
      `;
      
      return tag;
    } catch (error) {
      console.error(`Etiket silme hatası (ID: ${id}):`, error);
      throw error;
    }
  }

  // İsim ile etiket bul veya oluştur
  async findOrCreate(name: string, color: string = '#000000') {
    try {
      console.log(`Etiket aranıyor veya oluşturuluyor: ${name}, ${color}`);
      
      // Önce etiketi isim ile ara
      const existingTags = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Tag" WHERE "name" = ${name}
      `;
      
      // Etiket varsa döndür
      if (existingTags && existingTags.length > 0) {
        console.log(`Mevcut etiket bulundu: ${name}`);
        return existingTags[0];
      }
      
      // Etiket yoksa oluştur
      console.log(`Etiket bulunamadı, yeni oluşturuluyor: ${name}, ${color}`);
      const id = uuidv4();
      
      await this.prisma.$executeRaw`
        INSERT INTO "Tag" ("id", "name", "color", "createdAt", "updatedAt")
        VALUES (${id}, ${name}, ${color || '#000000'}, NOW(), NOW())
      `;
      
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Tag" WHERE "id" = ${id}
      `;
      
      return result[0];
    } catch (error) {
      console.error(`Etiket bulma/oluşturma hatası (${name}):`, error);
      throw error;
    }
  }
}
