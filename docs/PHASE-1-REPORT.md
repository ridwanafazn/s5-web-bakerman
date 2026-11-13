# Fase 1 — Fondasi Backend & Keamanan

**Tanggal:** 13 November 2026
**Status:** ✅ Selesai
**Cakupan:** auth Firebase, model data baru, API v1, seed, keamanan dasar, test setup, kompatibilitas UI lama.

---

## 1. Yang Dibangun

### 1.1 Firebase Auth di server

- `firebase-admin@14.5.1` (modular API: `firebase-admin/app`, `firebase-admin/auth`).
- `verifyIdToken` berjalan **hanya dengan `FIREBASE_PROJECT_ID`** — service account tidak wajib untuk verifikasi token.
- Middleware:
  - `requireAuth` — validasi Bearer token.
  - `loadUser` — upsert user berdasarkan `firebaseUid`, link ke user lama via email.
  - `requireRole('staff'|'admin')`.
- Role ditentukan **server-side** dari `ADMIN_EMAILS` / `STAFF_EMAILS`.
- Email tidak lagi dipercaya dari body/query di API v1.

### 1.2 Model baru

| Model | Fungsi |
|---|---|
| `User` | `firebaseUid`, role, budget preset/mode, Strava (future), field legacy |
| `Product` | slug, gula, sugar level, tags, allergen, ingredients, active |
| `Location` | outlet (schema siap multi-outlet) |
| `DailyStock` | stok per produk/outlet/tanggal |
| `BudgetPeriod` | budget mingguan per user |
| `Order` | order + item + pickup + status (model siap, route Fase 4) |
| `StravaActivity` | dedup aktivitas Strava (model siap, route Fase 3) |
| `PickupSlot` | kapasitas slot pickup |
| `AuditLog` | audit trail (model siap) |

Model lama `Purchase` tetap ada untuk kompatibilitas UI.

### 1.3 API v1

| Method | Endpoint | Status |
|---|---|---|
| POST | `/api/v1/auth/session` | ✅ |
| GET/PATCH | `/api/v1/me` | ✅ |
| GET | `/api/v1/products` | ✅ |
| GET | `/api/v1/products/:slug` | ✅ |
| GET | `/api/v1/locations` | ✅ |
| GET | `/api/v1/menu/today` | ✅ |
| GET | `/api/v1/pickup-slots` | ✅ |
| GET | `/api/v1/admin/ping` | ✅ |

### 1.4 Keamanan dasar

- Helmet, CORS allowlist (`CORS_ORIGIN`), JSON limit 100 KB.
- Rate limit global + auth limit.
- Validasi body dengan Zod.
- Error handler JSON; detail 500 disembunyikan di production.
- `x-powered-by` dimatikan.
- Env divalidasi saat boot.
- `.env` client tidak lagi di-track Git (CORS key lama dibersihkan dari index).

### 1.5 Seed

- **10 produk** (8–35 g gula), termasuk item tinggi gula.
- **1 outlet** fiktif: Bakerman Dago, Bandung.
- **Stok harian** untuk 3 hari.
- **Pickup slot** 18 slot/hari selama 7 hari (kapasitas 8/slot).
- **Demo admin**: `bakerman@gmail.com`.

### 1.6 Test

- `npm test` → **11/11 pass**:
  - Week boundary Asia/Jakarta.
  - Tier bonus Strava (30/60/90/150 menit).
  - Sugar level & preset budget.
  - Health, 401 tanpa token, 401 token invalid, 403 role, 503 DB down.

### 1.7 Frontend

- `client/src/lib/api.js`: Axios instance, timeout 15 s, Firebase token interceptor, error normalizer.
- `client/.env.example` untuk `VITE_API_URL`.
- UI lama tetap berjalan lewat endpoint legacy.

### 1.8 MCP

- **MongoDB MCP** aktif via Docker (`mongodb/mongodb-mcp-server`), read-only, terhubung ke `host.docker.internal:27017/bakerman`.
- **GitHub MCP** aktif (46 tools).

---

## 2. Bukti Verifikasi

```text
GET /health
{"status":"ok","database":"connected","environment":"development"}

POST /api/v1/auth/session
admin:  role=admin  budget=90g mode=guide remaining=90g
staff:  role=staff  budget=90g mode=guide remaining=90g
member: role=member budget=90g mode=guide remaining=90g

GET /api/v1/admin/ping
admin:  OK role=admin
staff:  OK role=staff
member: HTTP 403

PATCH /api/v1/me { budgetPreset: "ketat" }
user=60g budget=60g
PATCH /api/v1/me { budgetPreset: "seimbang" }
user=90g budget=90g

GET /api/v1/locations
Bakerman Dago — Jl. Ir. H. Juanda No. 100, Dago, Bandung

GET /api/v1/pickup-slots?date=2026-11-13
18 slot, slot pertama 11:00, available=8

GET /api/v1/menu/today
10 produk, stok pertama=12

GET /api/v1/me tanpa token
HTTP 401

Legacy smoke test
GET  /api/user?email=member... → chances=3
POST /api/purchase/generate-code → remaining=2
POST /api/purchase/redeem-purchase → history=1

Client
npm run lint  → 0 error
npm run build → sukses (459 KB)

MongoDB MCP
list-collections(bakerman) → products, dailystocks, budgetperiods,
users, locations, purchases, pickupslots
```

---

## 3. Kompatibilitas UI Lama

Endpoint legacy **sengaja dipertahankan** agar halaman `/chance` dan katalog lama tetap hidup selama migrasi UI:

- `/api/products`
- `/api/user`, `/api/user/buy-history`, `/api/user/strava-link`
- `/api/purchase/*`

Field legacy (`chances`, `chancesResetAt`, `stravaLink`, `buyHistory`) tetap ada di model `User`.
Penghapusan final dilakukan setelah UI pindah ke v1 (Fase 2–4).

---

## 4. Batasan / Belum Selesai

- UI belum memakai API v1 (masih legacy).
- `Order` & `StravaActivity` baru model; route order/Strava di Fase 3–4.
- Admin baru `ping`; dashboard staff di Fase 5.
- Service account Firebase belum diisi; `verifyIdToken` tetap berjalan dengan project ID, tetapi operasi admin Firebase (create/delete user) belum tersedia.
- Multi-outlet: schema siap, baru satu outlet di seed.
- Browser tool tidak tersedia di sesi ini; verifikasi UI dilakukan lewat build, lint, dan transform Vite (200).
- Payment gateway, delivery, subscription, referral tetap out of scope.

---

## 5. Langkah Berikutnya (Fase 2)

1. Ganti landing & `/all` ke `/api/v1/products` + `/api/v1/menu/today`.
2. Tampilkan label gula (Ringan/Seimbang/Manja/Manja banget).
3. Tambah budget bar di UI (sisa budget, mode guide/strict).
4. Halaman detail produk + tombol tambah ke order (keranjang).
5. Hapus fallback data statis yang menutupi error API.
6. Perbaiki bug visual lama (global `p { color: aliceblue }`, Bootstrap classes, link rusak).
