import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const dbUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    // eslint-disable-next-line no-console
    console.log('[PrismaService] DATABASE_URL:', dbUrl);
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method for transaction management
  async withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
