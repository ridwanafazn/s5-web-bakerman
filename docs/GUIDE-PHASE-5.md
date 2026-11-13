# Guide — Merasakan Hasil Fase 5

Fase 5 menambahkan **rekap mingguan**, **filter + pagination pesanan**, polish aksesibilitas, optimasi performa, SEO, serta test E2E & CI.

---

## 🌐 Link untuk HP (beda jaringan)

Tunnel publik aktif:

**https://speed-podcasts-movements-moms.trycloudflare.com**

- Diarahkan ke **production preview** (`vite preview`, port 4173).
- Laptop harus tetap menyala dan online.
- Login pakai **email/password**.
- Kalau link mati, kabari saya untuk membuat tunnel baru.

> Untuk stack production Docker (nginx + API + Mongo), lihat **`docs/GUIDE-PHASE-6.md`**.

Link lokal:

| Layanan | URL |
|---|---|
| App (dev) | <http://localhost:5173> |
| Preview | <http://localhost:4173> |
| API | <http://localhost:5050> |
| Swagger | <http://localhost:5050/api-docs> |
| Health | <http://localhost:5050/health> |

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

> Member: budget **66 g**, 4 order (2 selesai, 2 dibatalkan). Admin: budget 60 g, tanpa order.

---

## 1. Cek Rekap Mingguan

1. Login sebagai **member**.
2. Buka **/balance**.
3. Scroll ke bawah, lihat bagian **“Empat minggu terakhir”**.
4. Yang bisa dicek:
   - Ringkasan: Order, Selesai, Menit aktif, Minggu on-budget.
   - Grafik 4 batang: tinggi = pemakaian gula; merah = over-budget.
   - Kartu per minggu: gula terpakai, sisa, order, menit aktif, bonus, top produk.
   - Minggu ini ditandai badge **“Minggu ini”**.
   - Tiga minggu sebelumnya kosong karena belum ada data — ini memang perilaku yang benar (tidak mengarang riwayat).
5. Klik **Refresh rekap** untuk memuat ulang.

### Coba bonus aktivitas
1. Di kartu **Bonus aktivitas**, klik **Simulasi 45 menit**.
2. Budget naik +10 g (total 100 g), rekap menampilkan **45 menit aktif** dan bonus **+10 g**.
3. Klik **Reset simulasi** untuk kembali ke 0.
4. Rekap otomatis ikut diperbarui.

---

## 2. Cek Filter & Pagination Pesanan

1. Buka **/orders**.
2. Klik filter:
   - **Semua** → 4 order.
   - **Aktif** → saat ini kosong (tidak ada order berjalan).
   - **Selesai** → 2 order `picked_up`.
   - **Dibatalkan** → 2 order `canceled`.
3. Empty state muncul jika filter tidak punya order.

> **Pagination** hanya muncul jika jumlah order **lebih dari 8**. Dengan 4 order saat ini, semua order tampil di satu halaman. Jika ingin melihat tombol halaman, saya bisa buatkan order demo tambahan lalu membersihkannya lagi.

---

## 3. Cek Aksesibilitas

1. Buka halaman mana saja.
2. Tekan **Tab** sekali → muncul tombol **“Lewati ke konten utama”**.
3. Tekan **Enter** → fokus pindah ke konten, bukan ke navbar.
4. Tab melalui navigasi → item aktif punya `aria-current`.
5. Buka **/checkout** → tombol tanggal/slot punya status pressed.
6. Buka **/staff** → input stok punya label untuk screen reader, tabel punya caption.
7. Aktifkan **prefers-reduced-motion** di OS/browser → animasi berkurang.

---

## 4. Cek Performa

1. Buka DevTools → **Network** → reload halaman.
2. Perhatikan:
   - Logo navbar sekarang **±30 KB** (sebelumnya 941 KB).
   - Halaman Mission/Checkout/Staff/Balance dimuat sebagai chunk terpisah saat dibuka.
   - Gambar di bawah lipatan dimuat lazy.
3. Build lokal:
   ```bash
   cd client
   npm run build
   ```
   Shared chunk awal ±443 KB raw / ±142 KB gzip; route lain on-demand.

---

## 5. Cek SEO

1. Buka **view-source** halaman.
2. Cek:
   - `<title>` berubah per route (misalnya `/menu`, `/balance`, `/orders`).
   - Meta description, Open Graph, Twitter card.
   - JSON-LD `Bakery` dengan alamat Bandung.
   - `/robots.txt` membatasi `/staff`, `/checkout`, `/cart`, `/order/`.

---

## 6. Jalankan E2E Sendiri

Prasyarat: MongoDB, server, dan preview sedang berjalan.

```bash
cd client
npm run e2e
```

Yang diuji:
- Landing mobile render.
- Menu 10 produk.
- Login member + budget.
- Rekap mingguan.
- Filter pesanan.
- Pagination (jika >8 order).
- Alur checkout tanpa membuat order.
- Staff dashboard admin.
- 0 console error.

Uji lewat tunnel:

```bash
# PowerShell
$env:E2E_BASE_URL="https://speed-podcasts-movements-moms.trycloudflare.com"
npm run e2e
```

---

## 7. CI

Workflow ada di:

- `.github/workflows/ci.yml` — server tests + client lint + build.
- `.github/workflows/e2e.yml` — manual E2E dengan URL + secrets akun.

Aktif otomatis setelah repo di-push ke GitHub. E2E manual dijalankan dari tab **Actions → E2E smoke (manual)**.

---

## 8. Deployment

Panduan lengkap: **`docs/DEPLOYMENT.md`**.

Ringkas:
1. MongoDB Atlas Cloud.
2. Deploy `server/` ke Vercel (env production).
3. Deploy `client/` ke Vercel (`VITE_API_URL` ke API).
4. Tambahkan domain Vercel ke Firebase Authorized Domains.
5. Update `CORS_ORIGIN` dan Strava callback.
6. Jalankan smoke test.

> Deploy aktual belum dilakukan karena menunggu login Atlas Cloud, service account Firebase production, dan akun Vercel.

---

## Checklist Cepat

- [ ] Link tunnel terbuka di HP.
- [ ] Login member berhasil.
- [ ] `/balance` menampilkan rekap 4 minggu.
- [ ] Simulasi 45 menit menambah bonus +10 g dan menit aktif 45.
- [ ] Reset simulasi mengembalikan bonus ke 0.
- [ ] `/orders` filter Selesai/Dibatalkan berfungsi.
- [ ] Tab pertama memunculkan skip link.
- [ ] Logo navbar kecil/cepat.
- [ ] Title halaman berubah saat pindah route.
- [ ] `npm run e2e` → `ok: true`, `consoleErrors: 0`.

---

## Yang Belum Ada

- Deploy cloud (menunggu kredensial).
- Strava asli (menunggu Client ID/Secret).
- Pagination terlihat dengan data saat ini (butuh >8 order).
- Sitemap XML (menunggu domain final).
- Notifikasi email/WA.
- Payment gateway (tetap pay at pickup).
