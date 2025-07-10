#!/bin/bash

echo "🚀 BEU Geliştirme Ortamı Kurulumu Başlıyor..."

# Docker ve Docker Compose kontrolü
if ! command -v docker &> /dev/null; then
    echo "❌ Docker bulunamadı. Lütfen Docker Desktop'ı yükleyin."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose bulunamadı. Lütfen Docker Desktop'ı yükleyin."
    exit 1
fi

echo "✅ Docker ve Docker Compose bulundu."

# Eski container'ları temizle
echo "🧹 Eski container'ları temizleniyor..."
docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans

# Yeni ortamı başlat
echo "🏗️  Geliştirme ortamı başlatılıyor..."
docker-compose -f docker-compose.dev.yml up --build -d

# Veritabanının hazır olmasını bekle
echo "⏳ Veritabanının hazır olması bekleniyor..."
sleep 10

# Prisma migration'larını çalıştır
echo "🗄️  Veritabanı migration'ları çalıştırılıyor..."
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name init

# Seed data'yı yükle (varsa)
echo "🌱 Seed data yükleniyor..."
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed 2>/dev/null || echo "Seed dosyası bulunamadı, atlanıyor..."

echo ""
echo "🎉 Geliştirme ortamı hazır!"
echo ""
echo "📍 Erişim URL'leri:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Database: localhost:5432 (postgres/postgres123)"
echo ""
echo "📋 Yararlı Komutlar:"
echo "   Logları görüntüle:     docker-compose -f docker-compose.dev.yml logs -f"
echo "   Backend logları:       docker-compose -f docker-compose.dev.yml logs -f backend"
echo "   Frontend logları:      docker-compose -f docker-compose.dev.yml logs -f frontend"
echo "   Ortamı durdur:         docker-compose -f docker-compose.dev.yml down"
echo "   Ortamı yeniden başlat: docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "🔧 Geliştirme İpuçları:"
echo "   - Kod değişiklikleri otomatik olarak algılanır ve uygulanır"
echo "   - Backend enum hatalarını anında görmek için: docker-compose -f docker-compose.dev.yml logs -f backend"
echo "   - Veritabanı değişiklikleri için: docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev"