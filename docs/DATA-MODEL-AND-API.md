# Bakerman Balance — Data Model & API Design

**Versi:** 0.1
**Terkait:** `docs/PRD-bakerman-balance.md`
**Prinsip:** server-authoritative, transaksional, aman, dan siap untuk pickup-only Bandung.

---

## 0. Status Implementasi (Fase 7)

- ✅ Model & route aktif: `User`, `Product`, `Location`, `DailyStock`, `BudgetPeriod`, `PickupSlot`, `Order`, `StravaActivity`, `ManualActivity`, `AuditLog`.
- ✅ API v1: auth/session, me, recap, products, locations, menu/today, pickup-slots, orders, activities, admin, strava, internal cleanup.
- 🔁 Kompatibilitas: field legacy (`chances`, `chancesResetAt`, `stravaLink`, `buyHistory`) dan route legacy tetap ada sampai UI migrasi.
- 📌 Catatan implementasi: produk menyimpan gula di field `sugar`; API v1 mengeksposnya sebagai `sugarGrams` agar kontrak API tetap jelas.
- ✅ Fase 2: UI menu, detail produk, cart, dan Balance memakai API v1. `GET /api/v1/products/:slug` sekarang menyertakan stok hari ini.
- ✅ Fase 3: Strava OAuth (connect/callback/sync/status/disconnect) + mode simulasi dev. `StravaActivity` sudah aktif; bonus masuk ke `BudgetPeriod.bonusGrams`.
- ✅ Fase 4: Order/checkout/pickup/staff aktif. `Order` & `AuditLog` dipakai; stok/budget dipotong transaksional; status order dikelola staff.
- ✅ Fase 5: Recap mingguan (`GET /api/v1/me/recap`), filter + pagination order, a11y, performa, SEO, E2E, CI, dan panduan deploy.
- ✅ Fase 6: Production hardening & packaging — validasi env production, `/ready`, JSON request log, Swagger tertutup di production, Dockerfile API/client, nginx, Compose production, CI Docker build.
- ✅ Fase 7: Alternatif Strava — aktivitas manual + screenshot wajib + Cloudinary + auto-delete 7 hari + cron cleanup.

---

## 1. Koleksi MongoDB

### 1.1 `users`

```js
{
  _id: ObjectId,
  firebaseUid: String,          // unique, required
  email: String,                // unique, lowercase
  name: String,
  role: 'member' | 'staff' | 'admin', // default member
  budgetPreset: 'santai' | 'seimbang' | 'ketat', // default seimbang
  weeklyBudgetGrams: Number,    // 60 | 90 | 120
  budgetMode: 'guide' | 'strict', // default guide
  strava: {
    athleteId: Number,
    accessToken: String,        // encrypted at rest
    refreshToken: String,       // encrypted at rest
    expiresAt: Date,
    scope: String,
    connectedAt: Date,
    lastSyncAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `firebaseUid` unique, `email` unique, `role`.

---

### 1.2 `products`

```js
{
  _id: ObjectId,
  slug: String,                 // unique, e.g. "roti-susu-pandan"
  name: String,
  description: String,
  price: Number,                // integer IDR
  sugarGrams: Number,           // per serving, 0-100
  sugarLevel: 'light' | 'balanced' | 'indulgent' | 'extra',
  category: String,             // Breads, Cakes, Cookies, Desserts, Gluten-Free
  tags: [String],               // gluten-free, vegan, nut-free, low-sugar
  allergens: [String],
  ingredients: [String],
  image: String,
  active: Boolean,              // default true
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `slug` unique, `category`, `active`, `sugarGrams`.

**Aturan:** semua produk boleh dijual, termasuk yang tinggi gula. `sugarGrams` hanya label transparansi.

---

### 1.3 `locations`

```js
{
  _id: ObjectId,
  name: String,                 // "Bakerman Bandung — Dago"
  address: String,
  city: String,                 // "Bandung"
  timezone: String,             // "Asia/Jakarta"
  active: Boolean,
  openingHours: {
    mon: { open: '09:00', close: '20:00' },
    // ...
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `city`, `active`.

> MVP hanya memakai satu lokasi, tetapi `locationId` dipakai di order, stok, dan slot agar multi-outlet tinggal menambah data/UI.

---

### 1.4 `dailystocks`

```js
{
  _id: ObjectId,
  productId: ObjectId,          // ref products
  locationId: ObjectId,         // ref locations
  date: String,                 // 'YYYY-MM-DD' in Asia/Jakarta
  total: Number,                // stok yang disiapkan
  reserved: Number,             // sudah diorder, belum diambil
  sold: Number,                 // sudah diambil
  createdAt: Date,
  updatedAt: Date
}
```

**Index unik:** `(locationId, productId, date)`.

**Available** = `total - reserved - sold`.

---

### 1.5 `budgetperiods`

```js
{
  _id: ObjectId,
  userId: ObjectId,             // ref users
  weekStart: Date,              // Senin 00:00 WIB
  weekEnd: Date,                // Minggu 23:59 WIB
  baseBudgetGrams: Number,
  bonusGrams: Number,           // default 0, max 45
  consumedGrams: Number,        // default 0
  orderCount: Number,           // default 0
  status: 'open' | 'closed',
  createdAt: Date,
  updatedAt: Date
}
```

**Index unik:** `(userId, weekStart)`.

**Sisa budget** = `baseBudgetGrams + bonusGrams - consumedGrams`.

---

### 1.6 `orders`

```js
{
  _id: ObjectId,
  code: String,                 // unique, 8 char human-friendly
  userId: ObjectId,             // ref users
  items: [{
    productId: ObjectId,
    name: String,               // snapshot
    price: Number,              // snapshot
    qty: Number,
    sugarGrams: Number,         // snapshot per item
    lineTotal: Number
  }],
  subtotal: Number,
  totalSugarGrams: Number,
  pickup: {
    date: String,               // 'YYYY-MM-DD'
    slotStart: String,          // 'HH:mm'
    slotEnd: String,            // 'HH:mm'
    locationId: String
  },
  status: 'pending_payment' | 'paid' | 'preparing' | 'ready' | 'picked_up' | 'canceled' | 'expired',
  payment: {
    method: 'pay_at_pickup' | 'qris_manual',
    paidAt: Date,
    confirmedBy: ObjectId       // staff
  },
  idempotencyKey: String,       // unique per user
  budgetOverride: Boolean,      // true jika user konfirmasi melebihi budget (mode guide)
  notes: String,
  canceledAt: Date,
  pickedUpAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `code` unique, `userId + createdAt`, `pickup.date + pickup.slotStart`, `status`, `(userId, idempotencyKey)` unique.

---

### 1.7 `stravaactivities`

```js
{
  _id: ObjectId,
  userId: ObjectId,
  activityId: Number,           // Strava activity id
  name: String,
  type: String,                 // Run, Ride, Walk, Hike, ...
  movingTimeSec: Number,
  distanceMeters: Number,
  startDate: Date,
  manual: Boolean,
  createdAt: Date
}
```

**Index unik:** `(userId, activityId)`.
**Index:** `userId + startDate`.

---

### 1.8 `manualactivities`

```js
{
  _id: ObjectId,
  userId: ObjectId,
  date: String,                 // 'YYYY-MM-DD' (Jakarta, current week only)
  startDate: Date,              // date at 12:00 Jakarta
  type: String,                 // Run, Ride, Walk, Hike, Workout, Other
  minutes: Number,              // 1-600
  note: String,                 // max 300
  screenshot: {
    publicId: String,           // Cloudinary public id (hidden from API)
    secureUrl: String,
    deleteAfter: Date,          // now + 7 days
    uploadedAt: Date,
    mock: Boolean               // dev only
  },
  createdAt: Date
}
```

**Index:** `userId + startDate`, `userId + date`, `screenshot.deleteAfter`.
**Bonus:** total menit manual + Strava → tier yang sama (maks 45 g/minggu).
**Auto-delete:** screenshot dihapus dari Cloudinary setelah `deleteAfter`; record aktivitas tetap ada.

---

### 1.9 `pickupslots`

```js
{
  _id: ObjectId,
  locationId: ObjectId,         // ref locations
  date: String,                 // 'YYYY-MM-DD'
  startTime: String,            // 'HH:mm'
  endTime: String,              // 'HH:mm'
  capacity: Number,             // default 8
  booked: Number,               // default 0
  active: Boolean
}
```

**Index unik:** `(locationId, date, startTime)`.

---

### 1.10 `auditlogs` (opsional, disarankan)

```js
{
  _id: ObjectId,
  actorId: ObjectId,            // staff/admin
  action: String,               // order.status_changed, stock.updated, product.created
  entity: String,               // Order, Product, DailyStock
  entityId: ObjectId,
  before: Object,
  after: Object,
  createdAt: Date
}
```

---

## 2. Transaksi Kritis

### 2.1 Membuat Order

```text
BEGIN TRANSACTION
1. user = User.findOne({ firebaseUid: req.user.uid })
2. period = getOrCreateBudgetPeriod(user, currentWeek)
3. products = Product.find({ _id: { $in: ids }, active: true })
4. Hitung subtotal & totalSugar dari DB (bukan dari client)
5. remaining = period.baseBudgetGrams + period.bonusGrams - period.consumedGrams
6. if totalSugar > remaining:
   a. user.budgetMode === 'strict' -> 409 BUDGET_EXCEEDED
   b. user.budgetMode === 'guide' && !body.budgetOverride -> 409 BUDGET_CONFIRM_REQUIRED
   c. user.budgetMode === 'guide' && body.budgetOverride -> lanjut, catat overage di order
7. Untuk setiap item:
   a. DailyStock.findOneAndUpdate(
        { productId: item.productId, locationId, date, $expr: { $lt: [{ $add: ['$reserved','$sold'] }, '$total'] } },
        { $inc: { reserved: item.qty } },
        { new: true }
      )
      Jika null -> 409 OUT_OF_STOCK
8. PickupSlot.findOneAndUpdate(
     { locationId, date, startTime, $expr: { $lt: ['$booked', '$capacity'] } },
     { $inc: { booked: 1 } },
     { new: true }
   )
   Jika null -> 409 SLOT_FULL
9. Buat Order (code unik, idempotencyKey)
10. period.consumedGrams += totalSugar; period.orderCount += 1
COMMIT
```

**Idempotency:** sebelum transaksi, cek `Order.findOne({ userId, idempotencyKey })`. Jika ada, kembalikan order tersebut.

### 2.2 Membatalkan Order

- Hanya boleh saat `pending_payment` (user) atau oleh staff.
- Transaksi:
  - `order.status = canceled`, `canceledAt`
  - `period.consumedGrams -= order.totalSugarGrams`
  - `period.orderCount -= 1`
  - `DailyStock.reserved -= qty` per item
  - `PickupSlot.booked -= 1`
- Idempoten: jika sudah canceled, return 200.

### 2.3 Mengubah Status (Staff)

Transisi valid:

```text
pending_payment -> paid | canceled | expired
paid            -> preparing | canceled
preparing       -> ready
ready           -> picked_up | expired
picked_up       -> (final)
canceled        -> (final)
expired         -> (final)
```

- Saat `picked_up`: `DailyStock.reserved -= qty`, `DailyStock.sold += qty`.
- Saat `canceled`: refund budget & stock reserved & slot.
- Semua perubahan dicatat di `auditlogs`.

### 2.4 Sinkronisasi Strava

```text
1. Pastikan token valid; refresh jika expired.
2. GET /athlete/activities?after=<weekStartEpoch>&per_page=100
3. Filter: manual === false, type bukan EBikeRide.
4. Upsert ke stravaactivities berdasarkan (userId, activityId).
5. totalMinutes = sum(movingTimeSec) / 60 untuk minggu berjalan.
6. bonus = totalMinutes >= 150 ? 45
           : totalMinutes >= 90  ? 30
           : totalMinutes >= 60  ? 20
           : totalMinutes >= 30  ? 10
           : 0
7. period.bonusGrams = bonus (idempoten)
```

- Rate limit sync: maksimal 1x/5 menit per user.
- Simpan `lastSyncAt`.
- Jika Strava disconnect: hapus token, pertahankan aktivitas historis (opsional).

### 2.5 Reset Mingguan

- `getOrCreateBudgetPeriod(user, week)` membuat period baru jika belum ada.
- Tidak perlu cron untuk MVP; dibuat on-demand saat request pertama minggu baru.
- Cron opsional: tutup period lama (`status: closed`).

---

## 3. API Endpoints

> Implementasi aktual memakai prefix **`/api/v1`**. Tabel di bawah menulis path relatif tanpa prefix; contoh `/api/orders` berarti **`/api/v1/orders`**. Route legacy tetap di `/api/...`.

### System

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/health` | Public | Status API + koneksi database |
| GET | `/ready` | Public | Readiness + ping MongoDB (`200`/`503`) |

### Auth & Profile

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/session` | Firebase token | Verifikasi token, upsert user, return profile |
| GET | `/api/me` | Member | Profile + budget periode berjalan + status Strava |
| GET | `/api/me/recap?weeks=4` | Member | Rekap mingguan: budget, order, aktivitas, top produk |
| PATCH | `/api/me` | Member | Update nama / preset budget |
| DELETE | `/api/me/strava` | Member | Disconnect Strava |

### Katalog

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/products` | Public | Filter: `maxSugar`, `tag`, `category` |
| GET | `/api/products/:slug` | Public | Detail produk |
| GET | `/api/menu/today` | Public | Produk aktif + stok tersedia hari ini |
| GET | `/api/locations` | Public | Daftar outlet aktif (MVP: satu) |
| GET | `/api/pickup-slots?locationId=&date=YYYY-MM-DD` | Public | Slot + sisa kapasitas |

### Order

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/orders` | Member | Buat order (idempotency key) |
| GET | `/api/orders?status=&page=&limit=` | Member | Riwayat order sendiri + filter/pagination |
| GET | `/api/orders/:code` | Owner/Staff | Detail order |
| POST | `/api/orders/:id/cancel` | Owner | Batalkan order pending |

### Activities (manual)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/activities/manual` | Member | Aktivitas manual minggu ini + status Cloudinary |
| POST | `/api/activities/manual` | Member | Multipart: `date`, `type`, `minutes`, `note`, `screenshot` |
| DELETE | `/api/activities/manual/:id` | Owner | Hapus aktivitas + screenshot Cloudinary |
| POST | `/api/admin/activities/cleanup` | Staff/Admin | Bersihkan screenshot kedaluwarsa |
| GET | `/api/internal/cleanup-cloudinary` | `CRON_SECRET` | Cron cleanup Vercel |

### Strava

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/strava/connect` | Member | Return URL OAuth |
| GET | `/api/strava/callback` | Public (state) | Tukar code → token |
| POST | `/api/strava/sync` | Member | Sync aktivitas minggu berjalan |
| GET | `/api/strava/status` | Member | Status koneksi + menit + bonus |
| POST/DELETE | `/api/strava/demo` | Member (dev) | Simulasi 45 menit / reset |
| DELETE | `/api/strava/disconnect` | Member | Putuskan Strava |

### Staff / Admin

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/orders` | Staff/Admin | Filter status & tanggal |
| PATCH | `/api/admin/orders/:id/status` | Staff/Admin | Ubah status |
| GET | `/api/admin/stock?date=` | Staff/Admin | Stok harian |
| PATCH | `/api/admin/stock/:productId` | Staff/Admin | Set stok |
| GET | `/api/admin/ping` | Staff/Admin | Cek akses role |
| POST | `/api/admin/products` | Admin | Buat produk |
| PATCH | `/api/admin/products/:id` | Admin | Update produk |
| GET | `/api/admin/metrics` | Admin | Metrik ringkas |

---

## 4. Validasi

- `price`: integer, ≥1000.
- `sugarGrams`: 0–100.
- `qty`: 1–10 per item; maksimal 10 item per order.
- `budgetOverride`: boolean; hanya berlaku untuk mode `guide`.
- `pickup.date`: hari ini s/d +7 hari.
- `pickup.slotStart`: harus ada di `pickupslots` dan aktif.
- `idempotencyKey`: UUID v4.
- `tags` dan `allergens`: enum/whitelist.
- `name`: 1–80 karakter; `description`: ≤500.
- Semua input divalidasi dengan Zod/Joi sebelum menyentuh DB.

---

## 5. Keamanan

- `Authorization: Bearer <Firebase ID Token>`.
- Middleware `requireAuth` → `verifyIdToken` → set `req.user = { uid, email }`.
- Middleware `requireRole('staff'|'admin')`.
- Email **tidak pernah** diambil dari body/query untuk identitas.
- Rate limit:
  - auth: 20/menit/IP
  - orders: 10/menit/user
  - strava sync: 5/5 menit/user
- Helmet + CORS allowlist.
- Enkripsi token Strava dengan AES-256-GCM (`TOKEN_ENCRYPTION_KEY`).
- Jangan pernah mengembalikan token Strava ke client.
- Audit log untuk perubahan status/stok.
- Validasi kepemilikan order (`order.userId === req.user._id`).

---

## 6. Migrasi dari Aplikasi Sekarang

| Sekarang | Menjadi |
|---|---|
| `User.chances` + `chancesResetAt` | `weeklyBudgetGrams` + `budgetperiods` |
| `Purchase` + `buyHistory` | `orders` |
| `/api/purchase/generate-code` | `POST /api/orders` |
| `/api/purchase/redeem-purchase` | `PATCH /api/admin/orders/:id/status` (staff) |
| Halaman `/chance` | Halaman `/balance` (redirect) |
| `Product` tanpa stok harian | `products` + `dailystocks` |
| Seed 6 produk lama | Seed 10 produk (termasuk tinggi gula) + stok harian |

**Catatan:** data demo lama tidak perlu dimigrasikan; lakukan reseed.

---

## 7. Struktur Folder Backend yang Disarankan

```text
server/
  index.js
  config/
    env.js
    db.js
  middleware/
    auth.js
    role.js
    rateLimit.js
    validate.js
  models/
    User.js
    Product.js
    Location.js
    DailyStock.js
    BudgetPeriod.js
    Order.js
    StravaActivity.js
    PickupSlot.js
    AuditLog.js
  services/
    budgetService.js
    orderService.js
    stravaService.js
    stockService.js
  routes/
    auth.js
    me.js
    products.js
    orders.js
    strava.js
    admin.js
  jobs/
    closeBudgetPeriods.js
  seed.js
```

---

## 8. Struktur Folder Frontend yang Disarankan

```text
client/src/
  lib/api.js               // axios instance + auth interceptor
  features/
    auth/
    menu/
    order/
    balance/
    strava/
    admin/
  pages/
    Landing.jsx
    Menu.jsx
    ProductDetail.jsx
    Checkout.jsx
    OrderSuccess.jsx
    Balance.jsx
    StaffDashboard.jsx
  components/
  styles/
```

---

## 9. Seed Data Awal (10 Produk)

| Produk | Gula | Harga | Tags |
|---|---:|---:|---|
| Roti Susu Pandan | 8 g | Rp 18.000 | low-sugar |
| Banana Bread Low-Sugar | 10 g | Rp 25.000 | low-sugar |
| Croissant Almond | 12 g | Rp 28.000 | — |
| Dark Chocolate Cookie | 14 g | Rp 22.000 | — |
| Pandan Chiffon Slice | 16 g | Rp 26.000 | — |
| Gluten-Free Brownie | 16 g | Rp 30.000 | gluten-free |
| Glazed Donut | 18 g | Rp 20.000 | — |
| Cinnamon Roll | 22 g | Rp 32.000 | indulgent |
| Classic Banana Pudding | 28 g | Rp 36.000 | indulgent |
| Chocolate Fudge Cake | 35 g | Rp 42.000 | indulgent |

Semua produk dijual; label gula hanya transparansi. Stok harian awal: 12–20 per produk.

---

## 10. Acceptance Criteria Global

- [ ] Tidak ada endpoint yang menerima `email` sebagai identitas.
- [ ] Harga, gula, stok, dan budget dihitung server.
- [ ] Order creation atomik + idempotent.
- [ ] Mode `guide`: overage boleh, tercatat, dan butuh konfirmasi.
- [ ] Mode `strict`: order melebihi budget ditolak server.
- [ ] Redeem/pickup hanya oleh staff.
- [ ] Strava OAuth + dedup aktivitas berfungsi.
- [ ] Budget tidak pernah negatif.
- [ ] Stok tidak pernah negatif.
- [ ] `locationId` dipakai konsisten di order, stok, dan slot (siap multi-outlet).
- [ ] Pembayaran hanya pay at pickup; tidak ada payment gateway.
- [ ] Semua endpoint admin dilindungi role.
- [ ] Tidak ada token/secret di response/log.
- [ ] Test API & E2E hijau.
