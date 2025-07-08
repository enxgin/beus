import { Controller, Post, Logger } from '@nestjs/common';
import { DebugService } from './debug.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Debug')
@Controller('debug')
export class DebugController {
  private readonly logger = new Logger(DebugController.name);

  constructor(private readonly debugService: DebugService) {}

  @Post('seed-data')
  @ApiOperation({ summary: 'Veritabanına başlangıç verilerini ekler (örn: Ana Şube)' })
  @ApiResponse({ status: 201, description: 'Veriler başarıyla eklendi.' })
  @ApiResponse({ status: 500, description: 'Sunucu hatası.' })
  async seedData() {
    this.logger.log('seed-data endpointi çağrıldı.');
    return this.debugService.seedInitialData();
  }
}
