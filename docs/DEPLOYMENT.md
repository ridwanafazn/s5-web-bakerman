# Deployment — Bakerman Balance

Panduan deploy production: **Cloudflare Pages (frontend) + Vercel (API) + MongoDB Atlas + Firebase Auth + Cloudinary**.

> **Status:** Production sudah live.
> Frontend: **https://bakerman.ridwanafazn.my.id** · API: **https://bakerman-api.vercel.app/api**

---

## 1. Arsitektur Production

```text
Browser (HP/laptop)
  │
  ├── https://bakerman.ridwanafazn.my.id   → Cloudflare Pages (Vite static, SPA)
  │        │
  │        └── VITE_API_URL → https://bakerman-api.vercel.app/api
  │
  └── https://bakerman-api.vercel.app      → Express API (Vercel Node 24.x)
           │
           ├── MongoDB Atlas Cloud (database: bakerman)
           ├── Firebase Admin (verifikasi token)
           └── Cloudinary (bukti aktivitas manual)
```

Production **tidak memakai Cloudflare Tunnel**. Frontend dan API hosted permanen.

---

## 2. Cloudflare Pages (Frontend)

Frontend live:

- **https://bakerman.ridwanafazn.my.id**
- **https://bakerman-balance.pages.dev**

Konfigurasi:

- Project: `bakerman-balance`
- Source: GitHub `ridwanafazn/s5-web-bakerman`
- Production branch: `main`
- Root: `client`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://bakerman-api.vercel.app/api`

Custom domain:

- `bakerman.ridwanafazn.my.id`
- CNAME `bakerman` → `bakerman-balance.pages.dev` (proxied)
- Status: active

Deploy:

- Push ke `main` → build otomatis.
- Atau Cloudflare Dashboard → Workers & Pages → `bakerman-balance` → Deployments.
- Jika URL API berubah, update `VITE_API_URL` di Pages lalu rebuild.

---

## 3. MongoDB Atlas Cloud

Production memakai Atlas:

- Database user: `bakerman_app`
- Database: `bakerman`
- Connection memakai **direct seed list** (bukan SRV) karena resolver lokal mengembalikan `querySrv EBADRESP`.

Langkah umum:

1. Login <https://cloud.mongodb.com>.
2. Buat cluster (M0 cukup untuk portfolio).
3. Buat database user dengan password kuat.
4. Network Access: tambahkan `0.0.0.0/0` (dengan password kuat) atau private endpoint.
5. Ambil connection string, isi `MONGODB_URI` di `server/.env` dan Vercel.
6. Seed production (hati-hati: seed menghapus produk & stok):

```bash
cd server
SEED_FORCE=true npm run seed
```

> Jangan jalankan seed berulang di production jika sudah ada data nyata.

---

## 4. Firebase Production

1. Buka Firebase Console → project production.
2. Authentication → Sign-in method → aktifkan **Email/Password** dan **Google**.
3. Authentication → Settings → **Authorized domains**:
   - `localhost`
   - `bakerman.ridwanafazn.my.id`
   - `bakerman-balance.pages.dev`
4. Project settings → Service accounts → **Generate new private key**.
5. Simpan JSON sebagai env `FIREBASE_SERVICE_ACCOUNT` (JSON string) atau file `server/service-account.json`. **Jangan commit file ini.**

---

## 5. Deploy API (Vercel)

### 5.1 Project

- Project: `bakerman-api`
- Scope: `ridwan-ahmad-fauzans-projects`
- Production URL: `https://bakerman-api.vercel.app`
- Runtime: Node **24.x**
- Deployment Protection: **disabled** (agar bisa diakses Pages)
- Root directory: `server`

### 5.2 Environment Variables

Set di Vercel → project `bakerman-api` → Settings → Environment Variables (Production):

```env
NODE_ENV=production
PORT=5050

MONGODB_URI=mongodb://bakerman_app:<password>@<host1>,<host2>,<host3>/bakerman?replicaSet=...

CORS_ORIGIN=https://bakerman.ridwanafazn.my.id,https://bakerman-balance.pages.dev,http://localhost:8080

FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

ADMIN_EMAILS=...
STAFF_EMAILS=...

APP_TIMEZONE=Asia/Jakarta
TOKEN_ENCRYPTION_KEY=<64 hex chars>

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=
STRAVA_DEMO_MODE=false

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=bakerman/manual-activities
CLOUDINARY_MOCK=false
MANUAL_ACTIVITY_SCREENSHOT_DAYS=7
MANUAL_ACTIVITY_MAX_MB=5
CRON_SECRET=<64 hex chars>
DISABLE_CLOUDINARY_CLEANUP_JOB=false
LOG_REQUESTS=true
TRUST_PROXY=1
```

Generate secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5.3 Deploy

```powershell
vercel link --cwd server --scope ridwan-ahmad-fauzans-projects --project bakerman-api
vercel --cwd server --prod --yes --scope ridwan-ahmad-fauzans-projects
```

Atau hubungkan repo GitHub ke project Vercel dengan **Root Directory = `server`**.

`server/vercel.json` mengarahkan semua request ke Express.

### 5.4 Catatan dependency Vercel

`firebase-admin` menarik `jwks-rsa@4` → `jose@6` (ESM) yang gagal di runtime Vercel dengan `ERR_REQUIRE_ESM`. Solusi yang dipakai:

```json
"overrides": {
  "jwks-rsa": "3.2.0",
  "jose": "4.15.4"
}
```

Jangan hapus override ini tanpa menguji ulang Firebase Admin di Vercel.

### 5.5 DB readiness

- `server/config/db.js` menyimpan promise koneksi Mongo.
- `server/app.js` menunggu koneksi DB sebelum memproses request `/api`.
- `/ready` melakukan ping Atlas dan mengembalikan 503 jika belum siap.
- Ini mencegah 503 acak saat cold start.

### 5.6 Verifikasi API

```bash
curl https://bakerman-api.vercel.app/health
# {"status":"ok","database":"connected","environment":"production"}

curl https://bakerman-api.vercel.app/ready
# {"status":"ready","database":"connected"}

curl https://bakerman-api.vercel.app/api/v1/products
# {"products":[...]} → 10 produk
```

---

## 6. Strava Production

> Sejak Juni 2026, Strava mewajibkan langganan berbayar untuk API app Standard Tier. Saat ini Strava **sengaja tidak dikonfigurasi**; gunakan **aktivitas manual + Cloudinary**.

Jika nanti tersedia:

1. Buka <https://www.strava.com/settings/api>.
2. Buat API application:
   - Website: `https://bakerman.ridwanafazn.my.id`
   - Authorization Callback Domain: `bakerman-api.vercel.app`
3. Isi `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI` di Vercel.
4. Set `STRAVA_DEMO_MODE=false`.
5. Redeploy API.

> Jangan pernah mengirim Client Secret lewat chat. Isi langsung di dashboard Vercel.

---

## 7. Cloudinary — Bukti Aktivitas Manual

Production memakai Cloudinary asli:

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

### Auto-delete 7 hari

- **Vercel**: `server/vercel.json` punya cron harian `0 3 * * *` ke `/api/v1/internal/cleanup-cloudinary`. Vercel mengirim `Authorization: Bearer <CRON_SECRET>`.
- **Docker/self-hosted**: job harian di `server/index.js`.
- **Manual**: `POST /api/v1/admin/activities/cleanup` (staff/admin) atau endpoint internal dengan secret.

### Catatan

- Screenshot JPG/PNG/WebP, maks 5 MB.
- Screenshot dihapus dari Cloudinary setelah 7 hari; record aktivitas tetap ada.
- URL Cloudinary bersifat publik; jangan unggah data sensitif.
- Screenshot adalah pencegah klaim palsu, bukan verifikasi kriptografis.

---

## 8. Alternatif: Docker Compose Production (self-hosted/lokal)

Repo menyertakan stack production-like:

- `server/Dockerfile` — API Node production, non-root, healthcheck.
- `client/Dockerfile` — build Vite + nginx runtime.
- `client/nginx.conf` — SPA fallback, proxy `/api`, security headers.
- `docker-compose.prod.yml` — API + nginx di port 8080, membaca `server/.env`.

```powershell
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed
curl http://localhost:8080/ready
```

Catatan:

- `STRAVA_DEMO_MODE=false` dipaksa.
- `TOKEN_ENCRYPTION_KEY` wajib.
- `CORS_ORIGIN` wajib origin eksplisit.
- Untuk self-hosted dengan domain, taruh reverse proxy TLS di depan port 8080.

---

## 9. Checklist Production

- [x] MongoDB Atlas connected.
- [x] `npm test` 34/34 pass.
- [x] `npm run lint` 0 error.
- [x] `npm run build` sukses.
- [x] API `/health` → `status: ok` (liveness).
- [x] API `/ready` → `{"status":"ready","database":"connected"}` (otoritatif).
- [x] `/api-docs/` → 404 di production.
- [x] Client domain masuk Firebase Authorized Domains (email/password).
- [x] `CORS_ORIGIN` hanya domain client.
- [x] `TOKEN_ENCRYPTION_KEY` di-set dan disimpan aman.
- [x] `STRAVA_DEMO_MODE=false`.
- [x] Cloudinary credentials di-set, `CLOUDINARY_MOCK=false`.
- [x] `CRON_SECRET` di-set (Vercel Cron).
- [x] Upload aktivitas manual + screenshot berhasil.
- [x] Login email/password berhasil.
- [x] Order pickup berhasil.
- [x] Staff dashboard bisa update status.
- [x] Recap mingguan tampil.
- [x] E2E smoke terhadap custom domain: 9 langkah, 0 console error.

```bash
cd client
E2E_BASE_URL=https://bakerman.ridwanafazn.my.id npm run e2e
```

- [ ] Google sign-in (butuh authorized domain Firebase).
- [ ] Strava asli (butuh langganan).
- [ ] Hapus akun demo sebelum public launch.

---

## 10. Rollback

- **Vercel**: Deployments → pilih deployment sebelumnya → **Promote to Production**.
- **Cloudflare Pages**: Deployments → pilih deployment sebelumnya → **Rollback**.
- **Database**: gunakan Atlas backup/snapshot sebelum migrasi besar.
- Jangan rollback aplikasi yang sudah menulis data dengan schema baru tanpa mengecek kompatibilitas.

---

## 11. Catatan Keamanan

- `.env` dan service account **tidak boleh** masuk git.
- Rotasi `TOKEN_ENCRYPTION_KEY` membuat token Strava lama tidak bisa didekripsi; user perlu reconnect.
- Batasi `CORS_ORIGIN` ke domain production.
- Rate limit API sudah aktif; pertimbangkan WAF/rate limit tambahan di Vercel.
- Jika memakai Cloudflare di depan nginx, atur `TRUST_PROXY` sesuai jumlah hop.
- Jangan mengaktifkan `STRAVA_DEMO_MODE` di production.
- Hapus atau ganti akun demo sebelum production nyata.
