import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase2.css';
import '../styles/phase4.css';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';
import { formatRupiah } from '../utils/products';

const STATUS_LABELS = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Sudah dibayar',
  preparing: 'Sedang disiapkan',
  ready: 'Siap diambil',
  picked_up: 'Sudah diambil',
  canceled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export default function OrderDetail() {
  const { code } = useParams();
  const { profile, refresh } = useSession();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOrder = async () => {
    setStatus('loading');
    setError('');

    try {
      const { data } = await api.get(`/v1/orders/${code}`);
      setOrder(data.order);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Order tidak ditemukan.');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleCancel = async () => {
    if (!order) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const { data } = await api.post(`/v1/orders/${order.id}/cancel`);
      setOrder(data.order);
      await refresh();
      setNotice('Order dibatalkan. Budget dan stok dikembalikan.');
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal membatalkan order.');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat order…</div>
      </main>
    );
  }

  if (status === 'error' || !order) {
    return (
      <main className="catalog-page">
        <div className="catalog-state catalog-state-error" role="alert">
          <h1>Order tidak ditemukan</h1>
          <p>{error}</p>
          <Link className="catalog-cta" to="/orders">
            Lihat pesanan saya
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = order.user?.email && order.user.email === profile?.email;

  return (
    <main className="catalog-page">
      <header className="order-header">
        <p className="catalog-eyebrow">Order pickup</p>
        <h1 className="order-code">{order.code}</h1>
        <span className={`order-status order-status-${order.status}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </header>

      {notice && <p className="order-notice">{notice}</p>}
      {error && <p className="order-warning" role="alert">{error}</p>}

      <div className="order-layout">
        <div className="order-main">
          <section className="order-card">
            <h2>Pickup</h2>
            <p className="order-pickup-date">{formatDate(order.pickup.date)}</p>
            <p>
              {order.pickup.slotStart}–{order.pickup.slotEnd} ·{' '}
              {order.pickup.locationName}
            </p>
            <p className="order-muted">{order.pickup.address}</p>
          </section>

          <section className="order-card">
            <h2>Item</h2>
            <div className="order-items">
              {order.items.map((item) => (
                <div className="order-item" key={`${item.productId}-${item.name}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.sugarGrams} g gula</span>
                  </div>
                  <span>{item.qty}×</span>
                  <strong>{formatRupiah(item.lineTotal)}</strong>
                </div>
              ))}
            </div>
          </section>

          {order.notes && (
            <section className="order-card">
              <h2>Catatan</h2>
              <p>{order.notes}</p>
            </section>
          )}
        </div>

        <aside className="order-summary">
          <h2>Ringkasan</h2>
          <div className="order-summary-row">
            <span>Subtotal</span>
            <strong>{formatRupiah(order.subtotal)}</strong>
          </div>
          <div className="order-summary-row">
            <span>Total gula</span>
            <strong>{order.totalSugarGrams} g</strong>
          </div>
          <div className="order-summary-row">
            <span>Pembayaran</span>
            <strong>
              {order.payment.method === 'qris_manual'
                ? 'QRIS manual'
                : 'Bayar di tempat'}
            </strong>
          </div>

          {order.budgetOverride && (
            <p className="order-warning">
              Order ini melebihi budget dan dikonfirmasi sebagai overage.
            </p>
          )}

          {isOwner && order.status === 'pending_payment' && (
            <button
              type="button"
              className="order-cancel"
              onClick={handleCancel}
              disabled={busy}
            >
              {busy ? 'Membatalkan…' : 'Batalkan order'}
            </button>
          )}

          <Link to="/orders" className="order-link">
            Lihat semua pesanan
          </Link>
          <Link to="/menu" className="order-link">
            Pesan lagi
          </Link>
        </aside>
      </div>
    </main>
  );
}
