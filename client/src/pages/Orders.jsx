import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase4.css';
import '../styles/phase5.css';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';
import { formatRupiah } from '../utils/products';

const PAGE_SIZE = 8;

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
  { key: 'canceled', label: 'Dibatalkan' },
];

const STATUS_LABELS = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  preparing: 'Disiapkan',
  ready: 'Siap diambil',
  picked_up: 'Sudah diambil',
  canceled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export default function Orders() {
  const { profile, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    if (!profile) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus('loading');
    setError('');

    try {
      const { data } = await api.get('/v1/orders', {
        params: { status: filter, page, limit: PAGE_SIZE },
      });

      // Abaikan respons lama jika filter/halaman sudah berubah.
      if (requestId !== requestIdRef.current) return;

      setOrders(data.orders || []);
      setPagination(data.pagination || null);
      setStatus('ready');
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;

      setError(requestError.friendlyMessage || 'Gagal memuat pesanan.');
      setStatus('error');
    }
  }, [profile, filter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilter = (nextFilter) => {
    setStatus('loading');
    setPagination(null);
    setFilter(nextFilter);
    setPage(1);
  };

  const handlePage = (nextPage) => {
    setStatus('loading');
    setPage(nextPage);
  };

  if (sessionStatus === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat sesi…</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="catalog-page">
        <div className="catalog-state">
          <h1>Masuk untuk melihat pesanan</h1>
          <p>Riwayat order pickup tersimpan di akunmu.</p>
          <Link className="catalog-cta" to="/signin">
            Masuk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="catalog-eyebrow">Pesanan saya</p>
        <h1 className="catalog-title">Riwayat pickup</h1>
        <p className="catalog-subtitle">{profile.email}</p>
      </header>

      <div className="orders-toolbar" aria-busy={status === 'loading'}>
        <div className="orders-filters" role="group" aria-label="Filter pesanan">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`orders-filter${filter === item.key ? ' is-active' : ''}`}
              onClick={() => handleFilter(item.key)}
              aria-pressed={filter === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>

        {pagination && (
          <p className="orders-count" role="status" aria-live="polite">
            {pagination.total} order
          </p>
        )}
      </div>

      {status === 'loading' && (
        <div className="catalog-state" role="status">
          Memuat pesanan…
        </div>
      )}

      {status === 'error' && (
        <div className="catalog-state catalog-state-error" role="alert">
          <h2>Gagal memuat pesanan</h2>
          <p>{error}</p>
          <button type="button" className="catalog-cta" onClick={loadOrders}>
            Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && orders.length === 0 && (
        <div className="catalog-state">
          <h2>{filter === 'all' ? 'Belum ada pesanan' : 'Tidak ada pesanan'}</h2>
          <p>
            {filter === 'all'
              ? 'Order pickup pertamamu akan muncul di sini.'
              : 'Coba filter lain atau lihat semua pesanan.'}
          </p>
          {filter === 'all' ? (
            <Link className="catalog-cta" to="/menu">
              Lihat menu
            </Link>
          ) : (
            <button
              type="button"
              className="catalog-cta"
              onClick={() => handleFilter('all')}
            >
              Lihat semua
            </button>
          )}
        </div>
      )}

      {status === 'ready' && orders.length > 0 && (
        <>
          <section className="orders-grid" aria-label="Daftar pesanan">
            {orders.map((order) => (
              <Link
                to={`/order/${order.code}`}
                className="order-card-link"
                key={order.id}
              >
                <article className="order-card">
                  <div className="order-card-head">
                    <strong>{order.code}</strong>
                    <span className={`order-status order-status-${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="order-card-meta">
                    {formatDate(order.pickup.date)} · {order.pickup.slotStart}–
                    {order.pickup.slotEnd}
                  </p>
                  <p className="order-card-meta">
                    {order.items.length} item · {order.totalSugarGrams} g gula
                  </p>
                  <p className="order-card-total">{formatRupiah(order.subtotal)}</p>
                </article>
              </Link>
            ))}
          </section>

          {pagination && pagination.totalPages > 1 && (
            <nav className="orders-pagination" aria-label="Navigasi halaman pesanan">
              <button
                type="button"
                className="orders-page-button"
                onClick={() => handlePage(Math.max(1, pagination.page - 1))}
                disabled={!pagination.hasPrev}
              >
                ← Sebelumnya
              </button>
              <span>
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <button
                type="button"
                className="orders-page-button"
                onClick={() =>
                  handlePage(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                disabled={!pagination.hasNext}
              >
                Berikutnya →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
