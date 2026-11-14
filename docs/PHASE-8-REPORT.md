# Fase 8 — UI Fix, Cloudflare Pages & Vercel API

**Tanggal:** 14 November 2026
**Status:** ✅ FE live di Cloudflare Pages; BE live di Vercel; MongoDB Atlas; Cloudinary asli
**Commit terbaru:** `1d591e5` (kode) + docs final — sudah di-push ke `origin/main`

---

## 1. Perbaikan UI Landing

Gejala: section produk landing page memanjang ±3.892 px, grid tidak terbentuk, gambar membesar.

Penyebab:

- Landing memakai `ProductCard` + `.catalog-grid`, tetapi `catalog.css` tidak di-import.

Perbaikan:

- `client/src/components/ProductCard.jsx` import `../styles/catalog.css`.
- Desktop 1920×1200: grid 3 kolom, card 377 px, section ±975 px.
- Mobile tetap 1 kolom.
- Sudah diverifikasi di Pages + domain custom.

---

## 2. Frontend — Cloudflare Pages

- Project: `bakerman-balance`
- Source: GitHub `ridwanafazn/s5-web-bakerman`
- Root: `client`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://bakerman-api.vercel.app/api`
- Production: **https://bakerman-balance.pages.dev**
- Custom domain: **https://bakerman.ridwanafazn.my.id**
- CNAME: `bakerman` → `bakerman-balance.pages.dev` (proxied)
- Status domain: **active**
- Deployment terakhir: `c0128f25-b2ac-4f00-9e9b-83bd269f6f73` — success

---

## 3. Backend — Vercel + MongoDB Atlas

- Project Vercel: `bakerman-api`
- Production: **https://bakerman-api.vercel.app**
- Runtime: Node **24.x**
- Deployment Protection: **disabled**
- Env production: lengkap (Mongo, Firebase, Cloudinary, token, CORS, cron)
- MongoDB: **Atlas** (`bakerman_app`, database `bakerman`, direct seed list)
- Cloudinary: **asli** (`CLOUDINARY_MOCK=false`), upload + delete teruji
- Firebase Admin: service account JSON, verifikasi token teruji
- DB readiness: request API menunggu koneksi Mongo sebelum diproses
- Dependency fix: `jwks-rsa@3.2.0` + `jose@4.15.4` override agar Vercel tidak kena `ERR_REQUIRE_ESM`
- Cron cleanup Cloudinary: `server/vercel.json`
- **Tidak ada tunnel untuk production.** Quick Tunnel hanya dipakai untuk dev preview lokal.

CORS API:

- `https://bakerman.ridwanafazn.my.id`
- `https://bakerman-balance.pages.dev`
- `http://localhost:8080`

---

## 4. Audit Env

| Variable | Status |
|---|---|
| `MONGODB_URI` | ✅ Atlas auth OK, database `/bakerman` |
| `CORS_ORIGIN` | ✅ custom + Pages |
| `FIREBASE_PROJECT_ID` | ✅ |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ JSON service account |
| `ADMIN_EMAILS` | ✅ email Anda + demo admin |
| `STAFF_EMAILS` | ✅ email Anda + demo staff |
| `TOKEN_ENCRYPTION_KEY` | ✅ 64 hex |
| `STRAVA_CLIENT_ID` / `SECRET` | ⬜ kosong — sengaja |
| `STRAVA_DEMO_MODE` | ✅ false |
| `CLOUDINARY_CLOUD_NAME` | ✅ |
| `CLOUDINARY_API_KEY` / `SECRET` | ✅ |
| `CLOUDINARY_MOCK` | ✅ false |
| `CRON_SECRET` | ✅ 64 hex |
| `MANUAL_ACTIVITY_SCREENSHOT_DAYS` | ✅ 7 |
| `MANUAL_ACTIVITY_MAX_MB` | ✅ 5 |

Perbaikan yang dilakukan:

- `MONGODB_URI` ditambah database `/bakerman`.
- `CLOUDINARY_MOCK` diubah `true → false`.
- `STRAVA_DEMO_MODE` diubah `true → false`.
- `ADMIN_EMAILS`/`STAFF_EMAILS` ditambah email Anda + akun demo.
- Docker/Vercel membaca env production.
- Vercel Node dipin ke 24.x.
- Dependency `jose`/`jwks-rsa` di-override agar kompatibel.

---

## 5. Verifikasi

```text
Server tests        : 34/34 pass
Client lint         : 0 error
Client build        : sukses
Vercel /health      : status ok (liveness; field database bisa `disconnected` saat cold start)
Vercel /ready       : {"status":"ready","database":"connected"} (otoritatif)
Vercel /products    : 10 produk
E2E custom domain   : 9 langkah, 0 console error
Aktivitas manual    : 90 g → 100 g → 90 g (Cloudinary asli)
Pages login         : berhasil
Custom domain       : 200
```

---

## 6. Commit & Push

```text
1d591e5 feat: deploy API to Vercel with Atlas, Cloudinary and DB readiness
1656d01 docs: include latest commit hash
34f4349 feat: wire production env, Cloudinary and stable tunnel checks
```

Branch `main` sudah sinkron dengan `origin/main`.

---

## 7. Yang Masih Manual

1. **Firebase Authorized Domains**: tambahkan `bakerman.ridwanafazn.my.id` dan `bakerman-balance.pages.dev` untuk Google sign-in.
2. **Dependabot**: 6 vulnerabilities (2 high, 3 moderate, 1 low); server audit 0, client 4 high transitive Firestore.
3. **Strava asli**: opsional, butuh langganan Strava.
4. **Domain API custom**: opsional, misal `api.bakerman.ridwanafazn.my.id` → Vercel.
5. **Hapus akun demo** sebelum public launch.

---

## 8. Link

| Keperluan | URL |
|---|---|
| Frontend production | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | https://bakerman-balance.pages.dev |
| API production | **https://bakerman-api.vercel.app/api** |
| API health | https://bakerman-api.vercel.app/health |
| API ready | https://bakerman-api.vercel.app/ready |
| Dev lokal | http://localhost:5173 |
| Production lokal | http://localhost:8080 |
