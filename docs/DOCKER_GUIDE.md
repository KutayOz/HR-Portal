# 🐳 Docker Kullanım Rehberi

Bu rehber, Docker'ı hiç bilmeyenler için temellerden başlayarak, HR Portal projesini Docker ile nasıl çalıştıracağınızı adım adım anlatmaktadır.

---

## 📚 İçindekiler

1. [Docker Nedir?](#docker-nedir)
2. [Temel Kavramlar](#temel-kavramlar)
3. [Docker Kurulumu](#docker-kurulumu)
4. [Temel Docker Komutları](#temel-docker-komutları)
5. [Dockerfile Nedir?](#dockerfile-nedir)
6. [Docker Compose Nedir?](#docker-compose-nedir)
7. [HR Portal'ı Docker ile Çalıştırma](#hr-portalı-docker-ile-çalıştırma)
8. [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)
9. [Faydalı İpuçları](#faydalı-ipuçları)

---

## Docker Nedir?

**Docker**, uygulamaları **container** (konteyner) adı verilen izole ortamlarda çalıştırmamızı sağlayan bir platformdur.

### Neden Docker Kullanılır?

| Problem | Docker Çözümü |
|---------|---------------|
| "Benim bilgisayarımda çalışıyor!" | Aynı ortam her yerde çalışır |
| Farklı yazılım sürümleri çakışması | Her uygulama kendi ortamında |
| Kurulum karmaşıklığı | Tek komutla her şey hazır |
| Geliştirme ortamı tutarsızlığı | Herkes aynı ortamı kullanır |

### Sanal Makine vs Container

```
┌─────────────────────────────────────────────────────────────┐
│                    SANAL MAKİNE                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  App A  │  │  App B  │  │  App C  │                     │
│  ├─────────┤  ├─────────┤  ├─────────┤                     │
│  │Guest OS │  │Guest OS │  │Guest OS │  ← Her biri tam OS  │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────────────────────────────────┐                   │
│  │           Hypervisor                │                   │
│  └─────────────────────────────────────┘                   │
│  ┌─────────────────────────────────────┐                   │
│  │            Host OS                  │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CONTAINER                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  App A  │  │  App B  │  │  App C  │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────────────────────────────────┐                   │
│  │         Docker Engine               │  ← Tek motor      │
│  └─────────────────────────────────────┘                   │
│  ┌─────────────────────────────────────┐                   │
│  │            Host OS                  │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

**Container avantajları:**
- ✅ Çok daha hafif (MB vs GB)
- ✅ Saniyeler içinde başlar
- ✅ Daha az kaynak tüketir
- ✅ Taşınabilir

---

## Temel Kavramlar

### 1. Image (İmaj)

**Image**, bir uygulamanın çalışması için gereken her şeyi içeren **salt-okunur şablon**dur.

```
Image = İşletim Sistemi + Uygulama + Bağımlılıklar + Ayarlar
```

Örnek: `postgres:16-alpine` image'ı PostgreSQL 16'nın Alpine Linux üzerinde çalışan halini içerir.

### 2. Container (Konteyner)

**Container**, bir image'dan oluşturulan **çalışan örnek**tir.

```
Image  →  Container
(Şablon)   (Çalışan Kopya)

Benzetme:
Sınıf (Class)  →  Nesne (Object)
DVD            →  Çalışan Film
```

Bir image'dan birden fazla container oluşturabilirsiniz.

### 3. Dockerfile

**Dockerfile**, kendi image'ınızı oluşturmak için kullanılan **tarif dosyası**dır.

```dockerfile
# Örnek Dockerfile
FROM node:20          # Temel image
WORKDIR /app          # Çalışma dizini
COPY . .              # Dosyaları kopyala
RUN npm install       # Komut çalıştır
CMD ["npm", "start"]  # Başlatma komutu
```

### 4. Docker Compose

**Docker Compose**, birden fazla container'ı **tek bir dosyayla yönetmek** için kullanılır.

```yaml
# docker-compose.yml
services:
  web:
    image: nginx
  database:
    image: postgres
```

### 5. Volume (Hacim)

**Volume**, container verileri silinse bile **kalıcı veri saklamak** için kullanılır.

```
Container (geçici) ←→ Volume (kalıcı)
```

### 6. Network (Ağ)

**Network**, container'ların birbirleriyle **iletişim kurmasını** sağlar.

```
[Frontend] ←──→ [Backend] ←──→ [Database]
         Docker Network
```

---

## Docker Kurulumu

### macOS

1. **Docker Desktop İndir:**
   - https://www.docker.com/products/docker-desktop/
   - Mac işlemcine göre seç:
     - **Apple Silicon** (M1/M2/M3)
     - **Intel**

2. **Kurulum:**
   ```
   1. İndirilen .dmg dosyasını aç
   2. Docker.app'i Applications klasörüne sürükle
   3. Applications'dan Docker'ı başlat
   4. İzin isteklerini onayla
   ```

3. **Doğrulama:**
   ```bash
   docker --version
   docker compose version
   ```

### Windows

1. **Gereksinimler:**
   - Windows 10/11 (64-bit)
   - WSL 2 etkinleştirilmiş

2. **WSL 2 Kurulumu:**
   ```powershell
   wsl --install
   ```

3. **Docker Desktop İndir:**
   - https://www.docker.com/products/docker-desktop/

4. **Kurulum sonrası:**
   ```bash
   docker --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Docker Engine kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER

# Oturumu yeniden aç ve test et
docker --version
```

---

## Temel Docker Komutları

### Image Komutları

```bash
# Image'ları listele
docker images

# Image indir (pull)
docker pull postgres:16

# Image sil
docker rmi postgres:16

# Kullanılmayan image'ları temizle
docker image prune
```

### Container Komutları

```bash
# Container oluştur ve başlat
docker run nginx

# Arka planda çalıştır (-d = detached)
docker run -d nginx

# İsim vererek çalıştır
docker run -d --name my-nginx nginx

# Port yönlendirme (-p host:container)
docker run -d -p 8080:80 nginx

# Çalışan container'ları listele
docker ps

# Tüm container'ları listele (durmuş dahil)
docker ps -a

# Container durdur
docker stop my-nginx

# Container başlat
docker start my-nginx

# Container sil
docker rm my-nginx

# Çalışan container'ı zorla sil
docker rm -f my-nginx

# Container loglarını gör
docker logs my-nginx

# Canlı log takibi
docker logs -f my-nginx

# Container içine gir
docker exec -it my-nginx bash

# Container detaylarını gör
docker inspect my-nginx
```

### Volume Komutları

```bash
# Volume oluştur
docker volume create my-data

# Volume listele
docker volume ls

# Volume sil
docker volume rm my-data

# Kullanılmayan volume'ları temizle
docker volume prune
```

### Temizlik Komutları

```bash
# Durmuş container'ları sil
docker container prune

# Kullanılmayan image'ları sil
docker image prune

# Kullanılmayan volume'ları sil
docker volume prune

# HER ŞEYİ temizle (dikkatli kullan!)
docker system prune -a --volumes
```

---

## Dockerfile Nedir?

Dockerfile, kendi Docker image'ınızı oluşturmak için kullanılan talimatlar dosyasıdır.

### Dockerfile Yapısı

```dockerfile
# 1. Temel image seç
FROM node:20-alpine

# 2. Çalışma dizini belirle
WORKDIR /app

# 3. Bağımlılık dosyalarını kopyala
COPY package*.json ./

# 4. Bağımlılıkları yükle
RUN npm ci

# 5. Kaynak kodu kopyala
COPY . .

# 6. Uygulamayı derle
RUN npm run build

# 7. Portu aç
EXPOSE 3000

# 8. Başlatma komutu
CMD ["npm", "start"]
```

### Sık Kullanılan Talimatlar

| Talimat | Açıklama | Örnek |
|---------|----------|-------|
| `FROM` | Temel image | `FROM node:20` |
| `WORKDIR` | Çalışma dizini | `WORKDIR /app` |
| `COPY` | Dosya kopyala | `COPY . .` |
| `RUN` | Komut çalıştır (build sırasında) | `RUN npm install` |
| `CMD` | Başlatma komutu | `CMD ["npm", "start"]` |
| `EXPOSE` | Port belirt | `EXPOSE 3000` |
| `ENV` | Ortam değişkeni | `ENV NODE_ENV=production` |
| `ARG` | Build argümanı | `ARG VERSION=1.0` |

### Multi-Stage Build

Daha küçük ve güvenli image'lar için:

```dockerfile
# Build aşaması
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Production aşaması
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

**Avantajı:** Sadece gerekli dosyalar final image'a alınır.

### Image Oluşturma

```bash
# Image oluştur
docker build -t my-app:1.0 .

# Farklı Dockerfile ile
docker build -f Dockerfile.prod -t my-app:prod .
```

---

## Docker Compose Nedir?

Docker Compose, birden fazla container'ı **tek bir YAML dosyasıyla** tanımlayıp yönetmenizi sağlar.

### docker-compose.yml Yapısı

```yaml
version: '3.8'

services:
  # Servis 1: Web Uygulaması
  web:
    build: ./frontend          # Dockerfile ile build et
    ports:
      - "80:80"                # Port yönlendirme
    depends_on:
      - api                    # api başladıktan sonra başla

  # Servis 2: API
  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:               # Ortam değişkenleri
      - DATABASE_URL=postgres://...
    depends_on:
      - db

  # Servis 3: Veritabanı
  db:
    image: postgres:16         # Hazır image kullan
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:                     # Kalıcı veri
```

### Docker Compose Komutları

```bash
# Servisleri başlat (arka planda)
docker compose up -d

# Servisleri başlat (logları göster)
docker compose up

# Yeniden build edip başlat
docker compose up -d --build

# Servisleri durdur
docker compose down

# Servisleri durdur + volume'ları sil
docker compose down -v

# Servis durumlarını gör
docker compose ps

# Tüm servislerin logları
docker compose logs

# Belirli servisin logları
docker compose logs api

# Canlı log takibi
docker compose logs -f

# Belirli servisi yeniden başlat
docker compose restart api

# Servis içine gir
docker compose exec api bash

# Tek seferlik komut çalıştır
docker compose run api npm test
```

### Ortam Değişkenleri

**.env dosyası:**
```env
POSTGRES_PASSWORD=secret123
API_PORT=5000
```

**docker-compose.yml'da kullanım:**
```yaml
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  api:
    ports:
      - "${API_PORT}:5000"
```

---

## HR Portal'ı Docker ile Çalıştırma

### Proje Yapısı

```
WebProject/
├── docker-compose.yml        # Production - tüm servisler
├── docker-compose.dev.yml    # Development - sadece altyapı
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── .dockerignore
```

### Production Modu (Tüm Servisler)

```bash
# Tüm servisleri başlat
docker compose up -d

# İlk başlatmada build gerekli
docker compose up -d --build
```

**Erişim:**
- Frontend: http://localhost
- Backend API: http://localhost:5001
- Swagger: http://localhost:5001/swagger

### Development Modu (Önerilen)

Sadece PostgreSQL ve Kafka'yı Docker'da çalıştırıp, backend/frontend'i yerelde geliştirin:

```bash
# Altyapıyı başlat
docker compose -f docker-compose.dev.yml up -d

# Backend'i yerelde çalıştır
cd backend
dotnet run --project API

# Frontend'i yerelde çalıştır (yeni terminal)
cd frontend
npm run dev
```

**Avantajları:**
- Hot reload çalışır
- Debug yapabilirsiniz
- Kod değişiklikleri anında yansır

### Servis Yönetimi

```bash
# Servis durumları
docker compose ps

# Backend logları
docker compose logs -f backend

# Veritabanına bağlan
docker compose exec postgres psql -U postgres -d HRPortalDB

# Kafka topic'leri listele
docker compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Veritabanı İşlemleri

```bash
# Veritabanı yedeği al
docker compose exec postgres pg_dump -U postgres HRPortalDB > backup.sql

# Yedeği geri yükle
docker compose exec -T postgres psql -U postgres HRPortalDB < backup.sql
```

---

## Sık Karşılaşılan Sorunlar

### 1. "Port already in use" Hatası

```bash
# Hangi process portu kullanıyor?
lsof -i :5001

# Process'i sonlandır
kill -9 <PID>

# Veya farklı port kullan
docker compose up -d  # docker-compose.yml'da portu değiştir
```

### 2. "Permission denied" Hatası

```bash
# Linux'ta Docker grubuna ekle
sudo usermod -aG docker $USER

# Oturumu kapat/aç veya
newgrp docker
```

### 3. Container Başlamıyor

```bash
# Logları kontrol et
docker compose logs backend

# Detaylı bilgi
docker inspect hrportal-backend
```

### 4. "No space left on device"

```bash
# Kullanılmayanları temizle
docker system prune -a

# Volume'ları da temizle (DİKKAT: veri kaybı!)
docker system prune -a --volumes
```

### 5. Build Çok Yavaş

```bash
# Build cache kullan
docker compose build --parallel

# Gereksiz dosyaları .dockerignore'a ekle
```

### 6. Container'lar Birbirine Bağlanamıyor

```bash
# Network'ü kontrol et
docker network ls
docker network inspect hrportal-network

# Servis isimlerini kullan (localhost değil)
# Örnek: postgres (localhost:5432 değil)
```

### 7. Veritabanı Bağlantı Hatası

```bash
# Postgres hazır mı kontrol et
docker compose ps

# Healthcheck durumu
docker inspect hrportal-postgres | grep -A 10 Health
```

---

## Faydalı İpuçları

### 1. Alias Tanımları (Kısayollar)

`~/.bashrc` veya `~/.zshrc` dosyasına ekleyin:

```bash
# Docker kısayolları
alias dc='docker compose'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcp='docker compose ps'
alias dcr='docker compose restart'

# Temizlik
alias docker-clean='docker system prune -a --volumes'
```

### 2. VS Code Docker Extension

- **Extension:** ms-azuretools.vscode-docker
- Container'ları görsel yönetim
- Dockerfile syntax highlighting
- Log görüntüleme

### 3. Lazydocker (Terminal UI)

```bash
# macOS
brew install lazydocker

# Çalıştır
lazydocker
```

### 4. Docker Desktop Dashboard

- Görsel container yönetimi
- Log görüntüleme
- Kaynak kullanımı izleme

### 5. Makefile ile Otomasyon

```makefile
# Makefile
.PHONY: up down logs build clean

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose up -d --build

clean:
	docker compose down -v
	docker system prune -f
```

Kullanım:
```bash
make up
make logs
make clean
```

---

## Özet Komut Tablosu

| Amaç | Komut |
|------|-------|
| Başlat | `docker compose up -d` |
| Durdur | `docker compose down` |
| Loglar | `docker compose logs -f` |
| Durum | `docker compose ps` |
| Rebuild | `docker compose up -d --build` |
| Temizle | `docker compose down -v` |
| Shell | `docker compose exec backend bash` |
| DB Shell | `docker compose exec postgres psql -U postgres` |

---

## Daha Fazla Kaynak

- [Docker Resmi Dokümantasyonu](https://docs.docker.com/)
- [Docker Compose Referansı](https://docs.docker.com/compose/compose-file/)
- [Dockerfile Referansı](https://docs.docker.com/engine/reference/builder/)
- [Docker Hub](https://hub.docker.com/) - Hazır image'lar

---

> 💡 **İpucu:** Docker öğrenmenin en iyi yolu denemektir. Bu projeyle başlayıp, komutları tek tek deneyin. Bir şey bozulursa `docker compose down -v` ile temizleyip baştan başlayabilirsiniz!
