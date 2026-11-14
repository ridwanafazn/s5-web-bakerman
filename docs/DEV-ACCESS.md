# Dev Access — Link Publik & Production Stack

Dokumen ini mencatat cara mengakses aplikasi dari HP di jaringan berbeda, link production, serta cara menjalankan stack lokal.

---

## Link Publik Saat Ini

### 0. Production — Cloudflare Pages + Vercel

| Keperluan | URL |
|---|---|
| **Frontend** | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | **https://bakerman-balance.pages.dev** |
| **API** | **https://bakerman-api.vercel.app/api** |
| API health | https://bakerman-api.vercel.app/health |
| API readiness | https://bakerman-api.vercel.app/ready |

- Frontend statis di Cloudflare Pages (project `bakerman-balance`).
- API Express + MongoDB di Vercel (project `bakerman-api`, Node 24.x).
- Database MongoDB Atlas (`bakerman_app`, database `bakerman`).
- Cloudinary asli aktif; Strava asli belum dikonfigurasi (gunakan aktivitas manual).
- Login/API sudah diuji dari domain ini: budget 90 g, recap, menu 10 produk, 0 console error.
- Tidak ada Cloudflare Tunnel untuk production; laptop tidak perlu menyala.

### 1. Production-like Docker stack (lokal)

**http://localhost:8080**

- nginx + API + Mongo Atlas Local dalam network Docker.
- Data demo mengikuti `server/.env` (default: Atlas/local Mongo sesuai konfigurasi).
- Strava demo **mati**; Swagger **404**.
- Cocok untuk mengecek nginx, security headers, readiness, logging.

### 2. Dev preview (fitur + Strava simulasi)

**http://localhost:4173**

- `vite preview` dari production build.
- Strava demo bisa diaktifkan lewat env dev.
- Aktivitas manual bisa memakai mock Cloudinary jika `CLOUDINARY_MOCK=true`.

> Tunnel Quick Tunnel hanya opsi sementara untuk demo lokal. Production sudah permanen di Pages + Vercel.

**Link lokal:**

- Production stack: <http://localhost:8080>
- App dev: <http://localhost:5173>
- Preview dev: <http://localhost:4173>
- API dev: <http://localhost:5050>
- Swagger dev: <http://localhost:5050/api-docs>

---

## Kenapa Sebelumnya Blank di HP?

Gejala: tab title + favicon muncul, tetapi halaman putih.

Penyebab paling mungkin:

- Dev server Vite memuat **ratusan modul** satu per satu + HMR WebSocket. Di jaringan mobile, ini bisa lambat/timeout atau ter-cache setengah jalan.
- Perubahan konfigurasi/file saat tunnel aktif bisa membuat modul lama tidak tersedia.

Perbaikan:

- Sajikan **production build** lewat `vite preview` atau nginx.
- Gunakan tunnel ke port preview/nginx, bukan dev server.
- Jika masih blank: hard refresh / incognito / pastikan JavaScript aktif.

---

## Cara Menyalakan Ulang — Dev

### 1. Database & backend

```bash
docker compose up -d mongo
cd server && npm run dev
```

### 2. Build & preview frontend

```bash
cd client
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

### 3. Tunnel dev (opsional)

```bash
cloudflared tunnel --url http://localhost:4173
```

Cloudflared akan mencetak URL `https://xxxx.trycloudflare.com`. Update URL di dokumen ini jika masih dipakai untuk demo.

---

## Cara Menyalakan Ulang — Production Stack

```powershell
# Build & start (client nginx + API + Mongo)
docker compose -f docker-compose.prod.yml up -d --build

# Seed pertama kali (destruktif; hanya demo)
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed
```

Cek:

```powershell
curl http://localhost:8080/ready
# {"status":"ready","database":"connected"}
```

Stop:

```powershell
docker compose -f docker-compose.prod.yml down
```

> Stack ini membaca `server/.env`. Jangan jalankan `down -v` kecuali ingin menghapus volume Mongo lokal.

---

## Cek Cepat Production

1. Buka **https://bakerman.ridwanafazn.my.id** di HP → login member.
2. Budget **90 g**, menu 10 produk.
3. `/orders` → belum ada order (data Atlas baru di-seed).
4. `/checkout` → slot pickup muncul.
5. Admin `/staff` → antrean + tabel stok.
6. Buka `https://bakerman-api.vercel.app/ready` → `{"status":"ready","database":"connected"}`.
7. Buka `https://bakerman-api.vercel.app/api-docs/` → **404** (production).
8. DevTools → Response Headers → cek `X-Content-Type-Options`, `X-Frame-Options`, dll.
9. Strava production: “Strava belum tersedia di lingkungan ini.” (expected).

E2E:

```bash
cd client

# Production custom domain
$env:E2E_BASE_URL="https://bakerman.ridwanafazn.my.id"
$env:E2E_HOST_RESOLVER="MAP bakerman.ridwanafazn.my.id 104.21.69.32"
npm run e2e

# Production lokal
E2E_BASE_URL=http://localhost:8080 npm run e2e
```

> Pagination hanya terlihat jika order > 8.

---

## Cek Cepat — Aktivitas Manual

### Production (Cloudinary asli)
1. Login member → `/balance`.
2. Scroll ke **“Catat aktivitas manual”**.
3. Isi 45 menit, pilih screenshot, klik **Kirim aktivitas**.
4. Budget naik **90 g → 100 g**; daftar menampilkan **45 menit · +10 g**.
5. Klik **Hapus** → budget kembali **90 g**.
6. Screenshot otomatis dihapus dari Cloudinary setelah 7 hari.

### Dev (mock Cloudinary)
- Set `CLOUDINARY_MOCK=true`; badge **“Mode simulasi bukti (dev)”** muncul.

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

Login di domain production menggunakan **email/password**. Google sign-in memerlukan penambahan domain ke Firebase Authentication → Authorized domains.

---

## Checklist Jika Link Bermasalah

1. Cek `https://bakerman-api.vercel.app/ready` → `database: connected`.
2. Cek `https://bakerman-api.vercel.app/api/v1/products` → 10 produk.
3. Cek `https://bakerman.ridwanafazn.my.id` → 200.
4. Jika memakai Docker lokal: pastikan stack hidup (`curl http://localhost:8080/ready`).
5. Coba hard refresh / incognito di HP.
6. Jika memakai tunnel lokal dan URL mati, buat tunnel baru (production tidak terpengaruh).

---

## Troubleshooting Mongo Dev

Jika muncul:

```text
MongoServerError: node is not in primary or recovering state
```

Perbaiki replica set hostname (data tetap aman):

```powershell
$hostname = docker inspect bakerman-mongo --format '{{.Config.Hostname}}'
docker exec bakerman-mongo mongosh --quiet --eval "const cfg=rs.conf(); cfg.members[0].host='$($hostname):27017'; rs.reconfig(cfg,{force:true})"
```

Tunggu sampai primary:

```powershell
docker exec bakerman-mongo mongosh --quiet --eval "db.hello().isWritablePrimary"
```
