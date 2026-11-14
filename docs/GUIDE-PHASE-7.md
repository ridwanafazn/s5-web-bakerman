# Guide — Merasakan Hasil Fase 7

Fase 7 menambahkan **alternatif Strava**: aktivitas manual dengan **screenshot bukti** di Cloudinary. Screenshot otomatis dihapus setelah **7 hari**; record aktivitas tetap tersimpan untuk bonus.

> **Dokumen historis.** Link tunnel di bawah sudah tidak dipakai. Production sekarang: **https://bakerman.ridwanafazn.my.id** dengan API **https://bakerman-api.vercel.app/api**. Lihat `docs/PHASE-8-REPORT.md`.

> Strava API sejak Juni 2026 mewajibkan langganan berbayar untuk developer Standard Tier. Karena checkout Strava gagal, fitur bonus aktivitas tetap bisa dipakai lewat input manual.

---

## 🌐 Link untuk Dicek

### Dev preview (mock Cloudinary — tanpa kredensial)

**https://opponents-bras-prayers-gas.trycloudflare.com**

- Login member → `/balance`.
- Form **“Catat aktivitas manual”** aktif.
- Badge **“Mode simulasi bukti (dev)”** muncul.
- Upload screenshot disimulasikan; bonus tetap dihitung nyata.
- Cocok untuk mencoba alur tanpa akun Cloudinary.

### Production-like Docker stack

**https://assistant-source-adjustments-exotic.trycloudflare.com**

- Cloudinary belum dikonfigurasi → form manual **disabled** dengan pesan setup.
- Setelah Anda mengisi kredensial Cloudinary, form akan aktif.
- Strava juga belum aktif.

### Lokal

| Layanan | URL |
|---|---|
| Production stack | http://localhost:8080 |
| Dev preview | http://localhost:4173 |
| Dev server | http://localhost:5173 |
| API dev | http://localhost:5050 |

> Tunnel sementara; laptop harus menyala.

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

---

## 1. Coba di Dev Preview (Mock)

1. Login member.
2. Buka **/balance**.
3. Scroll ke **“Catat aktivitas manual”**.
4. Isi:
   - Tanggal: hari ini (otomatis).
   - Jenis: Run.
   - Durasi: 45 menit.
   - Catatan: bebas.
   - Screenshot: pilih gambar JPG/PNG/WebP (maks 5 MB).
5. Klik **Kirim aktivitas**.
6. Yang harus terjadi:
   - Pesan “Aktivitas 45 menit dicatat.”
   - Budget naik **66 g → 76 g** (+10 g).
   - Daftar aktivitas menampilkan **45 menit · +10 g**.
   - Badge bukti: **“Bukti simulasi (dev)”**.
7. Klik **Hapus** pada aktivitas.
8. Budget kembali **66 g**; bonus kembali 0.

> Di mock mode, screenshot tidak benar-benar diunggah. Untuk upload asli, siapkan Cloudinary.

---

## 2. Setup Cloudinary Asli

### 2.1 Buat akun
1. Buka <https://cloudinary.com/console>.
2. Daftar/login (free tier cukup untuk demo).
3. Catat:
   - **Cloud name** (Dashboard).
   - **API Key** dan **API Secret** (API Keys page).

### 2.2 Isi environment

Di `server/.env` (lokal) atau dashboard Vercel (production):

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=bakerman/manual-activities
CLOUDINARY_MOCK=false
MANUAL_ACTIVITY_SCREENSHOT_DAYS=7
MANUAL_ACTIVITY_MAX_MB=5
CRON_SECRET=<random-64-hex>
```

Generate `CRON_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Restart / redeploy

Lokal:

```bash
cd server
npm run dev
```

Docker:

```powershell
docker compose -f docker-compose.prod.yml up -d --build api
```

Vercel: redeploy API setelah env diisi.

### 2.4 Tes upload asli

1. Login member → `/balance`.
2. Upload screenshot aktivitas.
3. Cek **Cloudinary Media Library** → folder `bakerman/manual-activities`.
4. Cek `screenshotUrl` di API/UI.
5. Setelah 7 hari, asset hilang dari Cloudinary; record aktivitas tetap ada dan UI menampilkan **“Bukti sudah dihapus”**.

---

## 3. Auto-delete 7 Hari

### Docker / server biasa
- Job harian berjalan otomatis di `server/index.js`.
- Jalan pertama ±10 detik setelah server start, lalu setiap 24 jam.
- Log: `[CLOUDINARY CLEANUP]`.

### Vercel
- `server/vercel.json` sudah punya cron:
  ```json
  { "path": "/api/v1/internal/cleanup-cloudinary", "schedule": "0 3 * * *" }
  ```
- Set env `CRON_SECRET` di Vercel.
- Vercel Cron mengirim `Authorization: Bearer <CRON_SECRET>`.

### Manual
Staff/admin bisa memicu:

```text
POST /api/v1/admin/activities/cleanup
```

Atau internal:

```text
GET /api/v1/internal/cleanup-cloudinary
Authorization: Bearer <CRON_SECRET>
```

---

## 4. Cek di Production Stack

1. Buka production tunnel → login member.
2. `/balance` → form manual.
3. Jika Cloudinary belum diisi:
   - form disabled,
   - pesan “Cloudinary belum dikonfigurasi”,
   - tidak ada upload.
4. Setelah env Cloudinary diisi + API direstart:
   - form aktif,
   - upload asli masuk ke Media Library,
   - bonus dihitung.

---

## 5. E2E

```bash
cd client

# Dev mock (manual step berjalan)
E2E_BASE_URL=http://localhost:4173 npm run e2e

# Production stack tanpa Cloudinary (manual step dilewati)
E2E_BASE_URL=http://localhost:8080 npm run e2e

# Lewat tunnel
E2E_BASE_URL=https://opponents-bras-prayers-gas.trycloudflare.com npm run e2e
```

Output yang diharapkan:

```text
PASS aktivitas manual + screenshot — 66 g → 76 g → 66 g
steps: 9
consoleErrors: 0
```

Di production tanpa Cloudinary:

```text
PASS aktivitas manual + screenshot — Cloudinary belum dikonfigurasi — dilewati
```

---

## 6. Troubleshooting

### `503 CLOUDINARY_NOT_CONFIGURED`
- Isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Set `CLOUDINARY_MOCK=false` untuk production.
- Restart API.

### `413 SCREENSHOT_TOO_LARGE`
- Maksimal 5 MB. Kompres gambar atau ubah `MANUAL_ACTIVITY_MAX_MB` (1–10).

### `400 INVALID_ACTIVITY_DATE`
- Tanggal harus di minggu berjalan (Senin–hari ini, Jakarta).
- Tidak bisa backdate ke minggu lalu.

### `502 CLOUDINARY_UPLOAD_FAILED` / `CLOUDINARY_DELETE_FAILED`
- Cek API key/secret, koneksi internet, dan status Cloudinary.
- Cek log API.

### Cleanup tidak berjalan
- Docker: cek log `[CLOUDINARY CLEANUP]`.
- Vercel: cek cron + `CRON_SECRET`.
- Manual: panggil endpoint admin/internal.

### Screenshot masih ada setelah 7 hari
- Job harian mungkin belum jalan.
- Cek `screenshot.deleteAfter` di database.
- Panggil cleanup manual.
- Jika `deleteScreenshot` gagal, asset dipertahankan untuk retry.

---

## 7. Keamanan & Privasi

- Screenshot wajib, tetapi **bukan bukti kriptografis**; user bisa upload gambar lain.
- URL Cloudinary memakai `secure_url` publik. Jangan upload screenshot yang berisi data sensitif.
- Screenshot dihapus otomatis setelah 7 hari.
- Record aktivitas tetap ada; hanya bukti yang hilang.
- `CLOUDINARY_API_SECRET` hanya di server; jangan pernah dikirim ke client/chat.
- `CLOUDINARY_MOCK=true` hanya untuk dev; production wajib `false`.

---

## Checklist Cepat

- [ ] Dev preview: form manual aktif + badge mock.
- [ ] Upload 45 menit → bonus +10 g.
- [ ] Hapus → bonus kembali.
- [ ] Production: form disabled sebelum Cloudinary diisi.
- [ ] Cloudinary env diisi → form aktif.
- [ ] Upload asli muncul di Media Library.
- [ ] `screenshot.deleteAfter` = 7 hari.
- [ ] Cleanup manual berhasil.
- [ ] E2E 9 langkah, 0 console error.

---

## Yang Belum Ada

- Review/approval staff untuk aktivitas manual.
- Verifikasi kriptografis screenshot.
- Backdate aktivitas ke minggu lalu.
- Strava asli (opsional; butuh langganan Strava).
