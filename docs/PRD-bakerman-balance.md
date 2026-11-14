# Bakerman Balance — Product Requirements Document (PRD)

**Versi:** 0.1 (Draft)
**Tanggal:** 13 November 2026
**Kota awal:** Bandung
**Brand:** Fiktif (portfolio-grade concept)
**Model:** Pickup-only, pre-order, budget gula mingguan + bonus aktivitas Strava

---

## 1. Ringkasan Produk

**Bakerman Balance** adalah bakery pre-order di Bandung yang membuat konsumsi dessert lebih sadar dan terukur:

> **“Nikmati manisnya. Jaga progresnya.”**

Setiap produk menampilkan gula per porsi. Setiap member punya **budget gula mingguan** (default 90 g). Order akan mengurangi budget tersebut. Aktivitas olahraga yang terverifikasi lewat **Strava OAuth** menambah budget (maksimal +60 g/minggu). Semua order adalah **pickup** di satu outlet, dengan slot waktu dan kode order.

Ini bukan sekadar katalog + CRUD:

- Ada **aturan bisnis** yang dihitung server (budget, stok, harga).
- Ada **loop retensi mingguan** (budget reset, recap, bonus aktivitas).
- Ada **sisi operasional** (dashboard staff, status order, pickup).
- Ada **integrasi pihak ketiga** yang bermakna (Strava), bukan input link palsu.

---

## 2. Riset & Dasar Keputusan

### 2.1 Gula

WHO (Healthy diet fact sheet, 26 Jan 2026):

- Konsumsi **free sugars** dibatasi **<10% energi harian** — sekitar **50 g/hari** untuk diet 2.000 kkal.
- Menurunkan ke **<5%** (~25 g/hari) dapat memberi manfaat tambahan.

**Implikasi produk:**

- Budget default **90 g/minggu** (~13 g/hari) untuk dessert Bakerman saja — cukup untuk 3–5 treat, tanpa mengklaim sebagai batas medis.
- Budget adalah **self-set treat allowance**, bukan target nutrisi harian total.
- Semua produk tetap dijual, termasuk yang tinggi gula. Label gula (Ringan/Seimbang/Manja/Manja banget) adalah alat transparansi, bukan larangan.
- Budget adalah **self-set treat allowance**, bukan target nutrisi harian total.

Sumber: <https://www.who.int/news-room/fact-sheets/detail/healthy-diet>

### 2.2 Aktivitas fisik

WHO (Physical activity fact sheet, 4 Nov 2026):

- Dewasa disarankan **≥150 menit aktivitas moderat per minggu**.
- **31%** orang dewasa di dunia tidak memenuhi rekomendasi ini.

**Implikasi produk:**

- Bonus diberikan **progresif** berdasarkan total menit aktif per minggu:

  | Total menit aktif/minggu | Bonus budget |
  |---|---|
  | 30–59 menit | +10 g |
  | 60–89 menit | +20 g |
  | 90–149 menit | +30 g |
  | ≥150 menit | +45 g |

- **150 menit tetap menjadi target kesehatan WHO**, tetapi bukan gerbang masuk. Satu sesi lari 5 km (35–50 menit) sudah mendapat **+10 g**.
- Maksimal **+45 g/minggu** untuk mencegah kompensasi berlebihan.
- Hitung **moving time**, bukan elapsed time.
- Khusus Strava: hanya aktivitas **GPS-tracked** (bukan manual upload Strava) yang dihitung.
- Alternatif tanpa Strava (Fase 7): aktivitas manual dengan **screenshot bukti** di Cloudinary; diberi label manual dan tetap memakai tier bonus yang sama.
- Exclude e-bike dan aktivitas yang tidak relevan.

Sumber: <https://www.who.int/news-room/fact-sheets/detail/physical-activity>

### 2.3 Konteks Indonesia

Data International Diabetes Federation (Diabetes Atlas) via World Bank, diolah Our World in Data:

- Prevalensi diabetes Indonesia (usia 20–79, 2024): **11,3%**.

**Implikasi produk:**

- Kebutuhan akan transparansi gula nyata, tetapi **tidak boleh** mengklaim mencegah/mengobati diabetes.
- Gunakan bahasa “lebih sadar gula”, “pilihan lebih rendah gula”, bukan klaim medis.
- Sertakan disclaimer dan sarankan konsultasi tenaga kesehatan.

Sumber: <https://ourworldindata.org/grapher/diabetes-prevalence?country=~IDN>

### 2.4 Validasi model reward aktivitas

Strava (press release, 14 Juli 2026):

- **195 juta+ athlete** di 185+ negara.
- Strava dan adidas meluncurkan integrasi **aktivitas GPS → reward** (adiClub points).

**Implikasi produk:**

- Model “aktivitas → reward” sudah divalidasi secara industri.
- Gunakan **OAuth resmi Strava** jika tersedia; alternatif manual dengan screenshot bukti untuk pengguna tanpa Strava.
- Hormati rate limit, privacy, dan consent pengguna.

Sumber: <https://press.strava.com/articles/strava-and-adidas-partner-to-reward-users-for-logging-activity>

### 2.5 Prinsip Desain

1. **Transparansi, bukan larangan.** Budget adalah alat kontrol, bukan hukuman.
2. **Reward, bukan kompensasi.** Jangan framing “bakar kalori supaya boleh makan”.
3. **Server-authoritative.** Harga, gula, stok, dan budget dihitung server.
4. **Pickup-first.** Kualitas terjaga, operasional sederhana, cocok untuk pilot Bandung.
5. **Tanpa klaim medis.** Fokus pada kesadaran dan kebiasaan.
6. **Small batch.** Menu mingguan, stok harian, limited drop.

---

## 3. Masalah, Target, dan JTBD

### Masalah

- Orang ingin menikmati dessert tetapi merasa bersalah atau kehilangan kontrol.
- Bakery umumnya tidak transparan soal gula dan porsi.
- Orang dengan risiko metabolik menghindari bakery karena tidak ada informasi.
- Reward olahraga sering tidak terhubung ke konsumsi makanan.
- Bakery kecil kesulitan mengelola pre-order, stok harian, dan pickup via DM/WA.

### Target Utama (Bandung)

- Usia **22–35**, urban, pekerja/kreatif/mahasiswa pascasarjana.
- Aktif olahraga (running, cycling, gym) dan/atau pengguna Strava.
- Peduli gula/kalori, willing to pay **Rp 25.000–45.000** per item.
- Terbiasa pre-order dan pickup.

### Target Sekunder

- Gluten-free / intoleransi gluten.
- Prediabetes / insulin resistance (dengan disclaimer, bukan klaim medis).
- Komunitas lari/bersepeda dan corporate wellness.

### JTBD

> “Saat aku ingin reward manis, aku ingin tetap terkontrol gulanya dan tidak merusak progres latihan.”

### Alternatif yang Ada Sekarang

- Bakery biasa: tidak ada info gula, tidak ada moderasi.
- Healthy snack brand: mahal, tidak fresh, bukan experience bakery.
- Aplikasi diet: tracking saja, tidak menyediakan makanan.
- Marketplace: convenience, tanpa konteks kesehatan.

---

## 4. Positioning

**Untuk** orang urban Bandung yang aktif dan peduli gula
**yang** ingin menikmati dessert tanpa kehilangan kontrol,
**Bakerman Balance** adalah bakery pre-order
**yang** menampilkan gula transparan, budget mingguan, dan reward aktivitas,
**berbeda dari** bakery biasa karena membangun kebiasaan, bukan sekadar menjual kue.

**Tagline:** *Nikmati manisnya. Jaga progresnya.*

**Value proposition:**

1. **Tahu persis** gula per porsi.
2. **Atur budget** mingguan sendiri.
3. **Bonus dari olahraga** yang terverifikasi.
4. **Pickup terjamin** dengan slot dan kode order.
5. **Recap mingguan** untuk melihat progres.

---

## 5. Model Bisnis

- **Pendapatan utama:** penjualan produk (pickup).
- **Margin:** target food cost ≤40%, gross margin ≥60%.
- **Biaya reward:** bonus budget **bukan diskon** — hanya menambah kuota belanja, sehingga tidak langsung menggerus margin.
- **Nanti:** membership (priority slot, free delivery), corporate box, merchandise.
- **MVP:** pembayaran **pay at pickup** (tunai/QRIS di outlet) — tidak ada payment gateway dulu.

---

## 6. Aturan Bisnis Inti

### 6.1 Siklus Mingguan

- Senin 00:00 – Minggu 23:59 **WIB**.
- Reset otomatis setiap Senin.
- Order yang dibuat Minggu malam tetap dihitung ke minggu berjalan.

### 6.2 Budget Gula

| Preset | Budget/minggu | Untuk siapa |
|---|---|---|
| Santai | 120 g | Tidak sedang ketat |
| Seimbang (default) | 90 g | Mayoritas |
| Ketat | 60 g | Sedang menjaga asupan |

- Budget dapat diubah kapan saja; perubahan berlaku untuk sisa minggu berjalan.
- Budget hanya menghitung gula dari produk Bakerman, bukan total diet.
- **Mode budget:**
  - `guide` (default): order yang melebihi budget **tetap boleh**, dengan peringatan dan konfirmasi. Recap menandai overage.
  - `strict`: server **menolak** order yang melebihi budget dan menyarankan produk lebih rendah gula.
- Jika order melebihi sisa budget pada mode `strict` → server menolak dengan saran produk lebih rendah gula.

### 6.3 Klasifikasi Produk

| Level | Gula/porsi | Label |
|---|---|---|
| Light | ≤10 g | “Ringan” |
| Balanced | 11–20 g | “Seimbang” |
| Indulgent | 21–35 g | “Manja” |
| Extra | >35 g | “Manja banget” |

- **Semua produk tetap dijual**, termasuk yang tinggi gula — seperti bakery pada umumnya.
- Label gula adalah alat transparansi, bukan larangan.
- Produk >35 g tetap boleh; konsumsi budget dihitung proporsional dan ditampilkan jelas.
- Setiap produk wajib punya `sugarGrams`, `allergens`, dan `tags` (gluten-free, vegan, dll).

### 6.4 Bonus Strava

- Bonus diberikan **progresif** berdasarkan total menit aktif dalam minggu berjalan:

  | Total menit aktif/minggu | Bonus budget |
  |---|---|
  | 30–59 menit | +10 g |
  | 60–89 menit | +20 g |
  | 90–149 menit | +30 g |
  | ≥150 menit | +45 g |

- **150 menit adalah target WHO**, bukan syarat minimum. Satu sesi lari 5 km (35–50 menit) sudah dapat +10 g.
- Maksimum **+45 g/minggu**.
- Khusus Strava: hanya aktivitas **GPS-tracked**, bukan manual upload Strava.
- Alternatif manual (Fase 7): screenshot bukti wajib, disimpan di Cloudinary dan dihapus setelah 7 hari; record aktivitas tetap dihitung.
- Exclude `EBikeRide` (dan `VirtualRide` opsional).
- Deduplikasi berdasarkan `activityId`.
- Jika Strava disconnect, bonus minggu berjalan tetap dihitung tetapi tidak ada sync baru.

### 6.5 Order & Pickup

- Minimal order: 1 item.
- Slot pickup: per 30 menit, kapasitas 8 order/slot.
- Stok harian per produk; oversell dicegah dengan atomic decrement.
- Order code: 8 karakter human-friendly (tanpa 0/O, 1/I/L), single-use.
- Status: `pending_payment → paid → preparing → ready → picked_up` (atau `canceled`/`expired`).
- Pembatalan oleh user hanya boleh saat `pending_payment`; budget dan stok dikembalikan.
- Order tidak diambil >2 jam dari slot → `expired`, tanpa refund otomatis (kebijakan outlet).

### 6.6 Anti-Abuse

- Satu akun = satu budget mingguan.
- Rate limit order & Strava sync.
- Idempotency key untuk pembuatan order.
- Validasi harga, gula, stok, dan budget di server.
- Admin role untuk mengubah status/stok.

---

## 7. MVP Scope

### Must Have

1. Auth Firebase + verifikasi ID token di server.
2. Onboarding: preset budget, target mingguan, connect Strava (opsional).
3. Katalog + filter (level gula, gluten-free).
4. Detail produk: gula, bahan, allergen, harga.
5. Cart + pickup slot + order creation (server-authoritative).
6. Kode order + halaman konfirmasi.
7. Dashboard staff: antrean order, ubah status, stok harian.
8. Strava OAuth + sync + bonus budget.
9. Dashboard Balance: sisa budget, menit aktif, riwayat, recap mingguan.
10. Admin produk (CRUD + stok).

### Should Have

- Notifikasi email/WA saat order siap.
- Riwayat recap mingguan yang bisa di-share.
- Filter allergen.
- Seed data realistis 10 produk (termasuk item tinggi gula).

### Later (bukan sekarang)

- Multi-outlet UI (schema & `locationId` sudah disiapkan).
- Notifikasi email/WA saat order siap.
- Filter allergen lanjutan.
- Marketplace partner (opsional).

### Out of Scope (MVP)

- **Payment gateway** — hanya pay at pickup (tunai/QRIS manual).
- **Delivery** — pickup-only.
- **Subscription** — tidak ada paket langganan.
- **Referral** — tidak ada program referral.
- **Multi-outlet UI** — satu outlet dulu; schema siap untuk ekspansi.
- Klaim medis / rekomendasi diet personal.
- Perhitungan kalori/makro lengkap.
- Native app.
- Loyalty points di luar budget gula.

---

## 8. User Flow

### 8.1 Onboarding

1. Landing → “Lihat menu minggu ini”.
2. Sign up / login (Firebase).
3. Pilih preset budget (Santai/Seimbang/Ketat).
4. Opsional: connect Strava.
5. Masuk ke menu dengan budget bar.

### 8.2 Order Pickup

1. Menu → filter → product detail.
2. Add to order (qty).
3. Cart menampilkan total harga + total gula + sisa budget setelah order.
4. Pilih tanggal & slot pickup.
5. Konfirmasi → server validasi budget/stok → order dibuat.
6. Halaman sukses: kode order, lokasi, slot, status pembayaran.
7. Staff menandai paid/preparing/ready; user melihat status.
8. Pickup: tunjukkan kode → staff menandai picked_up.

### 8.3 Strava Bonus

1. Account → Connect Strava.
2. OAuth consent.
3. Sync aktivitas minggu berjalan.
4. Bonus progresif: 30–59 menit → +10 g; 60–89 → +20 g; 90–149 → +30 g; ≥150 → +45 g.
5. Budget bar diperbarui.

### 8.4 Weekly Recap

- Total gula dikonsumsi dari Bakerman.
- Total menit aktif.
- Bonus didapat.
- Jumlah order.
- Status: “Di dalam budget” / “Melewati budget” (tanpa menghakimi).

### 8.5 Staff Flow

1. Login admin.
2. Lihat order baru (pending payment).
3. Konfirmasi pembayaran → paid.
4. Siapkan → ready.
5. Serahkan → picked_up.
6. Update stok jika habis.

---

## 9. Wireframe (Deskripsi)

### Landing

```
[Hero]
  "Nikmati manisnya. Jaga progresnya."
  "Bakery pre-order Bandung dengan gula transparan."
  [Lihat menu minggu ini] [Cara kerja]

[3 value cards]
  Budget gula | Bonus Strava | Pickup terjamin

[Menu preview]
  Kartu produk: gambar, nama, badge gula, harga

[How it works]
  1. Atur budget → 2. Pilih treat → 3. Pickup

[Footer]
```

### Menu

```
[Sticky budget bar]
  Budget 90g • Terpakai 25g • Sisa 65g   [+30g dari Strava]

[Filter chips]
  Semua | Ringan ≤10g | Seimbang 11–20g | Manja 21–35g | Manja banget >35g | Gluten-free

[Grid produk]
  Gambar
  Nama
  Badge: 12g gula
  Harga
  [Tambah]
```

### Detail Produk

```
[Gambar besar]        [Nama]
                      [Badge gula] [Tags]
                      Deskripsi
                      Bahan & allergen
                      Harga
                      "Order ini memakai 12g dari sisa 65g"
                      [Qty] [Tambah ke order]
```

### Checkout

```
[Items + qty + harga]
[Total harga]
[Total gula]
[Sisa budget setelah order]

[Pickup]
  Tanggal: [chip]
  Slot: [15:00–15:30] [15:30–16:00] ...

[Pembayaran]
  Pay at pickup (QRIS/tunai)

[Place order]
```

### Konfirmasi

```
Order berhasil!
Kode: BKM-7K2P
Pickup: Sabtu, 15:30–16:00
Lokasi: Jl. ... Bandung
Status: Menunggu pembayaran
[Lihat order]
```

### Account / Balance

```
Budget ring: 65/90g
Bonus Strava: +30g
Menit aktif: 120/150

Minggu ini:
- 1 order
- 18g gula
- Status: di dalam budget

[Connect Strava] [Riwayat order] [Recap]
```

### Staff Dashboard

```
[Baru] [Dibayar] [Disiapkan] [Siap] [Diambil]

Order card:
BKM-7K2P
2x Roti Susu Pandan, 1x Brownie
18g gula
Pickup 15:30–16:00
[Konfirmasi bayar] [Siapkan] [Serahkan]

[Stok hari ini]
Produk | Stok | Terjual
```

---

## 10. Functional Requirements (Ringkas)

| ID | Requirement | Acceptance |
|---|---|---|
| AUTH-1 | Verifikasi Firebase ID token | Request tanpa token → 401 |
| AUTH-2 | Role admin | Endpoint admin menolak non-admin |
| BUD-1 | Budget mingguan per user | Reset Senin; tidak bisa minus |
| BUD-2 | Order mengurangi budget | Total gula dihitung server |
| BUD-3 | Strava bonus | 30/60/90/150 menit → +10/+20/+30/+45 g; maks +45 g |
| CAT-1 | Katalog + filter | Filter level gula & gluten-free |
| ORD-1 | Order server-authoritative | Harga/gula/stok dari DB |
| ORD-2 | Pickup slot | Kapasitas 8/slot; slot penuh ditolak |
| ORD-3 | Kode order unik | 8 char, single-use |
| ORD-4 | Idempotency | Double submit tidak membuat 2 order |
| ADM-1 | Staff ubah status | Transisi valid saja |
| STR-1 | OAuth Strava | Connect/disconnect aman |
| STR-2 | Dedup aktivitas | Activity ID unik |
| REC-1 | Recap mingguan | Total gula, menit, bonus, order |

---

## 11. Non-Functional Requirements

### Keamanan

- Firebase Admin SDK; email diambil dari token, bukan body.
- Semua perhitungan harga/gula/stok di server.
- Rate limit auth, order, Strava sync.
- Helmet, CORS allowlist, validasi input.
- Secret di environment; tidak ada `.env` di Git.
- Admin role via custom claim.

### Privasi

- Strava: simpan token terenkripsi; hanya ambil data yang dibutuhkan.
- Bisa disconnect & hapus data Strava.
- Tidak menjual data.
- Disclaimer medis di onboarding & footer.

### Performa

- LCP <2,5 s; CLS <0,1.
- Bundle awal <200 KB gzip.
- Gambar WebP/AVIF + srcset.

### Aksesibilitas

- WCAG AA, keyboard navigation, aria labels.
- Kontras teks ≥4,5:1.

### Observability

- Structured logging, error tracking, health check.
- Audit log untuk perubahan status order/stok.

---

## 12. Metrik Keberhasilan (Target Pilot)

| Metrik | Target |
|---|---|
| Signup → set budget | ≥70% |
| Signup → connect Strava | ≥35% |
| First order ≤7 hari | ≥25% |
| Repeat order minggu ke-2 | ≥30% |
| Order dalam budget | ≥65% (mode `guide`); mode `strict` 100% enforced |
| Rata-rata gula/order | ≤20 g |
| Pickup on-time | ≥90% |
| Cancel/expired | ≤10% |

**North Star:** member aktif mingguan yang order dan tetap di dalam budget.

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Framing “olahraga untuk makan” | Mempromosikan compensatory behavior | Copy hati-hati, cap bonus, tanpa ekuivalensi kalori |
| Klaim medis | Regulasi/etika | Disclaimer, bahasa non-medis, review ahli gizi |
| Budget terasa membatasi | User churn | Preset longgar, mode `guide`, transparansi, saran alternatif |
| Menu tinggi gula | Positioning health dipertanyakan | Label gula jelas, mode `guide`, edukasi porsi; tidak mengklaim semua produk “sehat” |
| Overage tidak terkontrol (mode guide) | Budget kehilangan makna | Peringatan + konfirmasi, recap mingguan, opsi `strict` |
| Strava API | Rate limit/approval | Cache, sync manual, fallback tanpa Strava |
| Stok/operasional | Oversell, telat | Slot capacity, atomic stock, staff dashboard |
| Data gula tidak akurat | Kepercayaan | Label “estimasi”, uji laboratorium saat scale |
| Brand fiktif | Tidak ada traksi nyata | Perlakukan sebagai portfolio + pilot konsep |

---

## 14. Rollout Bandung (Hipotesis)

1. **Pilot 4 minggu:** 1 outlet, 10 produk, 20–30 order/minggu.
2. **Partner komunitas:** running/cycling club Bandung untuk challenge Strava.
3. **Konten:** transparansi gula, behind-the-scenes, recap member.
4. **Corporate:** paket box untuk kantor/komunitas.
5. **Evaluasi:** metrik di atas; iterasi menu dan budget.

Karena brand fiktif, rollout ini berfungsi sebagai **skenario go-to-market** dalam portfolio, bukan klaim traksi nyata.

---

## 15. Fase Build

| Fase | Fokus | Output | Estimasi |
|---|---|---|---|
| 0 | PRD, data model, API design | Dokumen ini + `DATA-MODEL-AND-API.md` | ✅ |
| 1 | Fondasi & keamanan | Firebase Admin, user/role, env, test setup, hapus alur `chances`/`purchase` lama | 2–3 hari |
| 2 | Katalog & transparansi gula | Produk normal (termasuk tinggi gula), label gula, filter, detail, seed | 2 hari |
| 3 | Budget & Strava | Budget `guide`/`strict`, OAuth Strava, sync, tier bonus progresif | 3 hari |
| 4 | Order & pickup | Cart, slot, order transaksional, kode, konfirmasi, **pay at pickup** | 3–4 hari |
| 5 | Staff dashboard & multi-outlet-ready | Status order, stok harian, `locationId` (satu outlet dulu) | 2 hari |
| 6 | Balance dashboard & recap | Riwayat order, sisa budget, menit aktif, recap mingguan | 2 hari |
| 7 | Polish | UI/UX, a11y, performa, SEO, copy, hapus kredensial demo dari UI | 2 hari |
| 8 | Test & deploy | Unit/API/E2E, CI, Docker/deploy, Atlas Cloud | 2–3 hari |

> **Status implementasi (14 Nov 2026):** Fase build 1–8 selesai. Fase 5 recap/polish/SEO/E2E/CI, Fase 6 production hardening/Docker, Fase 7 alternatif Strava (aktivitas manual + Cloudinary), Fase 8 UI fix + deploy. Frontend live di `https://bakerman.ridwanafazn.my.id` (Cloudflare Pages); API live di `https://bakerman-api.vercel.app/api` (Vercel) dengan MongoDB Atlas dan Cloudinary asli. Strava asli masih opsional/manual karena butuh langganan. Lihat `docs/PHASE-8-REPORT.md`.

**Total:** ~16–21 hari kerja untuk versi portfolio lengkap.

**Tidak dibangun sekarang:** payment gateway, delivery, subscription, referral.
**Disiapkan di schema, belum di-UI:** multi-outlet (`locationId`).

---

## 16. Keputusan Terbuka

1. Nama outlet & alamat fiktif Bandung.
2. Jam operasional & slot pickup.
3. Harga & 10 produk final (termasuk item tinggi gula).
4. Default mode budget: `guide` (rekomendasi) atau `strict`.
5. Multi-outlet: satu outlet di MVP, schema siap ekspansi.
6. Admin role: satu role `staff`/`admin` atau dipisah kasir/dapur.

---

## 17. Sumber

- WHO — Healthy diet (26 Jan 2026): <https://www.who.int/news-room/fact-sheets/detail/healthy-diet>
- WHO — Physical activity (4 Nov 2026): <https://www.who.int/news-room/fact-sheets/detail/physical-activity>
- WHO — Guideline: Sugars intake for adults and children (2015): <https://www.who.int/publications/i/item/9789241549028>
- WHO — Guidelines on physical activity and sedentary behaviour (2020): <https://www.who.int/publications/i/item/9789240015128>
- IDF Diabetes Atlas / World Bank via Our World in Data — diabetes prevalence Indonesia 2024: <https://ourworldindata.org/grapher/diabetes-prevalence?country=~IDN>
- Strava Press — Strava and adidas partner to reward users for logging activity (14 Jul 2026): <https://press.strava.com/articles/strava-and-adidas-partner-to-reward-users-for-logging-activity>
