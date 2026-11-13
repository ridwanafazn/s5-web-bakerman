# Deployment — Bakerman Balance

Panduan deploy production: **MongoDB Atlas Cloud + Vercel (API & client) + Firebase Auth + Strava OAuth**.

> Status saat ini: artefak dan panduan sudah siap, tetapi deploy aktual belum dilakukan karena menunggu kredensial Atlas Cloud, Firebase production, dan akun Vercel.

---

## 1. Arsitektur Production

```text
Browser (HP/laptop)
  │
  ├── https://bakerman-balance.vercel.app   → client (Vite static, SPA)
  │        │
  │        └── VITE_API_URL → https://bakerman-api.vercel.app/api
  │
  └── https://bakerman-api.vercel.app       → Express API (Vercel Node)
           │
           ├── MongoDB Atlas Cloud
           ├── Firebase Admin (verifikasi token)
           └── Strava API (OAuth + sync)
```

Rekomendasi: dua project Vercel terpisah (client dan API) agar build, env, dan domain jelas.

---

## 2A. Alternatif: Docker Compose Production (self-hosted / lokal)

Repo sudah menyertakan stack production-like:

- `server/Dockerfile` — API Node production, non-root, healthcheck.
- `client/Dockerfile` — build Vite + nginx runtime.
- `client/nginx.conf` — SPA fallback, proxy `/api`, `/health`, `/ready`, cache asset, security headers.
- `docker-compose.prod.yml` — project terisolasi `bakerman-prod`, Mongo Atlas Local, API, client di port 8080.

Jalankan:

```powershell
# Wajib 64 hex. Simpan aman; jangan commit.
$env:TOKEN_ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose -f docker-compose.prod.yml up -d --build

# Seed pertama kali (destruktif; hanya demo)
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed

curl http://localhost:8080/ready
```

Verifikasi:

```text
http://localhost:8080/          → client nginx
http://localhost:8080/health    → API health
http://localhost:8080/ready     → readiness + Mongo ping
http://localhost:8080/api-docs/ → 404 (production)
```

Catatan:

- `STRAVA_DEMO_MODE=false` dipaksa di production.
- `TOKEN_ENCRYPTION_KEY` wajib; API menolak start tanpa key valid.
- `CORS_ORIGIN` wajib origin eksplisit.
- Data Mongo production stack memakai volume terpisah dari dev.
- Untuk self-hosted dengan domain, taruh reverse proxy TLS (Caddy/Traefik/nginx eksternal) di depan port 8080.

---

## 2B. Cloudflare Pages (Frontend)

Frontend sudah live:

- **https://bakerman.ridwanafazn.my.id**
- **https://bakerman-balance.pages.dev**

Konfigurasi:

- Project: `bakerman-balance`
- Source: GitHub `ridwanafazn/s5-web-bakerman`
- Production branch: `main`
- Root: `client`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://merchants-publishing-release-retained.trycloudflare.com/api`

Custom domain:

- `bakerman.ridwanafazn.my.id`
- CNAME `bakerman` → `bakerman-balance.pages.dev` (proxied)
- Status: active

Catatan penting:

- Frontend di Pages adalah hosting statis Cloudflare.
- API Express + MongoDB **tidak** jalan di Workers free plan; API saat ini lewat Cloudflare Quick Tunnel ke Docker lokal.
- Untuk API cloud permanen: Vercel/Render/VPS, atau Cloudflare Workers Paid + Containers.
- Jika URL API berubah, update `VITE_API_URL` di Pages lalu rebuild.

---

## 2. MongoDB Atlas Cloud

1. Login <https://cloud.mongodb.com>.
2. Buat cluster (M0 cukup untuk portfolio).
3. Buat database user dengan password kuat.
4. Network Access:
   - Untuk Vercel serverless, tambahkan `0.0.0.0/0` (dengan password kuat), atau gunakan private endpoint jika tersedia.
5. Ambil connection string:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bakerman?retryWrites=true&w=majority
```

6. Setelah API deploy, jalankan seed production (hati-hati: seed menghapus produk & stok):

```bash
cd server
MONGODB_URI="..." npm run seed
```

> Seed hanya membuat produk, outlet, stok, slot, dan admin demo. Jangan jalankan seed berulang di production jika sudah ada data nyata.

---

## 3. Firebase Production

1. Buka Firebase Console → project `bakerman-mern` (atau project production).
2. Authentication → Sign-in method → aktifkan **Email/Password** dan **Google**.
3. Authentication → Settings → **Authorized domains**:
   - `localhost` (development)
   - `bakerman-balance.vercel.app`
   - domain custom jika ada.
4. Project settings → Service accounts → **Generate new private key**.
5. Simpan JSON service account sebagai env `FIREBASE_SERVICE_ACCOUNT` (JSON string) atau path file di server. **Jangan commit file ini.**

---

## 4. Deploy API (Vercel)

### 4.1 Environment Variables

Set di Vercel project API → Settings → Environment Variables:

```env
NODE_ENV=production
PORT=5050

MONGODB_URI=mongodb+srv://...

CORS_ORIGIN=https://bakerman-balance.vercel.app

FIREBASE_PROJECT_ID=bakerman-mern
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

ADMIN_EMAILS=bakerman@gmail.com
STAFF_EMAILS=qa.bakerman.101126@gmail.com

APP_TIMEZONE=Asia/Jakarta
TOKEN_ENCRYPTION_KEY=<64 hex chars>

STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=https://bakerman-api.vercel.app/api/v1/strava/callback
STRAVA_DEMO_MODE=false

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=bakerman/manual-activities
CLOUDINARY_MOCK=false
MANUAL_ACTIVITY_SCREENSHOT_DAYS=7
MANUAL_ACTIVITY_MAX_MB=5
CRON_SECRET=...
```

Generate token encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.2 Deploy

Dari root repo:

```bash
cd server
vercel link
vercel --prod
```

Atau hubungkan repo GitHub ke project Vercel dengan **Root Directory = `server`**.

`server/vercel.json` sudah mengarahkan semua request ke Express (`index.js`).

### 4.3 Verifikasi API

```bash
curl https://bakerman-api.vercel.app/health
# {"status":"ok","database":"connected","environment":"production"}

curl https://bakerman-api.vercel.app/api/v1/products
# {"products":[...]}
```

---

## 5. Deploy Client (Vercel)

### 5.1 Environment Variables

```env
VITE_API_URL=https://bakerman-api.vercel.app/api
```

### 5.2 Deploy

```bash
cd client
vercel link
vercel --prod
```

Atau hubungkan repo GitHub dengan **Root Directory = `client`**, build command `npm run build`, output `dist`.

`client/vercel.json` sudah menangani SPA rewrite agar `/balance`, `/orders`, `/staff` tidak 404.

### 5.3 Verifikasi Client

- Buka `https://bakerman-balance.vercel.app`.
- Cek `/menu`, `/balance`, `/orders`.
- Login email/password.
- Cek console browser tidak ada error.

---

## 6. Strava Production

> Sejak Juni 2026, Strava mewajibkan langganan berbayar untuk API app Standard Tier. Jika tidak ingin berlangganan, gunakan **aktivitas manual + Cloudinary** (lihat 6A).

1. Buka <https://www.strava.com/settings/api>.
2. Buat API application:
   - Website: `https://bakerman-balance.vercel.app`
   - Authorization Callback Domain: `bakerman-api.vercel.app`
3. Isi `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI` di Vercel API.
4. Set `STRAVA_DEMO_MODE=false`.
5. Redeploy API.
6. Login → `/balance` → **Hubungkan Strava** → izinkan → cek sync.

> Jangan pernah mengirim Client Secret lewat chat. Isi langsung di dashboard Vercel.

---

## 6A. Cloudinary — Bukti Aktivitas Manual

1. Buat akun <https://cloudinary.com/console>.
2. Ambil **Cloud name**, **API Key**, **API Secret**.
3. Set env API production:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=bakerman/manual-activities
CLOUDINARY_MOCK=false
MANUAL_ACTIVITY_SCREENSHOT_DAYS=7
MANUAL_ACTIVITY_MAX_MB=5
CRON_SECRET=<64 hex>
```

4. Generate `CRON_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Redeploy API.

### Auto-delete 7 hari

- **Vercel**: `server/vercel.json` sudah punya cron harian `0 3 * * *` ke `/api/v1/internal/cleanup-cloudinary`. Vercel mengirim `Authorization: Bearer <CRON_SECRET>`.
- **Docker/self-hosted**: job harian di `server/index.js` berjalan otomatis.
- **Manual**: `POST /api/v1/admin/activities/cleanup` (staff/admin) atau endpoint internal dengan secret.

### Catatan

- `CLOUDINARY_MOCK=false` di production.
- Screenshot JPG/PNG/WebP, maks 5 MB.
- Screenshot dihapus dari Cloudinary setelah 7 hari; record aktivitas tetap ada.
- URL Cloudinary bersifat publik; jangan unggah data sensitif.
- Screenshot adalah pencegah klaim palsu, bukan verifikasi kriptografis.

---

## 7. Checklist Production

- [ ] MongoDB Atlas connected.
- [ ] `npm test` 34/34 pass.
- [ ] `npm run lint` 0 error.
- [ ] `npm run build` sukses.
- [ ] API `/health` → `database: connected`.
- [ ] API `/ready` → `{"status":"ready"}`.
- [ ] `/api-docs/` → 404 di production.
- [ ] Security headers nginx ada.
- [ ] Docker image API & client build sukses.
- [ ] Client domain masuk Firebase Authorized Domains.
- [ ] `CORS_ORIGIN` hanya domain client.
- [ ] `TOKEN_ENCRYPTION_KEY` di-set dan disimpan aman.
- [ ] `STRAVA_DEMO_MODE=false`.
- [ ] Cloudinary credentials di-set, `CLOUDINARY_MOCK=false`.
- [ ] `CRON_SECRET` di-set (Vercel Cron).
- [ ] Upload aktivitas manual + screenshot berhasil.
- [ ] Cleanup screenshot kedaluwarsa berhasil.
- [ ] Login email/password berhasil.
- [ ] Order pickup berhasil.
- [ ] Staff dashboard bisa update status.
- [ ] Recap mingguan tampil.
- [ ] E2E smoke terhadap URL production:

```bash
cd client
E2E_BASE_URL=https://bakerman-balance.vercel.app npm run e2e
```

---

## 8. Rollback

- Vercel → Deployments → pilih deployment sebelumnya → **Promote to Production**.
- Database: gunakan Atlas backup/snapshot sebelum migrasi besar.
- Jangan rollback aplikasi yang sudah menulis data dengan schema baru tanpa mengecek kompatibilitas.

---

## 9. Catatan Keamanan

- `.env` dan service account **tidak boleh** masuk git.
- Rotasi `TOKEN_ENCRYPTION_KEY` akan membuat token Strava lama tidak bisa didekripsi; user perlu reconnect.
- Batasi `CORS_ORIGIN` ke domain production.
- Rate limit API sudah aktif; pertimbangkan WAF/rate limit tambahan di Vercel.
- Jika memakai Cloudflare di depan nginx, atur `TRUST_PROXY` sesuai jumlah hop (atau teruskan `CF-Connecting-IP`) agar rate limit memakai IP klien yang benar.
- Jangan mengaktifkan `STRAVA_DEMO_MODE` di production.
- Hapus atau ganti akun demo sebelum production nyata.
