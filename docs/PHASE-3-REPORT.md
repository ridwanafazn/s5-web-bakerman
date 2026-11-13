# Fase 3 — Strava OAuth & Bonus Aktivitas

**Tanggal:** 13 November 2026
**Status:** ✅ Selesai (mode simulasi terverifikasi; OAuth asli menunggu kredensial Strava)
**Tujuan:** menghubungkan aktivitas fisik ke budget gula mingguan, dengan OAuth resmi dan bonus progresif.

---

## 1. Yang Dibangun

### 1.1 Backend

- **Token encryption** AES-256-GCM (`server/utils/crypto.js`).
  - Access token & refresh token Strava tidak pernah disimpan plaintext.
  - Key dari `TOKEN_ENCRYPTION_KEY` (64 hex).
- **Signed OAuth state** (HMAC-SHA256, expiry 10 menit) untuk mencegah CSRF.
- **Strava service** (`server/services/stravaService.js`):
  - `getConnectUrl` — URL authorize dengan scope `read,activity:read_all`.
  - `handleCallback` — tukar code → token, simpan athlete + token terenkripsi.
  - `syncActivities` — ambil aktivitas minggu berjalan, filter manual/e-bike, upsert, hitung bonus.
  - `status` — connected, athlete, menit aktif, bonus, tier, last sync.
  - `disconnect` — hapus koneksi + aktivitas + reset bonus.
  - `addDemoActivity` / `resetDemo` — simulasi 45 menit untuk dev.
- **Bonus progresif** (reuse `bonusForMinutes`):
  - 30–59 menit → +10 g
  - 60–89 menit → +20 g
  - 90–149 menit → +30 g
  - ≥150 menit → +45 g
- **Routes** `/api/v1/strava`:
  - `GET /connect`
  - `GET /callback`
  - `GET /status`
  - `POST /sync`
  - `POST /demo`
  - `DELETE /demo`
  - `DELETE /disconnect`
- **Env baru:** `STRAVA_DEMO_MODE` (default false; true untuk dev).

### 1.2 Frontend

- Kartu **Bonus aktivitas** di `/balance`:
  - Status terhubung/belum.
  - Menit aktif, bonus, jumlah aktivitas.
  - Tier bonus dengan indikator tier tercapai.
  - Tombol **Hubungkan Strava** (jika credentials tersedia).
  - Tombol **Sync sekarang** dan **Putuskan** (jika terhubung).
  - Tombol **Simulasi 45 menit** + **Reset simulasi** (mode dev).
  - Pesan sukses/error dan waktu sync terakhir.
- Setelah demo/sync, `SessionContext.refresh()` memperbarui budget bar dan ringkasan.
- `/chance` sekarang **redirect ke `/balance`**.
- Navbar/Footer tidak lagi menampilkan link Rewards legacy.
- Mission ditulis ulang:
  - “Misi kami” → “Nikmati manisnya tanpa kehilangan kontrol.”
  - “Budget gula, bukan larangan.”
  - “Bonus dari aktivitas, bukan hukuman.”
  - Tier 30/60/90/150 menit.
  - Disclaimer medis.
- `Profile` link “Lihat rewards” → “Lihat balance”.

### 1.3 Tests

- `server/test/strava.test.js`:
  - Encrypt/decrypt roundtrip.
  - Random IV.
  - Tampered ciphertext ditolak.
  - State sign/verify.
  - State tamper/expiry ditolak.
- Total server tests: **17/17 pass**.

---

## 2. Bukti Verifikasi

### Backend

```text
GET /api/v1/strava/status
configured=false demoMode=true connected=false minutes=0 bonus=0

GET /api/v1/strava/connect (tanpa credentials)
HTTP 503 STRAVA_NOT_CONFIGURED

POST /api/v1/strava/sync (belum terhubung)
HTTP 409 STRAVA_NOT_CONNECTED

POST /api/v1/strava/demo x4
45 menit  → +10 g  (budget base 60 → total 70)
90 menit  → +30 g  (total 90)
135 menit → +30 g  (total 90)
180 menit → +45 g  (total 105)

DELETE /api/v1/strava/demo
0 menit → +0 g (total kembali 60)
```

**Disconnect test** (dengan data koneksi palsu):
```text
BEFORE: connected=true athlete="Test Athlete"
DELETE /api/v1/strava/disconnect
AFTER: connected=false bonus=0 activities=0
User.strava terhapus dari dokumen MongoDB.
```

**Callback invalid state**:
```text
302 → http://localhost:5173/balance?strava=error&message=...
```

### Frontend (headless Chrome)

```text
Kartu Strava awal:
- "Mode simulasi aktif (dev)"
- Menit 0, bonus +0, aktivitas 0
- Tier 150/90/60/30 tampil
- Pesan STRAVA_CLIENT_ID/SECRET tampil

Simulasi 1:
- 45 menit, +10 g, budget 60 → 70 g
- Tier 30+ tercapai

Simulasi 2:
- 90 menit, +30 g, budget 90 g
- Tier 90/60/30 tercapai

Reset:
- 0 menit, +0 g, budget kembali 60 g

/chance → redirect /balance
Mission: copy & tier baru tampil
Console errors: 0
```

### Build

```text
npm run lint  → 0 error
npm run build → sukses (472 KB, gzip 147 KB)
npm test      → 17/17 pass
```

---

## 3. Aksi Manual yang Dibutuhkan untuk Strava Asli

Mode simulasi sudah bisa dipakai sekarang. Untuk OAuth Strava asli, saya butuh Anda melakukan ini:

1. Login ke <https://www.strava.com/settings/api>.
2. Buat API Application:
   - **Application Name:** Bakerman Balance (bebas)
   - **Category:** Other / Food (bebas)
   - **Website:** `http://localhost:5173`
   - **Authorization Callback Domain:** `localhost`
3. Setelah tersimpan, salin **Client ID** dan **Client Secret**.
4. Isi `server/.env`:

   ```env
   STRAVA_CLIENT_ID=xxxxx
   STRAVA_CLIENT_SECRET=xxxxx
   STRAVA_REDIRECT_URI=http://localhost:5050/api/v1/strava/callback
   STRAVA_DEMO_MODE=false
   ```

5. Restart backend.
6. Login ke aplikasi → `/balance` → **Hubungkan Strava** → authorize.
7. Kabari saya setelah credentials terpasang; saya akan verifikasi OAuth + sync asli.

**Catatan:**
- Strava app dalam mode development hanya bisa authorize oleh pemilik app.
- Untuk production, ganti callback domain ke domain deploy dan update `STRAVA_REDIRECT_URI`.
- Scope yang diminta: `read,activity:read_all`.
- Sync mengambil maksimal 100 aktivitas/minggu dan belum memakai webhook (manual sync).

---

## 4. Batasan / Belum Selesai

- OAuth asli belum diuji karena belum ada Client ID/Secret.
- Sync manual (belum webhook real-time).
- Order/checkout/pickup belum ada (Fase 4).
- Dashboard staff belum ada (Fase 5).
- Artikel Mission masih berbahasa Inggris; copy utama sudah Indonesia.
- Gambar masih besar (Fase 5).

---

## 5. Langkah Berikutnya (Fase 4)

1. Model `Order` + `DailyStock` transaksional.
2. Cart → checkout → pilih slot pickup.
3. Kode order unik + halaman konfirmasi.
4. Dashboard staff: paid → preparing → ready → picked_up.
5. Kurangi stok + budget secara atomik.
6. Pembayaran **pay at pickup** (tanpa gateway).
