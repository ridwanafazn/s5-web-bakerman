# Fase 6 — Production Hardening & Packaging

**Tanggal:** 14 November 2026

> **Dokumen historis.** Link tunnel di laporan ini sudah tidak dipakai. Production sekarang: **https://bakerman.ridwanafazn.my.id** dengan API **https://bakerman-api.vercel.app/api**. Lihat `docs/PHASE-8-REPORT.md`.

**Status:** ✅ Selesai; production live di Cloudflare Pages + Vercel
**Strava:** belum disiapkan — production sengaja `STRAVA_DEMO_MODE=false`

---

## 1. Tujuan Fase 6

Menyiapkan aplikasi agar siap deploy production, tanpa menunggu akun Atlas Cloud/Vercel/Strava:

- validasi environment production,
- readiness & observability,
- Docker image untuk API dan client,
- nginx sebagai reverse proxy + SPA fallback,
- Docker Compose production-like stack,
- smoke test end-to-end terhadap stack tersebut,
- CI build Docker image.

Deploy cloud aktual tetap menjadi langkah terpisah karena membutuhkan kredensial.

---

## 2. Yang Dibangun

### 2.1 Validasi Environment Production

`server/config/env.js` sekarang:

- Mewajibkan `MONGODB_URI`, `CORS_ORIGIN`, dan `FIREBASE_PROJECT_ID` diisi eksplisit di production (tidak memakai default dev).
- Menolak `NODE_ENV=production` jika `TOKEN_ENCRYPTION_KEY` bukan 64 karakter hex.
- Menolak `CORS_ORIGIN=*` di production (wajib origin eksplisit).
- Menyediakan `TRUST_PROXY` (default 1) untuk nginx/Vercel.
- Menyediakan `LOG_REQUESTS` (default aktif di production).
- `STRAVA_DEMO_MODE` selalu `false` di production, apa pun nilai env-nya.

Contoh production: `server/.env.production.example`.

### 2.2 Readiness & Observability

- `GET /ready` — ping MongoDB; `200 {"status":"ready"}` atau `503 {"status":"not_ready"}`.
- Request logger JSON (`server/middleware/requestLogger.js`) untuk method, path, status, durasi, IP.
- `trust proxy` agar rate limit membaca IP asli di balik nginx.
- Helmet CSP aktif di production (Swagger tidak tersedia).
- Swagger `/api-docs` hanya aktif di non-production.
- `X-Powered-By` tetap dimatikan.
- Graceful shutdown sudah ada (`SIGINT`/`SIGTERM`).

### 2.3 Docker & Nginx

- `server/Dockerfile` — Node 24 Alpine, `npm ci --omit=dev`, non-root `node`, healthcheck.
- `client/Dockerfile` — multi-stage Node build + nginx runtime.
- `client/nginx.conf`:
  - SPA fallback `try_files $uri $uri/ /index.html`.
  - Proxy `/api`, `/health`, `/ready` ke service `api:5050`.
  - Cache immutable untuk `/assets/`, no-cache untuk `index.html`.
  - Gzip.
  - Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
  - `server_tokens off`.
- `docker-compose.prod.yml`:
  - Project terisolasi `name: bakerman-prod`.
  - Mongo Atlas Local (single-node replica set, mendukung transaksi).
  - API production + healthcheck.
  - Client nginx port `8080:80`.
  - Volume terpisah dari development.
- `server/.dockerignore`, `client/.dockerignore`.
- `client/.env.production.example`.

### 2.4 CI

`.github/workflows/ci.yml` sekarang punya job tambahan:

- build image API (`server/Dockerfile`),
- build image client (`client/Dockerfile`),
- cache Buildx GHA terpisah untuk API/client.

### 2.5 Perbaikan Kecil

- `new: true` Mongoose diganti `returnDocument: 'after'` (menghilangkan warning production).
- Test baru: `/ready` + 3 test validasi env production.

---

## 3. Bukti Verifikasi

### 3.1 Server Tests

```text
npm test
tests 29
pass 29
fail 0
```

> Setelah Fase 7 (aktivitas manual + Cloudinary): **34/34 pass**.

Test baru:
- `/ready` mengembalikan 503 saat database terputus.
- production menolak `TOKEN_ENCRYPTION_KEY` lemah.
- production menolak `CORS_ORIGIN=*`.
- production menerima origin eksplisit + key valid.

### 3.2 Docker Stack

```text
docker compose -f docker-compose.prod.yml up -d --build
→ mongo healthy
→ api healthy
→ client healthy
```

Container:

| Container | Image | Port |
|---|---|---|
| `bakerman-prod-client` | `bakerman-prod-client` | `8080:80` |
| `bakerman-prod-api` | `bakerman-prod-api` | internal 5050 |
| `bakerman-prod-mongo` | `mongodb/mongodb-atlas-local` | internal 27017 |

### 3.3 Production Endpoint

```text
GET http://localhost:8080/            → 200
GET http://localhost:8080/health      → 200 {"database":"connected","environment":"production"}
GET http://localhost:8080/ready       → 200 {"status":"ready","database":"connected"}
GET http://localhost:8080/api/v1/products → 200
GET http://localhost:8080/api-docs/   → 404  (sengaja tertutup)
```

Security headers:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-cache (index.html)
```

### 3.4 Order Transaksional di Production Stack

```text
POST /api/v1/orders (1x Roti Susu) → 201, kode JEFAZYMR, sugar 8 g
GET  /api/v1/me → consumed 8 g, remaining 82 g
POST /api/v1/orders/:id/cancel → status canceled
GET  /api/v1/me → consumed 0 g, remaining 90 g
```

Refund budget dan stok berjalan di stack production.

### 3.5 Strava & Swagger di Production

```text
POST /api/v1/strava/demo → 403 (STRAVA_DEMO_DISABLED)
GET  /api-docs/          → 404
```

Sesuai ekspektasi: Strava asli belum disiapkan, mode simulasi dimatikan di production.

### 3.6 E2E Production Stack

```text
E2E_BASE_URL=http://localhost:8080 npm run e2e
→ 8 langkah, 0 console error

E2E_BASE_URL=https://assistant-source-adjustments-exotic.trycloudflare.com npm run e2e
→ PASS filter riwayat pesanan — 2 order, kartu=true
→ 8 langkah, 0 console error
```

> Setelah Fase 7 (langkah aktivitas manual ditambahkan): **9 langkah, 0 console error** (manual dilewati jika Cloudinary belum dikonfigurasi).

### 3.7 JSON Request Log

Contoh log API container:

```json
{"level":"info","msg":"request","method":"POST","path":"/api/v1/orders","status":201,"durationMs":48,"ip":"172.20.0.1"}
{"level":"info","msg":"request","method":"GET","path":"/api/v1/me/recap?weeks=4","status":200,"durationMs":14,"ip":"172.20.0.1"}
```

### 3.8 Perbaikan Mongo Dev

Saat stack production pertama kali dibuat, container Mongo dev ikut ter-recreate dan hostname replica set berubah. Gejalanya:

```text
MongoServerError: node is not in primary or recovering state
Our replica set config is invalid or we are not a member of it
```

Perbaikan permanen:

- `docker-compose.yml` dev sekarang memakai `hostname: bakerman-mongo`.
- Replica set dev bernama `bakerman-mongo` (stabil).
- Volume dev dibuat ulang, lalu data demo di-restore dari snapshot production.
- Verifikasi: `db.hello().isWritablePrimary = true`, `setName = bakerman-mongo`.
- Data dev: 4 user, 4 order, 4 budget period, 10 produk.
- E2E dev tunnel kembali **8 langkah, 0 console error**.

### 3.9 Race Condition Filter Pesanan

Ditemukan saat E2E lewat tunnel (latensi lebih tinggi): respons request `status=all` yang masih berjalan bisa menimpa hasil `status=completed`, sehingga count menampilkan 4 padahal filter Selesai aktif.

Perbaikan di `client/src/pages/Orders.jsx`:

- `requestIdRef` menandai request terbaru.
- Respons lama diabaikan jika `requestId !== requestIdRef.current`.
- Filter baru juga langsung mengosongkan `pagination` dan menampilkan loading.

Hasil E2E setelah perbaikan: filter Selesai menampilkan **2 order** di preview maupun production tunnel.

---

## 4. Akses

### Production-like Docker stack (lokal)

- Client: **http://localhost:8080**
- API internal: `api:5050` (tidak diekspos)
- Mongo internal: `mongo:27017` (tidak diekspos)

### Tunnel production (sementara)

**https://assistant-source-adjustments-exotic.trycloudflare.com**

### Tunnel dev preview (fitur + Strava demo)

**https://opponents-bras-prayers-gas.trycloudflare.com**

> Keduanya Cloudflare Quick Tunnel, sementara, dan laptop harus tetap menyala.

### Akun demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

Data demo disalin dari dev ke production stack: member **66 g**, **4 order** (2 selesai, 2 dibatalkan).

---

## 5. Cara Menjalankan Ulang

```powershell
# 1. Generate key (sekali; simpan)
$env:TOKEN_ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Build & start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Seed pertama kali (destruktif; hanya untuk demo)
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed

# 4. Cek
curl http://localhost:8080/ready

# 5. Log
docker compose -f docker-compose.prod.yml logs -f api

# 6. Stop
docker compose -f docker-compose.prod.yml down
```

---

## 6. Troubleshooting

### Mongo dev tidak punya primary setelah container recreate

Gejala:

```text
MongoServerError: node is not in primary or recovering state
db.hello().isWritablePrimary = false
```

Penyebab: Atlas Local menyimpan replica set config dengan hostname container lama. Setelah container dibuat ulang, hostname berubah.

Perbaikan (data tetap aman):

```powershell
$hostname = docker inspect bakerman-mongo --format '{{.Config.Hostname}}'
docker exec bakerman-mongo mongosh --quiet --eval "const cfg=rs.conf(); cfg.members[0].host='$($hostname):27017'; rs.reconfig(cfg,{force:true})"
```

Tunggu beberapa detik sampai `PRIMARY`, lalu cek:

```powershell
docker exec bakerman-mongo mongosh --quiet --eval "db.hello().isWritablePrimary"
```

### Port 8080 sudah dipakai

Ganti mapping di `docker-compose.prod.yml`:

```yaml
ports:
  - "8081:80"
```

### `TOKEN_ENCRYPTION_KEY` required

Compose sengaja menolak start tanpa key production. Set env sebelum semua command Compose:

```powershell
$env:TOKEN_ENCRYPTION_KEY = "...64 hex..."
```

### Dev dan prod saling mengganggu

Production stack memakai project `bakerman-prod` dan container `bakerman-prod-*`. Dev memakai project folder `s5-web-bakerman` dan container `bakerman-mongo`. Jangan menghapus volume dev.

---

## 7. Batasan

- **Deploy cloud belum dilakukan** — butuh Atlas Cloud, Vercel, Firebase production, domain.
- Tunnel Quick Tunnel sementara; bukan pengganti production URL.
- Docker stack ini single-host, bukan orchestrator multi-node.
- Tidak ada TLS internal antara nginx dan API (masih di network Docker privat).
- Belum ada backup otomatis, metrics/Prometheus, tracing, atau alerting.
- Strava asli belum aktif; production `STRAVA_DEMO_MODE=false`.
- Payment gateway tetap tidak ada (pay at pickup).

---

## 8. Langkah Berikutnya

> ✅ **Fase 7 selesai:** alternatif Strava berupa aktivitas manual + screenshot Cloudinary + auto-delete 7 hari. Lihat `docs/PHASE-7-REPORT.md`.

1. Deploy Atlas Cloud + Vercel API + Vercel client.
2. Isi Firebase production service account + authorized domains.
3. Isi Cloudinary credentials + `CRON_SECRET`, set `CLOUDINARY_MOCK=false`.
4. Isi Strava Client ID/Secret (opsional; butuh langganan Strava).
5. Aktifkan GitHub Actions (CI + Docker build).
6. Commit/push perubahan.
