# Dev Access — Link Publik, Tunnel & Production Stack

Dokumen ini mencatat cara mengakses aplikasi dari HP di jaringan berbeda, serta cara membuat ulang tunnel dan stack production lokal.

---

## Link Publik Saat Ini

### 0. Cloudflare Pages — frontend production

**https://bakerman.ridwanafazn.my.id**

- Static frontend benar-benar hosted di Cloudflare Pages.
- Pages default: **https://bakerman-balance.pages.dev**
- API memanggil Cloudflare Tunnel ke Docker lokal.
- Login/API sudah diuji dari domain ini: budget 66 g, recap, menu 10 produk, 0 console error.

### 1. Production-like Docker stack

**https://merchants-publishing-release-retained.trycloudflare.com**

- Diarahkan ke nginx container `http://localhost:8080`.
- API + Mongo di network Docker privat.
- Data demo sama: member **66 g**, **4 order**.
- Strava demo **mati** (production behavior); Swagger **404**.
- Aktivitas manual **disabled** sampai kredensial Cloudinary diisi.
- Cocok untuk mengecek hasil Fase 6–7 (nginx, security headers, readiness, logging).

### 2. Dev preview (fitur + Strava simulasi)

**https://speed-podcasts-movements-moms.trycloudflare.com**

- Diarahkan ke `vite preview` di `http://127.0.0.1:4173`.
- Strava demo aktif.
- Aktivitas manual aktif dengan **mock Cloudinary** (badge “Mode simulasi bukti (dev)”).
- Cocok untuk mencoba fitur yang butuh simulasi Strava/manual.

> Keduanya Cloudflare Quick Tunnel sementara. Laptop harus tetap menyala/online.

**Link lokal:**

- Production stack: <http://localhost:8080>
- App dev: <http://localhost:5173>
- Preview dev: <http://localhost:4173>
- API dev: <http://localhost:5050>
- Swagger dev: <http://localhost:5050/api-docs>

---

## Kenapa Sebelumnya Blank di HP?

Gejala: tab title + favicon muncul, tetapi halaman putih.

Penyebab paling mungkin:

- Dev server Vite memuat **ratusan modul** satu per satu + HMR WebSocket. Di jaringan mobile, ini bisa lambat/timeout atau ter-cache setengah jalan.
- Perubahan konfigurasi/file saat tunnel aktif bisa membuat modul lama tidak tersedia.

Perbaikan:

- Sajikan **production build** lewat `vite preview` atau nginx.
- Gunakan tunnel ke port preview/nginx, bukan dev server.
- Jika masih blank: hard refresh / incognito / pastikan JavaScript aktif.

---

## Cara Menyalakan Ulang — Dev

### 1. Database & backend

```bash
docker compose up -d mongo
cd server && npm run dev
```

### 2. Build & preview frontend

```bash
cd client
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

### 3. Tunnel dev

```bash
cloudflared tunnel --url http://localhost:4173
```

Cloudflared akan mencetak URL `https://xxxx.trycloudflare.com`. Update URL di dokumen ini dan guide terkait.

---

## Cara Menyalakan Ulang — Production Stack

```powershell
# Key wajib (64 hex). Simpan, jangan commit.
$env:TOKEN_ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Build & start (client nginx + API + Mongo)
docker compose -f docker-compose.prod.yml up -d --build

# Seed pertama kali (destruktif; hanya demo)
docker compose -f docker-compose.prod.yml run --rm -e SEED_FORCE=true api npm run seed

# Tunnel production
cloudflared tunnel --url http://localhost:8080
```

Cek:

```powershell
curl http://localhost:8080/ready
# {"status":"ready","database":"connected"}
```

Stop:

```powershell
docker compose -f docker-compose.prod.yml down
```

> Jangan jalankan `down -v` kecuali ingin menghapus volume Mongo production stack.

---

## Cek Cepat Fase 6

1. Buka production tunnel di HP → login member.
2. Budget **66 g**, recap 24 g terpakai, 4 order.
3. `/orders` filter Semua/Aktif/Selesai/Dibatalkan.
4. `/checkout` slot pickup muncul.
5. Admin `/staff` → antrean + tabel stok.
6. Buka `/ready` → `{"status":"ready"}`.
7. Buka `/api-docs/` → **404**.
8. DevTools → Response Headers → cek `X-Content-Type-Options`, `X-Frame-Options`, dll.
9. Strava production: “Strava belum tersedia di lingkungan ini.” (expected).
10. Dev preview: tombol simulasi Strava masih aktif.

E2E:

```bash
cd client

# Production lokal
E2E_BASE_URL=http://localhost:8080 npm run e2e

# Production tunnel
E2E_BASE_URL=https://merchants-publishing-release-retained.trycloudflare.com npm run e2e

# Dev preview
E2E_BASE_URL=https://speed-podcasts-movements-moms.trycloudflare.com npm run e2e
```

> Pagination hanya terlihat jika order > 8. Saat ini member punya 4 order.

---

## Cek Cepat Fase 7 — Aktivitas Manual

### Dev preview (mock Cloudinary)
1. Login member → `/balance`.
2. Scroll ke **“Catat aktivitas manual”**.
3. Pastikan badge **“Mode simulasi bukti (dev)”** muncul.
4. Isi 45 menit, pilih screenshot, klik **Kirim aktivitas**.
5. Budget naik **66 g → 76 g**; daftar menampilkan **45 menit · +10 g**.
6. Klik **Hapus** → budget kembali **66 g**.

### Production stack
- Tanpa kredensial Cloudinary: form **disabled** + pesan setup.
- Setelah `CLOUDINARY_*` diisi dan `CLOUDINARY_MOCK=false`, form aktif.
- Panduan lengkap: `docs/GUIDE-PHASE-7.md`.

### E2E manual
```bash
cd client
E2E_BASE_URL=http://localhost:4173 npm run e2e
# PASS aktivitas manual + screenshot — 66 g → 76 g → 66 g
```

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

Login di domain tunnel menggunakan **email/password**. Google sign-in mungkin memerlukan penambahan domain ke Firebase Authentication → Authorized domains.

---

## Checklist Jika Link Bermasalah

1. Pastikan laptop menyala dan tidak sleep.
2. Pastikan backend dev hidup: `curl http://localhost:5050/health` → `database: connected`.
3. Pastikan preview dev hidup: `curl http://localhost:4173/` → 200.
4. Pastikan production stack hidup: `curl http://localhost:8080/ready` → `{"status":"ready"}`.
5. Pastikan cloudflared hidup (cek proses `cloudflared.exe`; bisa ada dua proses untuk 4173 dan 8080).
6. Coba hard refresh / incognito di HP.
7. Jika URL sudah mati, buat tunnel baru dan update dokumen ini.

---

## Troubleshooting Mongo Dev

Jika muncul:

```text
MongoServerError: node is not in primary or recovering state
```

Perbaiki replica set hostname (data tetap aman):

```powershell
$hostname = docker inspect bakerman-mongo --format '{{.Config.Hostname}}'
docker exec bakerman-mongo mongosh --quiet --eval "const cfg=rs.conf(); cfg.members[0].host='$($hostname):27017'; rs.reconfig(cfg,{force:true})"
```

Tunggu sampai primary:

```powershell
docker exec bakerman-mongo mongosh --quiet --eval "db.hello().isWritablePrimary"
```
