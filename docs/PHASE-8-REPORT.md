# Fase 8 — UI Fix, Cloudflare Pages & Commit/Push

**Tanggal:** 14 November 2026
**Status:** ✅ Frontend live di Cloudflare Pages + domain custom; API via Cloudflare Tunnel
**Commit:** `126077e` (aplikasi), `af04876`–`36eb256` (docs deployment), `ae0affa` (ignore service account), plus commit audit env terbaru — sudah di-push ke `origin/main`

---

## 1. Perbaikan UI Landing

Gejala di desktop: section produk landing page memanjang ±3.892 px, grid tidak terbentuk, gambar produk membesar penuh.

Penyebab:

- Landing page memakai `ProductCard` dan class `.catalog-grid`.
- `catalog.css` tidak di-import di landing, sehingga `.catalog-grid` menjadi `display: block` dan card tidak punya style.

Perbaikan:

- `client/src/components/ProductCard.jsx` sekarang meng-import `../styles/catalog.css`.
- Verifikasi desktop 1920×1200:
  - `display: grid`
  - 3 kolom (377 px per card)
  - section produk ±975 px
  - body height ±2.846 px
- Mobile tetap 1 kolom.

---

## 2. Cloudflare Pages (Frontend)

Project:

- Nama: `bakerman-balance`
- Account: `491877dfe9bd12e5bce536e6da18da15`
- Source: GitHub `ridwanafazn/s5-web-bakerman`
- Production branch: `main`
- Root directory: `client`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://assistant-source-adjustments-exotic.trycloudflare.com/api`

Deployment:

- Production: **https://bakerman-balance.pages.dev**
- Custom domain: **https://bakerman.ridwanafazn.my.id**
- CNAME: `bakerman` → `bakerman-balance.pages.dev` (proxied)
- Deployment terakhir: `1059a12a-5660-4060-b117-d904ddee535f` (env API URL terbaru)
- Build & deploy: **success**

Verifikasi:

```text
GET https://bakerman-balance.pages.dev/           → 200
GET https://bakerman.ridwanafazn.my.id/          → 200
Landing: hero + 3 kartu, grid=grid
Login member → /balance → budget 66 g
Recap: Order aktif 2, Selesai 2, on-budget 1/1
/menu → 10 produk
E2E domain custom: 9 langkah, 0 console error
Aktivitas manual + Cloudinary asli: 66 g → 76 g → 66 g
Console errors: 0
```

---

## 3. API (Cloudflare Tunnel)

API Express + MongoDB **tidak bisa** dijalankan di Cloudflare Workers free plan:

- Workers tidak mendukung Express/Mongoose + koneksi MongoDB seperti Node biasa.
- Cloudflare Containers membutuhkan **Workers Paid plan** (akun saat ini Free Website).
- Rewrite ke D1/Workers akan mengubah besar arsitektur.

Karena itu, API saat ini:

- Berjalan di Docker production stack lokal (`localhost:8080` nginx → `api:5050`).
- Docker API membaca `server/.env` (`env_file`) + mount `server/service-account.json`.
- **Cloudinary asli aktif** (`CLOUDINARY_MOCK=false`), sudah diuji upload + delete.
- **Firebase service account aktif** (file JSON), login member/admin/staff berhasil.
- **CRON_SECRET** aktif.
- **MongoDB masih lokal Docker** karena Atlas menolak autentikasi (`bad auth`).
- Diekspos lewat **Cloudflare Quick Tunnel**:
  **https://assistant-source-adjustments-exotic.trycloudflare.com**
- Pages frontend memanggil `.../api`.
- CORS API mengizinkan:
  - `https://bakerman.ridwanafazn.my.id`
  - `https://bakerman-balance.pages.dev`
  - `http://localhost:8080`

**Keterbatasan:** API masih bergantung pada laptop/Docker yang menyala. Ini bukan API yang dihosting penuh di Cloudflare. Untuk API cloud sejati, perlu Vercel/Render/VPS atau Cloudflare Workers Paid + Containers.

**Atlas:** `MONGODB_URI` sudah diisi dan sudah diubah ke direct seed list (SRV DNS lokal bermasalah), tetapi Atlas membalas `bad auth`. Perlu verifikasi/reset password database user Atlas.

---

## 3A. Audit Env (14 Nov 2026)

| Variable | Status |
|---|---|
| `MONGODB_URI` | SET — Atlas direct seed list; **auth gagal** |
| `CORS_ORIGIN` | SET — custom domain + Pages |
| `FIREBASE_PROJECT_ID` | SET |
| `FIREBASE_SERVICE_ACCOUNT` | SET — `./service-account.json`, file ada |
| `ADMIN_EMAILS` | SET — email Anda + demo admin |
| `STAFF_EMAILS` | SET — email Anda + demo staff |
| `TOKEN_ENCRYPTION_KEY` | SET — 64 hex |
| `STRAVA_CLIENT_ID` / `SECRET` | EMPTY — sengaja, tidak berlangganan |
| `STRAVA_DEMO_MODE` | false |
| `CLOUDINARY_CLOUD_NAME` | SET |
| `CLOUDINARY_API_KEY` / `SECRET` | SET — upload asli berhasil |
| `CLOUDINARY_MOCK` | false (sebelumnya true, diperbaiki) |
| `CLOUDINARY_FOLDER` | `bakerman/manual-activities` |
| `MANUAL_ACTIVITY_SCREENSHOT_DAYS` | 7 |
| `MANUAL_ACTIVITY_MAX_MB` | 5 |
| `CRON_SECRET` | SET — 64 hex |
| `DNS_SERVERS` | 8.8.8.8,1.1.1.1 |

Perbaikan yang dilakukan:

- `MONGODB_URI` ditambah database `/bakerman` (sebelumnya berakhir di `/`).
- `CLOUDINARY_MOCK` diubah `true → false`.
- `STRAVA_DEMO_MODE` diubah `true → false`.
- `ADMIN_EMAILS`/`STAFF_EMAILS` ditambah email Anda + akun demo agar E2E staff tetap jalan.
- Docker API sekarang membaca `server/.env` + mount service account.
- Ditambah dukungan `DNS_SERVERS` untuk SRV Atlas.

---

## 4. Commit & Push

```text
commit 126077e
feat: complete Bakerman Balance app (phases 1-7)
branch main → origin/main
```

GitHub mengembalikan peringatan Dependabot:

```text
6 vulnerabilities (2 high, 3 moderate, 1 low)
```

Catatan:

- `server npm audit --omit=dev` → **0 vulnerabilities**.
- `client npm audit --omit=dev` → **4 high** di transitive Firebase Firestore (`@grpc/grpc-js`), padahal aplikasi hanya memakai Firebase Auth.
- Perbaikan `npm audit fix --force` akan menurunkan Firebase ke versi breaking; belum dilakukan.

---

## 5. Verifikasi Teknis

```text
Server tests : 34/34 pass
Client lint  : 0 error
Client build : sukses
E2E lokal    : 9 langkah, 0 console error
E2E prod     : 9 langkah, 0 console error
Aktivitas manual production: 66 g → 76 g → 66 g (Cloudinary asli)
API upload   : OK, screenshotUrl=true, mock=false
Pages login  : berhasil, budget 66 g, recap tampil
Custom domain: 200 + login berhasil
```

---

## 6. Yang Masih Manual

1. **Atlas auth**: `MONGODB_URI` sudah diisi, tetapi Atlas membalas `bad auth`. Reset/verifikasi password database user Atlas, lalu ganti `MONGODB_URI` dan restart API.
2. **API hosting permanen**: pindah dari Quick Tunnel ke Vercel/Render/VPS atau Cloudflare Containers (Workers Paid).
3. **Firebase Authorized Domains**: tambahkan `bakerman.ridwanafazn.my.id` dan `bakerman-balance.pages.dev` jika ingin Google sign-in.
4. **Update Pages env** jika URL API berubah:
   `VITE_API_URL=https://<api-domain>/api` → rebuild Pages.
5. **Dependabot**: evaluasi upgrade Firebase / hapus dependency Firestore jika tidak dipakai.
6. **Strava asli**: opsional, butuh langganan Strava.

**Sudah selesai:** Cloudinary asli, Firebase service account, CRON_SECRET, CORS, upload screenshot, E2E production.

---

## 7. Link

| Keperluan | URL |
|---|---|
| Frontend production | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | https://bakerman-balance.pages.dev |
| API (tunnel) | https://assistant-source-adjustments-exotic.trycloudflare.com/api |
| Dev preview | https://opponents-bras-prayers-gas.trycloudflare.com |
| Production lokal | http://localhost:8080 |
| Dev lokal | http://localhost:5173 |

> Tunnel dan API lokal bersifat sementara; laptop harus menyala.
