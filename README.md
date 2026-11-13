# Bakerman Balance

Full-stack bakery pre-order app: React storefront + Express/MongoDB API.
Arah produk: **Bakerman Balance** — budget gula mingguan, transparansi gula, reward aktivitas Strava, pickup-only Bandung.

> **Status:** Fase 8 (UI fix + Cloudflare Pages + commit/push) selesai.
> Frontend live di **https://bakerman.ridwanafazn.my.id** (Cloudflare Pages). API masih via Cloudflare Tunnel ke Docker lokal.

> **Live:** <https://bakerman.ridwanafazn.my.id> · **Pages:** <https://bakerman-balance.pages.dev>

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios, Firebase Auth |
| Backend | Express 5, Mongoose 9, Firebase Admin, Zod, Helmet, rate limit |
| Database | MongoDB (Atlas Local via Docker untuk development, Atlas Cloud untuk production) |
| Tooling | ESLint 10, Nodemon, Docker Compose, Node test runner + Supertest |

## Fitur Saat Ini

- Landing page baru: **“Nikmati manisnya. Jaga progresnya.”**
- Menu `/menu` dari API v1: 10 produk, stok harian, filter kategori, label gula (Ringan/Seimbang/Manja/Manja banget)
- Detail produk `/product/:slug`: gula, allergen, bahan, stok, quantity, tambah ke keranjang
- Keranjang `/cart`: subtotal, total gula, dampak ke budget, lanjut ke checkout
- Balance `/balance`: preset 60/90/120 g, mode Guide/Strict, progress budget, **rekap 4 minggu** (gula, order, menit aktif, bonus, top produk)
- **Strava:** OAuth connect/callback, sync aktivitas mingguan, bonus progresif (30/60/90/150 menit → +10/+20/+30/+45 g), mode simulasi dev
- **Alternatif Strava:** aktivitas manual dengan screenshot wajib, upload Cloudinary, auto-delete bukti 7 hari, bonus tier yang sama
- **Order pickup:** checkout, pilih tanggal/slot, kode order, riwayat, cancel, budget & stok transaksional
- **Riwayat pesanan:** filter Semua/Aktif/Selesai/Dibatalkan + pagination
- **Staff dashboard:** antrean order, transisi status, stok harian
- **Aksesibilitas:** skip link, fokus terlihat, aria-current/pressed/live, caption tabel, reduced motion
- **Performa:** route lazy loading, manual chunk, gambar lazy + optimasi aset besar
- **SEO:** title per route, meta/Open Graph/Twitter, JSON-LD Bakery, robots.txt
- **E2E + CI:** Puppeteer smoke test + GitHub Actions (server tests, client lint/build, Docker image build)
- **Production hardening:** validasi env production, `/ready`, JSON request log, Swagger tertutup, security headers, Dockerfile + nginx + Compose production
- `/chance` legacy diarahkan ke `/balance`
- Login/register Firebase + sinkronisasi sesi server-side
- **API v1:** verifikasi Firebase ID token, user/role, budget mingguan, katalog, outlet, menu harian, slot pickup, recap
- Seed 10 produk (termasuk tinggi gula), outlet Bandung, stok harian, slot pickup 7 hari
- Swagger: `/api-docs`

## Struktur

```
client/
  src/lib/api.js          Axios instance + Firebase token interceptor
  src/context/            SessionProvider, CartProvider
  src/components/         Navbar, Hero, Product, ProductCard, BudgetBar, SugarBadge, Footer
  src/pages/              Landing, Menu, ProductDetail, Cart, Checkout, Orders, Staff, Balance, Auth
  src/styles/             index, catalog, phase2, phase4, phase5, phase7
  src/utils/              Mapping gambar, label gula, format Rupiah
  e2e/                    Puppeteer smoke test
  public/                 robots.txt
  Dockerfile              Vite build + nginx runtime
  nginx.conf              SPA fallback + proxy /api + security headers
server/
  app.js                  Express app factory
  index.js                Bootstrap + MongoDB + graceful shutdown + cleanup job
  config/                 env & Firebase Admin
  middleware/             auth, role, validation, rate limit, request logger
  models/                 User, Product, Location, DailyStock, BudgetPeriod, Order, ManualActivity, ...
  routes/v1/              auth, me, catalog, orders, activities, admin, strava, internal
  routes/                 legacy products, user, purchase
  services/               user, budget, product, order, strava, recap, manualActivity
  test/                   Node test runner + Supertest
  seed.js                 Seed 10 produk + outlet + stok + slot + demo admin
  Dockerfile              Node 24 production image
.github/workflows/        CI (tests, lint, build, Docker) + manual E2E
docs/
  PRD-bakerman-balance.md
  DATA-MODEL-AND-API.md
  PHASE-1-REPORT.md … PHASE-8-REPORT.md
  GUIDE-PHASE-2.md … GUIDE-PHASE-8.md
  DEV-ACCESS.md
  DEPLOYMENT.md
docker-compose.yml        MongoDB Atlas Local (dev)
docker-compose.prod.yml   Production-like stack (nginx + API + Mongo)
```

## Prasyarat

- Node.js >= 20.19 (dites Node 24)
- Docker Desktop (MongoDB Atlas Local)
- Firebase project (default: `bakerman-mern`)

## Setup

1. Install dependencies:

   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. Jalankan database:

   ```bash
   docker compose up -d mongo
   ```

3. Salin `server/.env.example` → `server/.env`, lalu isi:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/bakerman?directConnection=true
   FIREBASE_PROJECT_ID=bakerman-mern
   ADMIN_EMAILS=bakerman@gmail.com
   STAFF_EMAILS=qa.bakerman.101126@gmail.com
   CORS_ORIGIN=http://localhost:5173
   STRAVA_DEMO_MODE=true
   CLOUDINARY_MOCK=true
   ```

   `FIREBASE_SERVICE_ACCOUNT` **tidak wajib** untuk `verifyIdToken`; hanya perlu untuk operasi admin Firebase.
   `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` kosong → gunakan mode simulasi.
   `CLOUDINARY_MOCK=true` → upload bukti aktivitas manual disimulasikan di dev. Untuk production, isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, dan set `CLOUDINARY_MOCK=false`.

4. Seed:

   ```bash
   cd server && npm run seed
   ```

5. Jalankan backend & frontend:

   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

App: <http://localhost:5173> · API: <http://localhost:5050> · Swagger: <http://localhost:5050/api-docs>

## Scripts

| Lokasi | Command | Fungsi |
|---|---|---|
| client | `npm run dev` | Vite dev server |
| client | `npm run build` | Production build |
| client | `npm run preview` | Preview production build |
| client | `npm run lint` | ESLint |
| client | `npm run e2e` | Puppeteer smoke test (butuh stack berjalan) |
| server | `npm run dev` | Nodemon |
| server | `npm start` | API tanpa watch |
| server | `npm test` | Node test runner + Supertest |
| server | `npm run seed` | Seed produk, outlet, stok, slot, demo admin |

## Production Stack (Docker)

```powershell
$env:TOKEN_ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed
```

- Client nginx: <http://localhost:8080>
- Public tunnel (sementara): **https://merchants-publishing-release-retained.trycloudflare.com**
- API internal: `api:5050`
- Mongo internal: `mongo:27017`
- `/ready` → `{"status":"ready","database":"connected"}`
- `/api-docs/` → 404 (production)
- `STRAVA_DEMO_MODE=false` dipaksa di production.
- Aktivitas manual butuh `CLOUDINARY_*`; tanpa itu form disabled (503).

## Cloudflare Pages (Frontend)

- Production: **https://bakerman.ridwanafazn.my.id**
- Pages default: <https://bakerman-balance.pages.dev>
- Project: `bakerman-balance` (GitHub source, root `client`, build `npm run build`, output `dist`).
- Env Pages: `VITE_API_URL=https://merchants-publishing-release-retained.trycloudflare.com/api`
- API masih Express/MongoDB di Docker lokal yang diekspos lewat Cloudflare Tunnel; belum hosted penuh di Cloudflare compute.

Panduan lengkap: `docs/GUIDE-PHASE-8.md`, `docs/GUIDE-PHASE-6.md`, dan `docs/DEPLOYMENT.md`.

## Test & CI

```bash
cd server && npm test        # 34 tes
cd client && npm run lint    # 0 error
cd client && npm run build   # production build
cd client && npm run e2e     # butuh server + preview + MongoDB
```

Workflow:

- `.github/workflows/ci.yml` — server tests, client lint/build, upload artifact, Docker image build.
- `.github/workflows/e2e.yml` — manual E2E terhadap URL yang sudah berjalan.

## API

### v1 (baru)

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/session` | Firebase token | Verifikasi token + upsert user + budget |
| GET | `/health` | Public | Health check |
| GET | `/ready` | Public | Readiness + ping MongoDB |
| GET | `/api/v1/me` | Firebase token | Profil + budget periode berjalan |
| GET | `/api/v1/me/recap?weeks=4` | Firebase token | Rekap mingguan budget, order, aktivitas |
| PATCH | `/api/v1/me` | Firebase token | Nama / preset budget / mode budget |
| GET | `/api/v1/products` | Public | Filter `category`, `tag`, `maxSugar`, `sugarLevel` |
| GET | `/api/v1/products/:slug` | Public | Detail produk |
| GET | `/api/v1/locations` | Public | Outlet aktif |
| GET | `/api/v1/menu/today` | Public | Menu + stok hari ini |
| GET | `/api/v1/pickup-slots?date=` | Public | Slot pickup + kapasitas |
| GET | `/api/v1/strava/connect` | Member | URL OAuth Strava |
| GET | `/api/v1/strava/callback` | Public (state) | Callback OAuth |
| GET | `/api/v1/strava/status` | Member | Menit aktif + bonus + status |
| POST | `/api/v1/strava/sync` | Member | Sync aktivitas minggu berjalan |
| POST/DELETE | `/api/v1/strava/demo` | Member (dev) | Simulasi 45 menit / reset |
| DELETE | `/api/v1/strava/disconnect` | Member | Putuskan Strava |
| GET/POST | `/api/v1/orders` | Member | Riwayat (filter/pagination) / buat order pickup |
| GET | `/api/v1/orders/:code` | Owner/Staff | Detail order |
| POST | `/api/v1/orders/:id/cancel` | Owner | Batalkan order pending |
| GET | `/api/v1/activities/manual` | Member | Aktivitas manual minggu ini + status Cloudinary |
| POST | `/api/v1/activities/manual` | Member | Multipart: tanggal, jenis, menit, catatan, screenshot |
| DELETE | `/api/v1/activities/manual/:id` | Owner | Hapus aktivitas + screenshot |
| POST | `/api/v1/admin/activities/cleanup` | Staff/Admin | Bersihkan screenshot kedaluwarsa |
| GET | `/api/v1/internal/cleanup-cloudinary` | `CRON_SECRET` | Cron cleanup Vercel |
| GET | `/api/v1/admin/orders` | Staff/Admin | Antrean order |
| PATCH | `/api/v1/admin/orders/:id/status` | Staff/Admin | Ubah status order |
| GET | `/api/v1/admin/stock` | Staff/Admin | Stok harian |
| PATCH | `/api/v1/admin/stock/:productId` | Staff/Admin | Set total stok |
| GET | `/api/v1/admin/ping` | Staff/Admin | Cek akses role |

### Legacy (deprecated, dipakai UI lama)

`/api/products`, `/api/user`, `/api/user/buy-history`, `/api/user/strava-link`, `/api/purchase/*`.

Akan dihapus setelah UI migrasi ke v1.

## Demo

| Email | Password | Role |
|---|---|---|
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |

## Dokumentasi Produk

- `docs/PRD-bakerman-balance.md` — riset, positioning, aturan budget, fase build
- `docs/DATA-MODEL-AND-API.md` — schema MongoDB, transaksi, endpoint
- `docs/PHASE-1-REPORT.md` — laporan implementasi Fase 1
- `docs/PHASE-2-REPORT.md` — laporan implementasi Fase 2
- `docs/PHASE-3-REPORT.md` — laporan implementasi Fase 3
- `docs/PHASE-4-REPORT.md` — laporan implementasi Fase 4
- `docs/PHASE-5-REPORT.md` — laporan implementasi Fase 5
- `docs/PHASE-6-REPORT.md` — laporan implementasi Fase 6
- `docs/PHASE-7-REPORT.md` — laporan implementasi Fase 7
- `docs/PHASE-8-REPORT.md` — laporan implementasi Fase 8
- `docs/GUIDE-PHASE-2.md` — panduan mencoba hasil Fase 2
- `docs/GUIDE-PHASE-3.md` — panduan mencoba hasil Fase 3
- `docs/GUIDE-PHASE-4.md` — panduan mencoba hasil Fase 4
- `docs/GUIDE-PHASE-5.md` — panduan mencoba hasil Fase 5
- `docs/GUIDE-PHASE-6.md` — panduan mencoba hasil Fase 6
- `docs/GUIDE-PHASE-7.md` — panduan mencoba hasil Fase 7
- `docs/GUIDE-PHASE-8.md` — panduan mencoba hasil Fase 8
- `docs/DEV-ACCESS.md` — link publik/tunnel & troubleshooting akses dari HP
- `docs/DEPLOYMENT.md` — panduan deploy Atlas + Vercel + Firebase + Cloudinary + Docker
