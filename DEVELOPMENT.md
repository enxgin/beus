# 🚀 BEU Geliştirme Ortamı

Bu dokümantasyon, BEU projesini yerel geliştirme ortamında Docker ile nasıl çalıştıracağınızı açıklar.

## 📋 Gereksinimler

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

## 🏗️ Hızlı Başlangıç

### 1. Otomatik Kurulum (Önerilen)

```bash
# Geliştirme ortamını tek komutla başlat
./dev-setup.sh
```

Bu script:
- Eski container'ları temizler
- Yeni ortamı başlatır
- Veritabanı migration'larını çalıştırır
- Seed data'yı yükler

### 2. Manuel Kurulum

```bash
# Container'ları başlat
docker-compose -f docker-compose.dev.yml up --build -d

# Migration'ları çalıştır
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Seed data'yı yükle (opsiyonel)
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

## 🌐 Erişim URL'leri

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Swagger Docs:** http://localhost:3001/api
- **Database:** localhost:5432 (postgres/postgres123)

## 🔧 Geliştirme Komutları

### Container Yönetimi
```bash
# Tüm servislerin loglarını görüntüle
docker-compose -f docker-compose.dev.yml logs -f

# Sadece backend loglarını görüntüle
docker-compose -f docker-compose.dev.yml logs -f backend

# Sadece frontend loglarını görüntüle
docker-compose -f docker-compose.dev.yml logs -f frontend

# Servisleri durdur
docker-compose -f docker-compose.dev.yml down

# Servisleri yeniden başlat
docker-compose -f docker-compose.dev.yml restart

# Belirli bir servisi yeniden başlat
docker-compose -f docker-compose.dev.yml restart backend
```

### Veritabanı İşlemleri
```bash
# Yeni migration oluştur
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name migration_name

# Prisma Studio'yu başlat
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Veritabanını sıfırla
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset
```

### Backend İşlemleri
```bash
# Backend container'ına bağlan
docker-compose -f docker-compose.dev.yml exec backend sh

# NPM paketlerini güncelle
docker-compose -f docker-compose.dev.yml exec backend npm install

# Testleri çalıştır
docker-compose -f docker-compose.dev.yml exec backend npm test
```

## 🐛 Hata Ayıklama

### Enum Runtime Hatalarını Yakalama

Bu geliştirme ortamı, production'da yaşadığımız enum hatalarını anında yakalamanızı sağlar:

1. **Hatalı kodu yazın** (örneğin `@prisma/client`'dan enum import edin)
2. **Backend loglarını izleyin:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```
3. **Hatayı anında görün:**
   ```
   TypeError: Cannot convert undefined or null to object
   at IsEnum (.../node_modules/class-validator/...)
   ```
4. **Hatayı düzeltin** (enum'u `prisma-types.ts`'den import edin)
5. **Otomatik yeniden başlatmayı bekleyin** ve hatanın kaybolduğunu görün

### Yaygın Sorunlar

#### Docker Daemon Çalışmıyor
```bash
# Hata: Cannot connect to the Docker daemon at unix:///Users/engin/.docker/run/docker.sock
# Çözüm: Docker Desktop'ı başlatın
open -a Docker

# Docker'ın başladığını kontrol edin
docker info
```

#### Port Çakışması
```bash
# Kullanılan portları kontrol et
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Çakışan servisi durdur veya farklı port kullan
```

#### Container Build Sorunları
```bash
# Cache'i temizleyerek yeniden build et
docker-compose -f docker-compose.dev.yml build --no-cache

# Tüm Docker cache'ini temizle
docker system prune -a
```

#### Veritabanı Bağlantı Sorunları
```bash
# PostgreSQL container'ının çalıştığını kontrol et
docker-compose -f docker-compose.dev.yml ps postgres

# Veritabanı loglarını kontrol et
docker-compose -f docker-compose.dev.yml logs postgres
```

## 📁 Proje Yapısı

```
beu/
├── docker-compose.dev.yml      # Geliştirme ortamı tanımı
├── dev-setup.sh              # Otomatik kurulum scripti
├── apps/
│   ├── backend/
│   │   ├── Dockerfile.dev     # Backend geliştirme Dockerfile
│   │   └── src/
│   └── frontend/
│       ├── Dockerfile.dev     # Frontend geliştirme Dockerfile
│       └── src/
```

## 🔄 Geliştirme İş Akışı

1. **Kod değişikliği yap**
2. **Dosyayı kaydet** (otomatik hot-reload)
3. **Backend loglarını kontrol et** (hata varsa anında görünür)
4. **Hatayı düzelt** (gerekirse)
5. **Test et**
6. **Git commit & push**

Bu iş akışı sayesinde, production'a deploy etmeden önce tüm hataları yakalayabilirsiniz!

## 🚀 Production'a Deploy

Geliştirme ortamında her şey çalıştığından emin olduktan sonra:

```bash
# Değişiklikleri commit et
git add .
git commit -m "feat: new feature implementation"

# Production branch'ine push et
git push origin v1
```

Artık Coolify'de deploy ettiğinizde hiçbir runtime hatası almayacaksınız! 🎉