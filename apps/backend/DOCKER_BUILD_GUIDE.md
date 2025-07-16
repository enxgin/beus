# Docker Build Rehberi

Bu rehber, backend uygulamasını Docker ile build etmek için farklı seçenekleri açıklar.

## Sorun
Coolify'de build sırasında npm network timeout hataları yaşanıyor:
```
npm error network request to https://registry.npmjs.org/prisma failed, reason: ETIMEDOUT
```

## Çözümler

### 1. Ana Dockerfile (Önerilen)
**Dosya:** `Dockerfile`

Bu dosya npm ile network timeout sorunlarını çözmek için optimize edilmiştir:
- Network timeout süreleri artırılmış (300 saniye)
- Retry mekanizması eklenmiş
- Global prisma kurulumu kaldırılmış, local npx kullanılıyor

**Kullanım:**
```bash
docker build -f Dockerfile -t backend-app .
```

### 2. Yarn Alternatifi
**Dosya:** `Dockerfile.yarn`

Eğer npm ile hala sorun yaşanırsa yarn kullanın:
- Yarn daha güvenilir network handling'e sahip
- Frozen lockfile ile tutarlı builds
- Network timeout optimizasyonları

**Kullanım:**
```bash
docker build -f Dockerfile.yarn -t backend-app .
```

## Coolify'de Kullanım

### Ana Dockerfile için:
1. Coolify dashboard'da projenizi açın
2. Build ayarlarına gidin
3. Dockerfile path'i: `apps/backend/Dockerfile`
4. Build context: `.` (root directory)

### Yarn Dockerfile için:
1. Coolify dashboard'da projenizi açın
2. Build ayarlarına gidin
3. Dockerfile path'i: `apps/backend/Dockerfile.yarn`
4. Build context: `.` (root directory)

## Yapılan Optimizasyonlar

### Network Ayarları:
- `fetch-timeout`: 300000ms (5 dakika)
- `fetch-retry-mintimeout`: 20000ms
- `fetch-retry-maxtimeout`: 120000ms
- Registry URL açık olarak belirtilmiş

### Prisma Optimizasyonları:
- Global prisma kurulumu kaldırıldı
- Local npx prisma kullanılıyor
- Fallback mekanizması eklendi

## Troubleshooting

### Hala network hatası alıyorsanız:
1. Yarn Dockerfile'ı deneyin
2. Coolify sunucusunun internet bağlantısını kontrol edin
3. DNS ayarlarını kontrol edin
4. Proxy ayarları varsa bunları kontrol edin

### Build süresi uzunsa:
- Docker layer caching'i aktif edin
- Multi-stage build kullanıldığı için sadece değişen layerlar rebuild edilir

## Test Etme

Local'de test etmek için:
```bash
# Ana Dockerfile
docker build -f apps/backend/Dockerfile -t backend-test .

# Yarn Dockerfile
docker build -f apps/backend/Dockerfile.yarn -t backend-test-yarn .

# Çalıştırma
docker run -p 3001:3001 backend-test