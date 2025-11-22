# Frontend Quick Start Guide

## 🚀 Hızlı Başlangıç

### 1. Paketleri Yükleyin
```bash
cd frontend
npm install
```

### 2. Environment Değişkenlerini Ayarlayın
`.env.local` dosyası oluşturun:
```bash
cp .env.example .env.local
```

İçeriği kontrol edin:
```env
VITE_API_URL=http://localhost:5001/api
```

### 3. Development Server'ı Başlatın
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacak.

## 📋 Gereksinimler

- **Node.js:** v18 veya üzeri
- **npm:** v9 veya üzeri
- **Backend API:** `http://localhost:5001` adresinde çalışıyor olmalı

## 🛠️ Komutlar

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## ⚠️ Sorun Giderme

### TypeScript Hataları
Eğer TypeScript hataları görüyorsanız:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Çakışması
Eğer 5173 portu kullanılıyorsa, Vite otomatik olarak başka bir port seçecektir.

### Backend Bağlantı Hatası
- Backend'in çalıştığından emin olun (`dotnet run`)
- CORS ayarlarını kontrol edin
- `.env.local` dosyasında doğru URL'yi kullandığınızdan emin olun

## 📦 Yüklü Paketler

### Dependencies
- `react` - UI kütüphanesi
- `react-dom` - React DOM renderer
- `framer-motion` - Animasyonlar
- `lucide-react` - İkonlar
- `recharts` - Grafikler

### Dev Dependencies
- `vite` - Build tool
- `typescript` - Type safety
- `tailwindcss` - CSS framework
- `@vitejs/plugin-react` - React plugin

## 🎨 Stil Sistemi

Projede Tailwind CSS kullanılıyor. Custom classlar:

- `neon-text-glow` - Neon yazı efekti
- `neon-border-glow` - Neon border efekti
- `hologram-gradient` - Hologram arka plan
- `animate-float` - Yüzen animasyon

Renkler:
- `text-neon-cyan` - #00f3ff
- `text-neon-purple` - #bd00ff
- `text-neon-green` - #0aff64
- `text-neon-red` - #ff003c

## 🔗 Backend Entegrasyonu

Frontend şu endpoint'lere bağlanıyor:
- `/api/employees` - Çalışanlar
- `/api/departments` - Departmanlar
- `/api/jobapplications` - İş başvuruları
- `/api/leaverequests` - İzin talepleri
- `/api/announcements` - Duyurular

## 📱 Özellikler

- ✅ Dashboard - İstatistikler ve özetler
- ✅ Employees - Çalışan yönetimi
- ✅ Recruitment - İşe alım süreçleri
- ✅ Leaves - İzin takibi
- ✅ Responsive design
- ✅ Dark mode (neon tema)
- ✅ Animasyonlar ve geçişler

## 🎯 Başlangıç Kontrolü

Kurulum sonrası kontrol listesi:
- [ ] `npm install` başarılı
- [ ] `.env.local` oluşturuldu
- [ ] `npm run dev` çalışıyor
- [ ] Sayfa `localhost:5173`'te açılıyor
- [ ] Tailwind stilleri görünüyor
- [ ] Backend'e bağlanabiliyor
- [ ] Login ekranı açılıyor

Tüm adımlar tamamsa, hazırsınız! 🎉
