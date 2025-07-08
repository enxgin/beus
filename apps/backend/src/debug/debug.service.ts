import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedInitialData() {
    this.logger.log('Başlangıç verileri ekleniyor...');

    const branchId = 'clxyj6eax000013sq918l3vsd';

    try {
      const branch = await this.prisma.branch.upsert({
        where: { id: branchId },
        update: {},
        create: {
          id: branchId,
          name: 'Ana Şube (Oto-Oluşturuldu)',
          address: 'Merkez',
        },
      });

      this.logger.log(`Şube başarıyla oluşturuldu/güncellendi: ${branch.name}`);

      return {
        message: 'Başlangıç verileri başarıyla eklendi.',
        data: {
          branch,
        },
      };
    } catch (error) {
      this.logger.error('Veri eklenirken bir hata oluştu:', error);
      throw new Error(`Veri ekleme başarısız: ${error.message}`);
    }
  }
}
