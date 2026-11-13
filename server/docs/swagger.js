const bearer = [{ bearerAuth: [] }];

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Bakerman Balance API',
    version: '1.0.0',
    description:
      'API Bakerman Balance: auth Firebase, katalog, budget gula, order pickup, dan Strava. ' +
      'Endpoint lama dipertahankan sementara sampai UI dimigrasikan.',
  },
  servers: [{ url: 'http://localhost:5050' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Catalog' },
    { name: 'Strava' },
    { name: 'Orders' },
    { name: 'Activities' },
    { name: 'Admin' },
    { name: 'Legacy' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check + status database',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/ready': {
      get: {
        tags: ['System'],
        summary: 'Readiness + ping MongoDB',
        responses: {
          200: { description: 'Ready' },
          503: { description: 'Database belum siap' },
        },
      },
    },
    '/api/v1/auth/session': {
      post: {
        tags: ['Auth'],
        summary: 'Verifikasi token Firebase dan sinkronkan user',
        security: bearer,
        responses: {
          200: { description: 'User + budget periode berjalan' },
          401: { description: 'Token tidak valid' },
        },
      },
    },
    '/api/v1/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil user + budget periode berjalan',
        security: bearer,
        responses: { 200: { description: 'Profil + budget' } },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update nama, preset budget, atau mode budget',
        security: bearer,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  budgetPreset: {
                    type: 'string',
                    enum: ['santai', 'seimbang', 'ketat'],
                  },
                  budgetMode: { type: 'string', enum: ['guide', 'strict'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profil + budget terbaru' } },
      },
    },
    '/api/v1/me/recap': {
      get: {
        tags: ['Auth'],
        summary: 'Rekap mingguan budget, order, dan aktivitas',
        security: bearer,
        parameters: [
          {
            name: 'weeks',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 8, default: 4 },
          },
        ],
        responses: { 200: { description: 'Rekap mingguan' } },
      },
    },
    '/api/v1/products': {
      get: {
        tags: ['Catalog'],
        summary: 'Daftar produk aktif',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'maxSugar', in: 'query', schema: { type: 'number' } },
          {
            name: 'sugarLevel',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['light', 'balanced', 'indulgent', 'extra'],
            },
          },
        ],
        responses: { 200: { description: 'Daftar produk' } },
      },
    },
    '/api/v1/products/{slug}': {
      get: {
        tags: ['Catalog'],
        summary: 'Detail produk berdasarkan slug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Detail produk' } },
      },
    },
    '/api/v1/locations': {
      get: {
        tags: ['Catalog'],
        summary: 'Daftar outlet aktif',
        responses: { 200: { description: 'Daftar outlet' } },
      },
    },
    '/api/v1/menu/today': {
      get: {
        tags: ['Catalog'],
        summary: 'Menu + stok hari ini',
        parameters: [
          { name: 'locationId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Menu hari ini' } },
      },
    },
    '/api/v1/pickup-slots': {
      get: {
        tags: ['Catalog'],
        summary: 'Slot pickup untuk tanggal tertentu',
        parameters: [
          { name: 'locationId', in: 'query', schema: { type: 'string' } },
          {
            name: 'date',
            in: 'query',
            required: true,
            schema: { type: 'string', example: '2026-11-13' },
          },
        ],
        responses: { 200: { description: 'Daftar slot' } },
      },
    },
    '/api/v1/admin/ping': {
      get: {
        tags: ['Admin'],
        summary: 'Cek akses staff/admin',
        security: bearer,
        responses: {
          200: { description: 'Akses diberikan' },
          403: { description: 'Role tidak diizinkan' },
        },
      },
    },
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Riwayat order user (filter + pagination)',
        security: bearer,
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'all',
                'active',
                'completed',
                'canceled',
                'pending_payment',
                'paid',
                'preparing',
                'ready',
                'picked_up',
                'expired',
              ],
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10, maximum: 20 },
          },
        ],
        responses: {
          200: { description: 'Daftar order + metadata pagination' },
          400: { description: 'Filter status tidak valid' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Buat order pickup',
        security: bearer,
        responses: {
          201: { description: 'Order dibuat' },
          409: { description: 'Budget/stok/slot tidak cukup' },
        },
      },
    },
    '/api/v1/orders/{code}': {
      get: {
        tags: ['Orders'],
        summary: 'Detail order berdasarkan kode',
        security: bearer,
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Detail order' } },
      },
    },
    '/api/v1/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Batalkan order pending payment',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Order dibatalkan' } },
      },
    },
    '/api/v1/activities/manual': {
      get: {
        tags: ['Activities'],
        summary: 'Aktivitas manual minggu ini + status Cloudinary',
        security: bearer,
        responses: { 200: { description: 'Daftar aktivitas manual' } },
      },
      post: {
        tags: ['Activities'],
        summary: 'Catat aktivitas manual + screenshot bukti',
        security: bearer,
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['date', 'type', 'minutes', 'screenshot'],
                properties: {
                  date: { type: 'string', example: '2026-11-14' },
                  type: {
                    type: 'string',
                    enum: ['Run', 'Ride', 'Walk', 'Hike', 'Workout', 'Other'],
                  },
                  minutes: { type: 'integer', minimum: 1, maximum: 600 },
                  note: { type: 'string', maxLength: 300 },
                  screenshot: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Aktivitas dibuat + bonus diperbarui' },
          503: { description: 'Cloudinary belum dikonfigurasi' },
        },
      },
    },
    '/api/v1/activities/manual/{id}': {
      delete: {
        tags: ['Activities'],
        summary: 'Hapus aktivitas manual + screenshot',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Aktivitas dihapus' } },
      },
    },
    '/api/v1/admin/activities/cleanup': {
      post: {
        tags: ['Admin'],
        summary: 'Bersihkan screenshot aktivitas manual yang kedaluwarsa',
        security: bearer,
        responses: { 200: { description: 'Hasil cleanup' } },
      },
    },
    '/api/v1/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'Daftar order untuk staff/admin',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar order' } },
      },
    },
    '/api/v1/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Ubah status order',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Status diperbarui' } },
      },
    },
    '/api/v1/admin/stock': {
      get: {
        tags: ['Admin'],
        summary: 'Stok harian per produk',
        security: bearer,
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' } },
          { name: 'locationId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Stok harian' } },
      },
    },
    '/api/v1/admin/stock/{productId}': {
      patch: {
        tags: ['Admin'],
        summary: 'Set total stok harian',
        security: bearer,
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Stok diperbarui' } },
      },
    },
    '/api/v1/strava/connect': {
      get: {
        tags: ['Strava'],
        summary: 'URL OAuth Strava',
        security: bearer,
        responses: {
          200: { description: 'URL otorisasi' },
          503: { description: 'Strava belum dikonfigurasi' },
        },
      },
    },
    '/api/v1/strava/callback': {
      get: {
        tags: ['Strava'],
        summary: 'Callback OAuth Strava',
        parameters: [
          { name: 'code', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 302: { description: 'Redirect ke frontend' } },
      },
    },
    '/api/v1/strava/status': {
      get: {
        tags: ['Strava'],
        summary: 'Status koneksi + menit aktif + bonus',
        security: bearer,
        responses: { 200: { description: 'Status Strava' } },
      },
    },
    '/api/v1/strava/sync': {
      post: {
        tags: ['Strava'],
        summary: 'Sync aktivitas minggu berjalan',
        security: bearer,
        responses: { 200: { description: 'Status setelah sync' } },
      },
    },
    '/api/v1/strava/demo': {
      post: {
        tags: ['Strava'],
        summary: 'Tambah aktivitas simulasi 45 menit (dev/demo)',
        security: bearer,
        responses: { 200: { description: 'Status setelah simulasi' } },
      },
      delete: {
        tags: ['Strava'],
        summary: 'Hapus semua aktivitas simulasi (dev/demo)',
        security: bearer,
        responses: { 200: { description: 'Status setelah reset' } },
      },
    },
    '/api/v1/strava/disconnect': {
      delete: {
        tags: ['Strava'],
        summary: 'Putuskan koneksi Strava + hapus aktivitas',
        security: bearer,
        responses: { 200: { description: 'Status setelah disconnect' } },
      },
    },
    '/api/products': {
      get: {
        tags: ['Legacy'],
        summary: '[Deprecated] Daftar produk (UI lama)',
        responses: { 200: { description: 'Daftar produk' } },
      },
      post: {
        tags: ['Legacy'],
        summary: '[Deprecated] Tambah produk (belum aman)',
        responses: { 201: { description: 'Produk dibuat' } },
      },
    },
    '/api/user': {
      get: {
        tags: ['Legacy'],
        summary: '[Deprecated] Data user berdasarkan email (UI lama)',
        parameters: [
          {
            name: 'email',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Data user' } },
      },
    },
    '/api/purchase/generate-code': {
      post: {
        tags: ['Legacy'],
        summary: '[Deprecated] Generate kode (UI lama)',
        responses: { 201: { description: 'Kode dibuat' } },
      },
    },
    '/api/purchase/redeem-purchase': {
      post: {
        tags: ['Legacy'],
        summary: '[Deprecated] Redeem kode (UI lama)',
        responses: { 200: { description: 'Kode ditukar' } },
      },
    },
  },
};

module.exports = swaggerDocument;
