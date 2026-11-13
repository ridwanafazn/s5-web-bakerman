import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase4.css';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';

const STATUS_LABELS = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  preparing: 'Disiapkan',
  ready: 'Siap diambil',
  picked_up: 'Sudah diambil',
  canceled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

const NEXT_STATUSES = {
  pending_payment: [
    { status: 'paid', label: 'Konfirmasi bayar' },
    { status: 'canceled', label: 'Batalkan' },
  ],
  paid: [
    { status: 'preparing', label: 'Siapkan' },
    { status: 'canceled', label: 'Batalkan' },
  ],
  preparing: [{ status: 'ready', label: 'Siap diambil' }],
  ready: [
    { status: 'picked_up', label: 'Serahkan' },
    { status: 'expired', label: 'Expired' },
  ],
};

function jakartaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export default function Staff() {
  const { profile, status: sessionStatus } = useSession();
  const isStaff = Boolean(profile && ['staff', 'admin'].includes(profile.role));

  const [date, setDate] = useState(jakartaToday());
  const [locationName, setLocationName] = useState('');
  const [stockLocationId, setStockLocationId] = useState('');
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [stockEdits, setStockEdits] = useState({});
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!isStaff) return;

    setStatus('loading');
    setError('');

    try {
      const [locationsResponse, ordersResponse, stockResponse] =
        await Promise.all([
          api.get('/v1/locations'),
          api.get('/v1/admin/orders', { params: { date } }),
          api.get('/v1/admin/stock', { params: { date } }),
        ]);

      const location = locationsResponse.data.locations?.[0];
      setLocationName(location?.name || '');
      setOrders(ordersResponse.data.orders || []);
      setStock(stockResponse.data.products || []);
      setStockLocationId(stockResponse.data.locationId || location?.id || '');
      setStockEdits(
        Object.fromEntries(
          (stockResponse.data.products || []).map((item) => [
            item.productId,
            item.total,
          ])
        )
      );
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal memuat dashboard.');
      setStatus('error');
    }
  }, [date, isStaff]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (order, nextStatus) => {
    setBusy(order.id);
    setError('');
    setMessage('');

    try {
      await api.patch(`/v1/admin/orders/${order.id}/status`, {
        status: nextStatus,
      });
      setMessage(`Order ${order.code} → ${STATUS_LABELS[nextStatus]}.`);
      await load();
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal mengubah status.');
    } finally {
      setBusy('');
    }
  };

  const handleStock = async (product) => {
    const total = Number(stockEdits[product.productId]);
    setBusy(product.productId);
    setError('');
    setMessage('');

    try {
      await api.patch(`/v1/admin/stock/${product.productId}`, {
        locationId: stockLocationId,
        date,
        total,
      });
      setMessage(`Stok ${product.name} diperbarui.`);
      await load();
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal memperbarui stok.');
    } finally {
      setBusy('');
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat sesi…</div>
      </main>
    );
  }

  if (!isStaff) {
    return (
      <main className="catalog-page">
        <div className="catalog-state catalog-state-error">
          <h1>Akses staff diperlukan</h1>
          <p>Halaman ini hanya untuk role staff/admin.</p>
          <Link className="catalog-cta" to="/signin">
            Masuk sebagai staff
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <header className="staff-header">
        <div>
          <p className="catalog-eyebrow">Staff dashboard</p>
          <h1 className="catalog-title">Order & stok</h1>
          <p className="catalog-subtitle">
            {profile.email} · {profile.role} · {locationName}
          </p>
        </div>

        <div className="staff-toolbar">
          <label>
            <span>Tanggal</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button type="button" className="staff-refresh" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p className="staff-alert staff-alert-error" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      {message && (
        <p className="staff-alert staff-alert-success" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <section className="staff-section">
        <h2>Antrean order · {formatDate(date)}</h2>

        {status === 'loading' && <p className="staff-muted">Memuat order…</p>}
        {status === 'ready' && orders.length === 0 && (
          <p className="staff-muted">Belum ada order untuk tanggal ini.</p>
        )}

        <div className="staff-orders">
          {orders.map((order) => (
            <article className="staff-order" key={order.id}>
              <div className="staff-order-head">
                <div>
                  <strong className="staff-order-code">{order.code}</strong>
                  <p className="staff-order-user">
                    {order.user?.name || order.user?.email || 'Member'}
                  </p>
                </div>
                <span className={`order-status order-status-${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <p className="staff-order-meta">
                {order.pickup.slotStart}–{order.pickup.slotEnd} ·{' '}
                {order.totalSugarGrams} g gula ·{' '}
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  maximumFractionDigits: 0,
                }).format(order.subtotal)}
              </p>

              <ul className="staff-order-items">
                {order.items.map((item) => (
                  <li key={`${item.productId}-${item.name}`}>
                    {item.qty}× {item.name}
                  </li>
                ))}
              </ul>

              {order.notes && <p className="staff-order-notes">{order.notes}</p>}

              <div className="staff-order-actions">
                {(NEXT_STATUSES[order.status] || []).map((next) => (
                  <button
                    key={next.status}
                    type="button"
                    className={`staff-action${
                      next.status === 'canceled' || next.status === 'expired'
                        ? ' staff-action-danger'
                        : ''
                    }`}
                    onClick={() => handleStatus(order, next.status)}
                    disabled={Boolean(busy)}
                  >
                    {busy === order.id ? 'Memproses…' : next.label}
                  </button>
                ))}
                <Link to={`/order/${order.code}`} className="staff-action-link">
                  Detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="staff-section">
        <h2>Stok harian</h2>
        <div className="staff-table-wrap">
          <table className="staff-table">
            <caption className="sr-only">
              Stok harian per produk untuk tanggal terpilih
            </caption>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Gula</th>
                <th>Total</th>
                <th>Reserved</th>
                <th>Terjual</th>
                <th>Tersedia</th>
                <th>Set total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>{item.sugarGrams} g</td>
                  <td>{item.total}</td>
                  <td>{item.reserved}</td>
                  <td>{item.sold}</td>
                  <td>{item.available}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      aria-label={`Total stok ${item.name}`}
                      value={stockEdits[item.productId] ?? item.total}
                      onChange={(event) =>
                        setStockEdits((current) => ({
                          ...current,
                          [item.productId]: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="staff-action"
                      onClick={() => handleStock(item)}
                      disabled={Boolean(busy)}
                    >
                      {busy === item.productId ? 'Menyimpan…' : 'Simpan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
