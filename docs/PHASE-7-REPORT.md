# Fase 7 — Alternatif Strava: Aktivitas Manual + Bukti Cloudinary

**Tanggal:** 14 November 2026
**Status:** ✅ Selesai (implementasi + mock dev); upload Cloudinary asli menunggu kredensial
**Latar belakang:** Strava API sejak Juni 2026 mewajibkan langganan berbayar untuk developer Standard Tier. Checkout Strava user gagal, jadi fitur bonus aktivitas tetap bisa dipakai lewat input manual + screenshot bukti.

---

## 1. Keputusan Produk

- Strava tetap **opsional**.
- Alternatif: **aktivitas manual** dengan screenshot bukti.
- Screenshot **wajib**, disimpan di **Cloudinary**, dan **dihapus otomatis setelah 7 hari**.
- Record aktivitas (tanggal, jenis, menit, catatan) tetap tersimpan agar bonus tidak hilang.
- Bonus memakai tier yang sama:
  - 30–59 menit → +10 g
  - 60–89 menit → +20 g
  - 90–149 menit → +30 g
  - ≥150 menit → +45 g (maksimum)
- Manual + Strava digabung; total bonus tetap maksimal 45 g/minggu.
- Hanya tanggal di **minggu berjalan** (Senin–hari ini, Jakarta) yang diterima.

> Screenshot adalah **pencegah klaim palsu**, bukan verifikasi kriptografis. User masih bisa mengunggah gambar yang tidak relevan. Untuk verifikasi kuat, perlu review staff atau integrasi provider aktivitas.

---

## 2. Yang Dibangun

### 2.1 Model

`server/models/ManualActivity.js`:

- `userId`, `date`, `startDate`, `type`, `minutes`, `note`.
- `screenshot.publicId`, `secureUrl`, `deleteAfter`, `uploadedAt`, `mock`.
- Index: `userId + startDate`, `userId + date`, `screenshot.deleteAfter`.

### 2.2 Service

`server/services/manualActivityService.js`:

- Validasi tanggal minggu berjalan.
- Validasi durasi 1–600 menit.
- Validasi jenis: Run, Ride, Walk, Hike, Workout, Other.
- Upload screenshot ke Cloudinary.
- Simpan record + `deleteAfter = now + 7 hari`.
- Recalculate bonus gabungan (Strava + manual).
- List aktivitas minggu ini + total menit/bonus.
- Delete aktivitas + screenshot.
- Cleanup screenshot kedaluwarsa.

`server/services/stravaService.js` diperbarui:

- `getWeekTotals()` menggabungkan Strava + manual.
- `recalculateBonus()` memakai total menit gabungan.
- `buildStatus()` mengembalikan `stravaMinutes`, `manualMinutes`, `manualActivities`, total `minutes`, `bonusGrams`.

### 2.3 Cloudinary

`server/utils/cloudinary.js`:

- Signed upload dari server (API secret tidak pernah ke client).
- Folder: `bakerman/manual-activities`.
- Tag: `manual-activity`, `user-<id>`.
- Delete via Admin API.
- **Mock mode** (`CLOUDINARY_MOCK=true`) untuk dev tanpa kredensial; production wajib `false`.

### 2.4 API

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/v1/activities/manual` | Member | List + total + status Cloudinary |
| POST | `/api/v1/activities/manual` | Member | Multipart: date, type, minutes, note, screenshot |
| DELETE | `/api/v1/activities/manual/:id` | Owner | Hapus aktivitas + screenshot |
| POST | `/api/v1/admin/activities/cleanup` | Staff/Admin | Cleanup manual |
| GET | `/api/v1/internal/cleanup-cloudinary` | `CRON_SECRET` | Vercel Cron |

Batasan upload:

- MIME: `image/jpeg`, `image/png`, `image/webp`.
- Maksimal **5 MB**.
- Field multipart: `screenshot`.

### 2.5 Auto-delete 7 Hari

Dua jalur:

1. **Server/Docker**: job harian di `server/index.js` (`setInterval` 24 jam; jalan pertama 10 detik setelah start).
2. **Vercel**: cron `0 3 * * *` di `server/vercel.json` → `/api/v1/internal/cleanup-cloudinary` dengan `Authorization: Bearer <CRON_SECRET>`.

Cleanup:

- Cari `screenshot.publicId` yang `deleteAfter <= now`.
- Hapus asset Cloudinary.
- Kosongkan `publicId` + `secureUrl`, **pertahankan** `deleteAfter` agar UI bisa menandai “Bukti sudah dihapus”.
- Record aktivitas tetap ada; bonus tetap berlaku.

### 2.6 UI

Di `/balance`, kartu **“Catat aktivitas manual”**:

- Tanggal (min/max minggu berjalan).
- Jenis aktivitas.
- Durasi menit.
- Catatan opsional.
- Upload screenshot + preview.
- Peringatan retensi 7 hari.
- Daftar aktivitas minggu ini + total menit/bonus.
- Tombol hapus per aktivitas.
- Badge **“Mode simulasi bukti (dev)”** jika mock.
- Form disabled + pesan setup jika Cloudinary belum dikonfigurasi.

Kartu Bonus aktivitas juga menampilkan breakdown:

```text
Strava X menit · Manual Y menit
```

### 2.7 E2E

`client/e2e/smoke.mjs` menambah langkah:

- Cek form manual.
- Upload screenshot.
- Submit 45 menit.
- Verifikasi bonus naik (66 g → 76 g).
- Hapus aktivitas.
- Verifikasi budget kembali 66 g.
- Jika Cloudinary tidak dikonfigurasi: langkah **dilewati** dengan pesan jelas.

### 2.8 Perbaikan UI Landing

Ditemukan saat pengecekan desktop: landing page memakai `ProductCard` dan class `.catalog-grid`, tetapi `catalog.css` tidak di-import di landing. Akibatnya grid menjadi `display: block` dan gambar produk membesar (tinggi section ±3.892 px).

Perbaikan:

- Import `../styles/catalog.css` di `client/src/components/ProductCard.jsx`.
- Verifikasi desktop 1920×1200: grid 3 kolom, card 377 px, section produk turun menjadi ±975 px.
- Verifikasi mobile tetap 1 kolom.

---

## 3. Bukti Verifikasi

### 3.1 Server Tests

```text
npm test
tests 34
pass 34
fail 0
```

5 test baru:

- `weekRange` Jakarta.
- Validasi tanggal minggu berjalan.
- Validasi menit 1–600.
- Validasi jenis aktivitas.
- Serialisasi screenshot (publicId tidak bocor, expiry dihitung).

### 3.2 API Manual

```text
POST /api/v1/activities/manual (45 menit, Run, screenshot WebP)
→ 201, bonus status: minutes=45, manualMinutes=45, bonusGrams=10
GET /api/v1/me
→ bonus 10 g, total 100 g, remaining 76 g

DELETE /api/v1/activities/manual/:id
→ minutes=0, bonus=0
GET /api/v1/me
→ bonus 0 g, total 90 g, remaining 66 g
```

### 3.3 UI E2E (Dev Mock)

```text
PASS aktivitas manual + screenshot — 66 g → 76 g → 66 g
steps: 9
consoleErrors: 0
```

### 3.4 Cleanup

```text
Set screenshot.deleteAfter = new Date(0)
GET /api/v1/internal/cleanup-cloudinary (Bearer CRON_SECRET)
→ {"scanned":1,"deleted":1,"failed":0}
List aktivitas
→ screenshotUrl="", screenshotExpired=true
```

### 3.5 Production Stack

```text
E2E_BASE_URL=http://localhost:8080 npm run e2e
→ PASS aktivitas manual + screenshot — Cloudinary belum dikonfigurasi — dilewati
→ 9 langkah, 0 console error
```

Production sengaja belum diisi kredensial Cloudinary, jadi form manual dinonaktifkan sampai env diisi.

### 3.6 Build

```text
client lint  → 0 error
client build → sukses
```

---

## 4. Data Demo

- Member: budget **66 g**, 4 order, **0 aktivitas manual** (data uji sudah dihapus).
- Cloudinary dev: **mock** (`CLOUDINARY_MOCK=true`).
- Production stack: Cloudinary belum dikonfigurasi; manual form disabled.
- Strava: tetap belum aktif.

---

## 5. Batasan

- Screenshot bukan bukti kriptografis; bisa dipalsukan dengan gambar lain.
- URL Cloudinary memakai `secure_url` publik (tidak diindeks, tapi siapa pun yang punya URL bisa membuka).
- Belum ada review/approval staff untuk aktivitas manual.
- Hanya minggu berjalan; tidak bisa backdate ke minggu lalu.
- Upload Cloudinary asli belum diuji karena belum ada kredensial.
- Vercel Cron membutuhkan `CRON_SECRET`; Docker memakai job harian.
- Cloudinary free tier punya kuota; screenshot dihapus 7 hari untuk menekan penggunaan.

---

## 6. Langkah Berikutnya

> ✅ **Fase 8 selesai:** UI landing diperbaiki, frontend live di Cloudflare Pages + domain custom, commit/push. Lihat `docs/PHASE-8-REPORT.md`.

1. Buat akun Cloudinary + isi kredensial production.
2. Set `CLOUDINARY_MOCK=false`, `CRON_SECRET`, dan redeploy.
3. Tes upload asli + cek Media Library + cleanup.
4. Opsional: review staff/approval aktivitas manual.
5. Deploy cloud API permanen (Vercel/Render/VPS/Cloudflare Containers).
