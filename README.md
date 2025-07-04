# SalonFlow - Güzellik Salonu Yönetim Sistemi

Bu proje, güzellik salonları için kapsamlı bir yönetim sistemi sağlayan modern bir web uygulamasıdır.

## Kurulum Adımları

### Gereksinimler

- Node.js (v16 veya üstü)
- PostgreSQL
- Yarn (önerilen) veya NPM

### Adım 1: Node.js ve NPM'i Kurma

1. [Node.js resmi sitesinden](https://nodejs.org/) indirip kurun
2. Kurulumun başarılı olduğunu doğrulayın:
   ```
   node -v
   npm -v
   ```

### Adım 2: PostgreSQL Kurulumu

1. [PostgreSQL resmi sitesinden](https://www.postgresql.org/download/) indirip kurun
2. Kurulum sırasında şifrenizi not alın
3. PgAdmin veya başka bir araçla yeni bir `salonflow` veritabanı oluşturun

### Adım 3: Projeyi Kurma

1. Bağımlılıkları yükleyin:
   ```
   cd apps/backend
   npm install
   
   cd ../../apps/frontend
   npm install
   ```

2. `.env` dosyasını oluşturun:
   ```
   # apps/backend/.env dosyası
   DATABASE_URL="postgresql://username:password@localhost:5432/salonflow?schema=public"
   JWT_SECRET="super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="24h"
   ```

3. Veritabanı şemasını oluşturun:
   ```
   cd apps/backend
   npx prisma migrate dev
   ```

4. Geliştirme sunucusunu başlatın:
   ```
   # Root dizininde
   npm run dev
   ```

## Proje Yapısı

```
salonflow/
├── apps/
│   ├── backend/         # NestJS backend
│   └── frontend/        # Next.js frontend
├── packages/
│   └── common/          # Paylaşılan kod ve bileşenler
└── package.json         # Root package.json
```
# beus
