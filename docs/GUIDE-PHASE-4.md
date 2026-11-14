# Guide — Merasakan Hasil Fase 4

Fase 4 menambahkan **order pickup nyata**: checkout, slot, kode order, staff dashboard, stok, dan budget.

> Untuk fitur terbaru (rekap mingguan, filter/pagination, a11y, performa, SEO), lihat **`docs/GUIDE-PHASE-5.md`**.

---

## 🌐 Link untuk HP (beda jaringan)

Tunnel publik aktif:

**https://bean-martial-old-thy.trycloudflare.com**

Ini adalah **production preview** (`vite preview`), bukan dev server — lebih cepat dan stabil di browser HP karena hanya memuat satu bundle JS/CSS, tanpa HMR.

Sudah diuji di viewport HP (390×844):
- Landing render (hero + 3 produk)
- Login member berhasil
- Budget 66 g tampil
- Menu 10 produk
- **0 console error**

Catatan:
- Link ini **sementara** (Cloudflare Quick Tunnel). Kalau mati, kabari saya untuk membuat link baru.
- Login gunakan **email/password** (Google sign-in mungkin memerlukan authorized domain tambahan).
- Jangan bagikan link ini ke publik; ini dev preview.
- Kalau blank: coba **hard refresh** / buka di **incognito**, pastikan JavaScript aktif, dan laptop tetap menyala/online.

Link lokal: <http://localhost:5173>

---

## Akun

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

> Member saat ini punya 4 order demo dan sisa budget **66 g**. Admin budget 60 g (Ketat), tanpa order.

---

## Alur Member — Checkout & Pickup

### 1. Login
Buka **/signin** (lokal atau tunnel), login sebagai member.

### 2. Pilih produk
Buka **/menu**, pilih **Roti Susu Pandan**, klik **Tambah**.

### 3. Keranjang
Buka **/cart**:
- Subtotal Rp 18.000
- Total gula 8 g
- Sisa budget sekarang 66 g → setelah keranjang 58 g
- Klik **Lanjut ke checkout**

### 4. Checkout
Di **/checkout**:
- Pilih tanggal (default hari ini).
- Pilih slot (contoh 11:00–11:30).
- Ringkasan budget.
- Klik **Buat order pickup**.

### 5. Halaman order
Kamu diarahkan ke **/order/XXXXXX**:
- Kode order besar.
- Status **Menunggu pembayaran**.
- Pickup: tanggal, slot, lokasi.
- Tombol **Batalkan order** (jika masih pending).

### 6. Riwayat
Buka **/orders**:
- Semua order member.
- Klik kartu untuk detail.

---

## Alur Staff — Dashboard

### 1. Login sebagai staff/admin
Gunakan `bakerman@gmail.com` / `bakermanAdmin` atau `qa.bakerman.101126@gmail.com` / `Bakerman123!`.

### 2. Buka Staff Dashboard
**/staff**

Yang terlihat:
- Filter tanggal.
- Antrean order (kode, user, item, gula, pickup, status).
- Tombol aksi sesuai status:
  - **Konfirmasi bayar**
  - **Siapkan**
  - **Siap diambil**
  - **Serahkan**
  - **Batalkan/Expired**
- Tabel stok harian (total/reserved/terjual/tersedia) + input set total.

### 3. Proses order
Contoh:
1. Cari kode order member.
2. Klik **Konfirmasi bayar** → status “Sudah dibayar”.
3. Klik **Siapkan** → “Disiapkan”.
4. Klik **Siap diambil** → “Siap diambil”.
5. Saat member datang, klik **Serahkan** → “Sudah diambil”.
6. Stok reserved berpindah ke sold.

### 4. Cek stok
Ubah total stok di kolom **Set total**, klik **Simpan**.
Validasi: total tidak boleh kurang dari reserved + sold.

---

## Over-budget (Guide vs Strict)

### Guide (default)
1. Tambah **3 Chocolate Fudge Cake** (105 g) ke cart.
2. Buka checkout.
3. Muncul warning: “Order ini melebihi budget 39 g.”
4. Centang **“Saya tetap lanjut dan mencatat overage ini.”**
5. Tombol order aktif.

### Strict
1. Buka **/balance** → klik **Strict**.
2. Coba checkout order yang melebihi budget.
3. Tombol order disabled dan server akan menolak dengan `BUDGET_EXCEEDED`.
4. Kembalikan ke **Guide** setelah selesai.

---

## Yang Bisa Dilihat untuk Membuktikan Fase 4

- [ ] Order baru muncul di `/orders` dengan kode unik.
- [ ] Budget berkurang setelah order.
- [ ] Stok `reserved` bertambah setelah order.
- [ ] Staff bisa mengubah status sampai `picked_up`.
- [ ] Setelah `picked_up`, stok `reserved` → `sold`.
- [ ] Cancel order pending mengembalikan budget + stok + slot.
- [ ] Over-budget guide butuh konfirmasi; strict menolak.
- [ ] Staff dashboard menampilkan order & stok.

---

## Yang Belum Ada

- Payment gateway (tetap pay at pickup).
- Delivery/subscription/referral.
- Notifikasi email/WA.
- Webhook Strava (sync manual).
- Pagination order.
- E2E otomatis/CI (masih verifikasi manual + headless).
