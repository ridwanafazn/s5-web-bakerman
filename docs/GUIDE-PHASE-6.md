# Guide — Merasakan Hasil Fase 6

Fase 6 menyiapkan **production packaging**: Docker image API + client, nginx, validasi env production, readiness, logging, dan smoke test end-to-end.

> Untuk alternatif Strava (aktivitas manual + screenshot Cloudinary), lihat **`docs/GUIDE-PHASE-7.md`**.

---

## 🌐 Dua Link untuk Dicek

### 1. Production-like Docker stack

**https://assistant-source-adjustments-exotic.trycloudflare.com**

- Diarahkan ke nginx container `http://localhost:8080`.
- API dan Mongo berjalan di network Docker privat.
- Data demo sama: member **66 g**, **4 order**.
- **Strava demo dimatikan** (production behavior). Kartu Strava hanya menampilkan “Strava belum tersedia di lingkungan ini.”
- Swagger **404** (sengaja tertutup).

### 2. Dev preview (fitur + Strava simulasi)

**https://opponents-bras-prayers-gas.trycloudflare.com**

- Diarahkan ke `vite preview` port 4173.
- Strava demo aktif.
- Cocok untuk mencoba fitur yang butuh simulasi Strava.

> Keduanya Cloudflare Quick Tunnel sementara. Laptop harus tetap menyala/online.

### Lokal

| Layanan | URL |
|---|---|
| Production stack | http://localhost:8080 |
| Dev preview | http://localhost:4173 |
| Dev server | http://localhost:5173 |
| API dev | http://localhost:5050 |
| Swagger dev | http://localhost:5050/api-docs |

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

---

## 1. Cek Production Stack di HP

1. Buka **https://assistant-source-adjustments-exotic.trycloudflare.com**.
2. Login member.
3. Buka **/balance**:
   - Budget **66 g**.
   - Rekap 4 minggu (24 g terpakai).
   - Kartu Strava: **“Strava belum tersedia di lingkungan ini.”**, tanpa tombol simulasi — ini benar untuk production.
4. Buka **/orders**:
   - 4 order.
   - Filter Semua/Aktif/Selesai/Dibatalkan.
5. Buka **/menu** → pilih produk → **/cart** → **/checkout**.
   - Cek slot pickup muncul.
   - Jangan perlu membuat order jika hanya ingin melihat.
6. Login admin → **/staff**:
   - Antrean order + tabel stok.
   - Jangan ubah status jika tidak perlu.

---

## 2. Cek Production Endpoint

Buka di browser:

```text
https://assistant-source-adjustments-exotic.trycloudflare.com/ready
```

Harus muncul:

```json
{"status":"ready","database":"connected"}
```

Cek Swagger tertutup:

```text
https://assistant-source-adjustments-exotic.trycloudflare.com/api-docs/
```

Harus **404**.

Cek security headers (DevTools → Network → Response Headers):

```text
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 3. Cek Log Production

```powershell
$env:TOKEN_ENCRYPTION_KEY = "..."   # key yang dipakai saat start
docker compose -f docker-compose.prod.yml logs -f api
```

Contoh log:

```json
{"level":"info","msg":"request","method":"GET","path":"/api/v1/me/recap?weeks=4","status":200,"durationMs":14,"ip":"172.20.0.1"}
```

---

## 4. Jalankan Ulang Stack Production

### Pertama kali / setelah ubah kode

```powershell
# Generate key (simpan; jangan commit)
$env:TOKEN_ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Build & start
docker compose -f docker-compose.prod.yml up -d --build

# Seed hanya untuk demo pertama kali (destruktif)
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed

# Cek
curl http://localhost:8080/ready
```

### Stop

```powershell
docker compose -f docker-compose.prod.yml down
```

### Hapus data production stack (hati-hati)

```powershell
docker compose -f docker-compose.prod.yml down -v
```

> `down -v` menghapus volume Mongo production stack. Data dev tidak terpengaruh karena volume terpisah.

---

## 5. Jalankan E2E

```bash
cd client

# Production stack lokal
E2E_BASE_URL=http://localhost:8080 npm run e2e

# Production tunnel
E2E_BASE_URL=https://assistant-source-adjustments-exotic.trycloudflare.com npm run e2e

# Dev preview
E2E_BASE_URL=https://opponents-bras-prayers-gas.trycloudflare.com npm run e2e
```

Yang diuji: landing mobile, menu, login, recap, filter order, pagination, checkout, staff dashboard, 0 console error.

---

## 6. Cek CI

Workflow `.github/workflows/ci.yml` sekarang:

1. Server tests (34 tes).
2. Client lint + build.
3. Build Docker image API.
4. Build Docker image client.

Aktif otomatis saat push/PR ke GitHub.

---

## 7. Troubleshooting

### Mongo dev “node is not in primary or recovering state”

Terjadi jika container Mongo dev dibuat ulang sehingga hostname replica set berubah. Dev compose sekarang memakai `hostname: bakerman-mongo` agar stabil. Jika tetap terjadi:

```powershell
$hostname = docker inspect bakerman-mongo --format '{{.Config.Hostname}}'
docker exec bakerman-mongo mongosh --quiet --eval "const cfg=rs.conf(); cfg.members[0].host='$($hostname):27017'; rs.reconfig(cfg,{force:true})"
```

Tunggu sampai primary:

```powershell
docker exec bakerman-mongo mongosh --quiet --eval "db.hello().isWritablePrimary"
```

### `TOKEN_ENCRYPTION_KEY` required

Semua command Compose production membutuhkan key:

```powershell
$env:TOKEN_ENCRYPTION_KEY = "...64 hex..."
```

### Port 8080 bentrok

Ganti mapping di `docker-compose.prod.yml`:

```yaml
ports:
  - "8081:80"
```

### Dev API disconnected setelah main dengan prod stack

Tunggu beberapa detik; Mongoose akan reconnect. Jika tidak, restart dev API:

```powershell
cd server
npm run dev
```

---

## Checklist Cepat

- [ ] Production tunnel terbuka di HP.
- [ ] Login member → budget 66 g.
- [ ] Recap 4 minggu tampil.
- [ ] `/orders` 4 order + filter.
- [ ] `/checkout` slot muncul.
- [ ] Admin `/staff` tampil.
- [ ] `/ready` → `{"status":"ready"}`.
- [ ] `/api-docs/` → 404.
- [ ] Security headers ada.
- [ ] Strava production: “Strava belum tersedia di lingkungan ini.” (expected).
- [ ] Dev preview Strava demo masih bisa dipakai.
- [ ] `npm run e2e` → 9 langkah, 0 console error (Fase 7 menambahkan langkah aktivitas manual).

---

## Yang Belum Ada

- Deploy cloud aktual (Atlas Cloud + Vercel + Firebase production).
- Strava asli (Client ID/Secret).
- TLS internal nginx → API.
- Backup otomatis, metrics, tracing, alerting.
- Payment gateway.
