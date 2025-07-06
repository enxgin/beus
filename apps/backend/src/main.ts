import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting NestJS application...');
  const app = await NestFactory.create(AppModule);
  
  // Global prefix for all routes (e.g., /api/v1/...)
  app.setGlobalPrefix('api/v1');
  
  // Log API prefix
  console.log(`API Prefix: api/v1`);
  
  // Frontend'den gelen isteklere izin ver
  app.enableCors({
    origin: [
      'http://localhost:3000', // Lokal Next.js frontend
      'http://localhost:4200', // Lokal Angular/React frontend (varsa)
      'https://next-2ehl5ugsc-enxgins-projects.vercel.app', // Eski Vercel Preview URL'si
      'https://beus-frontend.vercel.app', // Tahmini Vercel Production URL'si
      'https://next-beu.vercel.app' // Yeni Vercel Production URL'si
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  console.log('CORS enabled for frontend origins');
  
  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted values are provided
    }),
  );
  
  // Swagger API documentation setup
  const config = new DocumentBuilder()
    .setTitle('SalonFlow API')
    .setDescription('Güzellik salonu yönetim sistemi API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Start the server
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
