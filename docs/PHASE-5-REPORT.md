# Fase 5 — Recap Mingguan, Polish, Performa, SEO, E2E & CI

**Tanggal:** 13 November 2026

> **Dokumen historis.** Link tunnel di laporan ini sudah tidak dipakai. Production sekarang: **https://bakerman.ridwanafazn.my.id** dengan API **https://bakerman-api.vercel.app/api**. Lihat `docs/PHASE-8-REPORT.md`.

**Status:** ✅ Selesai; deploy production selesai 14 November 2026
**Catatan roadmap:** Fase 5 di log implementasi ini menggabungkan **Fase 6–8 PRD** (recap, polish, performa, SEO, test, deploy preparation). Staff dashboard sudah selesai di Fase 4.

---

## 1. Yang Dibangun

### 1.1 Backend

- **Rekap mingguan** `GET /api/v1/me/recap?weeks=4`
  - 1–8 minggu terakhir (default 4).
  - Budget: base, bonus, terpakai, sisa, persentase.
  - Order: total aktif, selesai, sedang berjalan, dibatalkan.
  - Aktivitas: menit aktif, jumlah aktivitas, bonus dari tier.
  - Top 3 produk per minggu.
  - Ringkasan: total order, order selesai, total menit aktif, total bonus, minggu on-budget, rata-rata konsumsi.
  - Minggu tanpa data ditandai `hasData: false` (tidak mengarang riwayat).
- **Pagination + filter order** `GET /api/v1/orders?status=&page=&limit=`
  - Filter grup: `all`, `active`, `completed`, `canceled`.
  - Filter status spesifik: `pending_payment`, `paid`, `preparing`, `ready`, `picked_up`, `expired`.
  - `page` default 1, `limit` default 10, maksimum 20.
  - Response menyertakan `pagination: { page, limit, total, totalPages, hasNext, hasPrev }`.
  - Filter tidak valid → `400 INVALID_STATUS_FILTER`.
- **Tes unit baru** untuk parsing pagination dan filter status (`server/test/pagination.test.js`).
- **Swagger** diperbarui untuk recap dan parameter order.

### 1.2 Frontend

- **Balance `/balance`**
  - Kartu rekap 4 minggu: total order, order selesai, menit aktif, minggu on-budget.
  - Grafik batang pemakaian gula per minggu (bar merah jika over-budget).
  - Daftar per minggu: gula terpakai, sisa, order, menit aktif, bonus, top produk.
  - Tombol refresh rekap; rekap ikut diperbarui setelah ganti preset/Strava demo.
- **Riwayat `/orders`**
  - Filter Semua / Aktif / Selesai / Dibatalkan.
  - Pagination 8 order per halaman (Prev/Next + info halaman).
  - Empty state per filter.
  - `aria-busy` saat memuat.
- **Aksesibilitas**
  - Skip link “Lewati ke konten utama”.
  - Fokus terlihat (`:focus-visible`) dan fokus otomatis ke konten saat pindah route.
  - `aria-current` pada navigasi aktif.
  - `aria-pressed` pada tombol tanggal/slot checkout dan filter pesanan.
  - `aria-live` untuk pesan status/error penting.
  - Caption tabel stok dan label input stok untuk screen reader.
  - Menghormati `prefers-reduced-motion`.
- **Performa**
  - Route-level lazy loading (`React.lazy` + `Suspense`) untuk semua halaman.
  - Manual chunk: React, Firebase, Axios, ikon, vendor lain.
  - Gambar di bawah lipatan `loading="lazy"` + `decoding="async"`.
  - Optimasi aset besar (lihat bagian 2).
- **SEO**
  - Title per route.
  - Meta description, keywords, author, robots, Open Graph, Twitter card.
  - JSON-LD `Bakery` (nama, alamat fiktif Bandung, area served).
  - `public/robots.txt` (disallow halaman privat).
- **E2E**
  - `client/e2e/smoke.mjs` (Puppeteer Core): landing mobile, menu, login member, recap, filter order, pagination (jika >8 order), alur checkout tanpa membuat order, staff dashboard admin, cek console error.
- **CI**
  - `.github/workflows/ci.yml`: server tests + client lint + build.
  - `.github/workflows/e2e.yml`: manual E2E dengan URL dan secrets akun.

### 1.3 Deployment Preparation

- `docs/DEPLOYMENT.md`: langkah Vercel (client + API), MongoDB Atlas, Firebase, Strava, CORS, smoke test.
- `client/vercel.json` untuk SPA rewrite.
- `server/vercel.json` sudah tersedia untuk Express.
- **Deploy aktual belum dilakukan** karena membutuhkan login Atlas Cloud, Firebase service account production, domain, dan akun Vercel.

---

## 2. Bukti Verifikasi

### 2.1 Server Tests

```text
npm test
tests 25
pass 25
fail 0
```

> Setelah Fase 6 (tambahan test `/ready` dan validasi env production): **29/29 pass**. Setelah Fase 7: **34/34 pass**.

Termasuk 8 tes baru untuk pagination/filter status dan agregasi top produk recap.

### 2.2 API Recap

```text
GET /api/v1/me/recap?weeks=4 (member)
summary:
  weeks=4, weeksWithData=1, onBudgetWeeks=1
  totalOrders=2, completedOrders=2
  totalActiveMinutes=0, totalBonusGrams=0
  averageConsumedGrams=24

currentWeek:
  consumed=24 g, total=90 g, remaining=66 g, percentUsed=27%
  orders: total=2, completed=2, canceled=2
  topProducts: Roti Susu Pandan ×3 (24 g)
```

Bonus aktivitas:

```text
POST /api/v1/strava/demo
→ minutes=45, bonusGrams=10, activities=1
GET /api/v1/me/recap
→ currentWeek: bonus=10, total=100, minutes=45, activities=1
DELETE /api/v1/strava/demo
→ minutes=0, bonus=0, activities=0
→ recap kembali total=90
```

### 2.3 API Pagination

Dengan 10 order sementara:

```text
GET /api/v1/orders?status=all&page=1&limit=8
→ page=1, limit=8, total=10, totalPages=2, hasNext=true, hasPrev=false

GET /api/v1/orders?status=all&page=2&limit=8
→ page=2, totalPages=2, hasNext=false, hasPrev=true

GET /api/v1/orders?status=canceled&page=1&limit=8
→ total=8, totalPages=1

GET /api/v1/orders?status=nope
→ 400 INVALID_STATUS_FILTER
```

Enam order QA dihapus kembali setelah verifikasi. Data member kembali 4 order, budget 66 g, stok Roti Susu 9 tersedia.

### 2.4 E2E (Preview + Tunnel)

```text
npm run e2e
PASS landing mobile render — 3 kartu menu
PASS menu katalog — 10 produk
PASS login member + budget — budget 66 g
PASS recap mingguan — Order aktif 2, Selesai 2, Menit aktif 0, Minggu on-budget 1/1
PASS filter riwayat pesanan — 2 order, kartu=true
PASS pagination riwayat — Halaman 2 dari 2, kartu=2   (dengan 10 order sementara)
PASS alur checkout tanpa membuat order — 18 slot tersedia
PASS staff dashboard admin — 10 baris stok, order=true

ok: true
steps: 8
consoleErrors: 0
```

Diuji juga lewat tunnel publik:

```text
E2E_BASE_URL=https://opponents-bras-prayers-gas.trycloudflare.com npm run e2e
→ ok: true, steps: 8, consoleErrors: 0
```

### 2.5 Kualitas Frontend

```text
npm run lint  → 0 error
npm run build → sukses
```

Ukuran bundle awal (shared chunks):

| Chunk | Raw | Gzip |
|---|---:|---:|
| index | 22.59 kB | 7.05 kB |
| vendor-react | 249.07 kB | 79.10 kB |
| vendor-firebase | 102.19 kB | 30.48 kB |
| vendor-axios | 57.39 kB | 21.30 kB |
| vendor-icons | 11.78 kB | 4.53 kB |
| **Total awal** | **±443 kB** | **±142 kB** |

Sebelumnya satu bundle 493.64 kB / 151.61 kB gzip. Halaman Mission, Checkout, Staff, Balance, dll. sekarang dimuat terpisah saat dibuka.

### 2.6 Optimasi Gambar

| Aset | Sebelum | Sesudah |
|---|---:|---:|
| `navbar-logo.png` | 941 kB (1080×1055) | **30 kB (132×129)** |
| `category/all.jpg` | 304 kB (1440×1440) | **200 kB (900×900)** |
| `category/banner-category.jpg` | 232 kB (3456×1334) | **43 kB (1100×425)** |
| `category/icebox.jpg` | 64 kB | **51 kB** |
| `about-making-cake.jpg` | 167 kB | **87 kB** |
| `official-store.jpg` | 172 kB | **86 kB** |

Gambar lain tetap, tetapi dimuat lazy dan hanya saat route terkait dibuka.

---

## 3. Data Demo Saat Ini

- Member `member.bakerman.qa@gmail.com`
  - Budget **66 g** dari 90 g (terpakai 24 g).
  - **4 order**: 2 `picked_up`, 2 `canceled`.
  - Rekap: 1 minggu berdata (minggu ini), 3 minggu sebelumnya kosong.
  - Strava: terputus, simulasi 0 menit.
- Admin `bakerman@gmail.com`
  - Budget 60 g (preset Ketat), tanpa order.
- Staff `qa.bakerman.101126@gmail.com`
  - Akses `/staff`.
- Stok Roti Susu Pandan: total 12, reserved 0, sold 3, available 9.

> Pagination hanya muncul jika order > 8. Dengan 4 order saat ini, halaman menampilkan semua order tanpa tombol halaman. Untuk melihat pagination, buat beberapa order (bisa dibatalkan) atau gunakan data uji.

---

## 4. Batasan

- Recap hanya menampilkan data yang benar-benar ada; minggu lama tidak diisi data palsu.
- E2E membutuhkan stack lokal (MongoDB, server, preview) dan akun demo; tidak dijalankan otomatis di CI utama.
- Workflow E2E manual membutuhkan secrets akun dan URL publik.
- Deploy cloud belum dilakukan; lihat `docs/DEPLOYMENT.md`.
- Strava asli masih menunggu Client ID/Secret.
- Belum ada notifikasi email/WA.
- Belum ada payment gateway (tetap pay at pickup).
- Belum ada sitemap XML karena domain production belum ditentukan.

---

## 5. Langkah Berikutnya

> ✅ **Production hardening & packaging sudah dikerjakan di Fase 6.** Lihat `docs/PHASE-6-REPORT.md` dan `docs/GUIDE-PHASE-6.md`.

1. **Deploy**: Atlas Cloud + Vercel API + Vercel client + Firebase authorized domain + Strava callback.
2. **Strava asli**: isi Client ID/Secret, set `STRAVA_DEMO_MODE=false`, verifikasi OAuth + sync.
3. **CI**: aktifkan GitHub Actions saat repo di-push.
4. **Opsional**: tambah sitemap setelah domain final, notifikasi email/WA, dan E2E di CI dengan environment staging.
