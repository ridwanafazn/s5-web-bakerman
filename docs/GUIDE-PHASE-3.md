# Guide — Merasakan Hasil Fase 3

Fokus Fase 3: **bonus aktivitas Strava**. Karena Client ID/Secret Strava belum ada, gunakan mode simulasi yang sudah disediakan.

---

## 1. Pastikan dev server hidup

- Frontend: <http://localhost:5173>
- API health: <http://localhost:5050/health>
- Swagger: <http://localhost:5050/api-docs>

Kalau mati:

```bash
docker compose up -d mongo
cd server && npm run dev
cd client && npm run dev
```

---

## 2. Login

Buka <http://localhost:5173/signin>.

| Email | Password |
|---|---|
| `bakerman@gmail.com` | `bakermanAdmin` |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` |
| `member.bakerman.qa@gmail.com` | `Bakerman123!` |

Setelah login, kamu diarahkan ke **/balance**.

> Catatan: budget demo user saat ini **Ketat 60 g** (pengaturan terakhir). Klik **Seimbang** jika ingin 90 g.

---

## 3. Buka kartu Bonus aktivitas

Di <http://localhost:5173/balance>, scroll ke kartu **Bonus aktivitas**.

Yang harus terlihat:
- Menit aktif **0 menit**
- Bonus **+0 g**
- Aktivitas **0**
- Tier: 30+ → +10 g, 60+ → +20 g, 90+ → +30 g, 150+ → +45 g
- Pesan **“OAuth Strava belum dikonfigurasi”**
- Tombol **Simulasi 45 menit** (karena `STRAVA_DEMO_MODE=true`)

---

## 4. Simulasi aktivitas pertama

Klik **Simulasi 45 menit**.

Yang harus berubah:
- Menit aktif → **45 menit**
- Bonus → **+10 g**
- Aktivitas → **1**
- Tier **30+ mnt · +10 g** menyala
- Budget di kartu “Sisa budget” naik **+10 g**
  - Jika preset Ketat 60 g → total **70 g**
  - Jika preset Seimbang 90 g → total **100 g**
- Muncul pesan “Aktivitas simulasi 45 menit ditambahkan.”

---

## 5. Simulasi kedua

Klik **Simulasi 45 menit** sekali lagi.

Yang harus berubah:
- Menit aktif → **90 menit**
- Bonus → **+30 g**
- Aktivitas → **2**
- Tier **90+, 60+, 30+** menyala
- Budget total naik menjadi **base + 30 g**
  - Ketat 60 g → **90 g**
  - Seimbang 90 g → **120 g**

---

## 6. Reset simulasi

Klik **Reset simulasi**.

Yang harus berubah:
- Menit aktif → **0 menit**
- Bonus → **+0 g**
- Aktivitas → **0**
- Budget kembali ke base preset (60 atau 90 g)
- Pesan “Simulasi aktivitas direset.”

---

## 7. Cek tier & konsistensi

- Tier yang menyala mengikuti total menit.
- Bonus di kartu Strava harus sama dengan `bonusGrams` di budget.
- Budget bar di `/menu` juga ikut berubah setelah simulasi/sync.

---

## 8. Cek migrasi Rewards

Buka <http://localhost:5173/chance>.

Harus **redirect otomatis ke `/balance`**.

Navbar dan Footer tidak lagi menampilkan link “Rewards” legacy.

---

## 9. Cek Mission baru

Buka <http://localhost:5173/mission>.

Yang harus terlihat:
- “Misi kami”
- “Nikmati manisnya tanpa kehilangan kontrol.”
- “Budget gula, bukan larangan.”
- “Bonus dari aktivitas, bukan hukuman.”
- Tier 30/60/90/150 menit.
- Disclaimer medis.

---

## 10. Untuk Strava asli (aksi manual)

Mode simulasi tidak memerlukan Strava app. Untuk OAuth asli:

1. Buka <https://www.strava.com/settings/api>.
2. Buat API Application:
   - Website: `http://localhost:5173`
   - Authorization Callback Domain: `localhost`
3. Salin **Client ID** & **Client Secret**.
4. Isi `server/.env`:

   ```env
   STRAVA_CLIENT_ID=xxxxx
   STRAVA_CLIENT_SECRET=xxxxx
   STRAVA_REDIRECT_URI=http://localhost:5050/api/v1/strava/callback
   STRAVA_DEMO_MODE=false
   ```

5. Restart backend.
6. Buka `/balance` → **Hubungkan Strava** → authorize.
7. Setelah kembali, klik **Sync sekarang**.

Kabari saya setelah credentials terpasang; saya bantu verifikasi OAuth + sync asli.

---

## Link Penting

| Halaman | URL |
|---|---|
| Balance + Strava | <http://localhost:5173/balance> |
| Menu | <http://localhost:5173/menu> |
| Login | <http://localhost:5173/signin> |
| Mission | <http://localhost:5173/mission> |
| Swagger | <http://localhost:5050/api-docs> |
| Strava API settings | <https://www.strava.com/settings/api> |

---

## Yang Belum Bisa Dicoba

- Checkout, slot pickup, kode order, pembayaran di tempat → **Fase 4**.
- Dashboard staff → **Fase 5**.
- Webhook Strava real-time → belum ada; sync masih manual.
