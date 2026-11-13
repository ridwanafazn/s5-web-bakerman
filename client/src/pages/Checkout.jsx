import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase2.css';
import '../styles/phase4.css';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';
import { formatRupiah } from '../utils/products';

function jakartaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function formatDay(isoDate) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${isoDate}T12:00:00+07:00`));
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, totalSugar, clear } = useCart();
  const { profile, budget, status: sessionStatus, refresh } = useSession();

  const today = jakartaToday();
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDaysIso(today, index)),
    [today]
  );

  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [slotStart, setSlotStart] = useState('');
  const [notes, setNotes] = useState('');
  const [budgetOverride, setBudgetOverride] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedLocation = locations.find((location) => location.id === locationId);
  const selectedSlot = slots.find((slot) => slot.startTime === slotStart);
  const remainingAfter = budget ? budget.remainingGrams - totalSugar : null;
  const overBudget = remainingAfter !== null && remainingAfter < 0;
  const strictBlocked = overBudget && budget?.mode === 'strict';

  useEffect(() => {
    if (!profile) return;

    api
      .get('/v1/locations')
      .then(({ data }) => {
        setLocations(data.locations || []);
        if (data.locations?.[0]) setLocationId(data.locations[0].id);
      })
      .catch((requestError) => {
        setError(requestError.friendlyMessage || 'Gagal memuat outlet.');
      });
  }, [profile]);

  useEffect(() => {
    if (!locationId || !date) return;

    let active = true;
    setLoadingSlots(true);
    setSlots([]);
    setSlotStart('');

    api
      .get('/v1/pickup-slots', { params: { locationId, date } })
      .then(({ data }) => {
        if (!active) return;
        const available = (data.slots || []).filter((slot) => slot.available > 0);
        setSlots(data.slots || []);
        if (available[0]) setSlotStart(available[0].startTime);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.friendlyMessage || 'Gagal memuat slot pickup.');
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [locationId, date]);

  const handlePlaceOrder = async () => {
    if (!profile) {
      navigate('/signin');
      return;
    }
    if (!selectedSlot) {
      setError('Pilih slot pickup terlebih dahulu.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const { data } = await api.post('/v1/orders', {
        items: items.map((item) => ({ slug: item.slug, qty: item.qty })),
        pickup: { locationId, date, slotStart },
        paymentMethod: 'pay_at_pickup',
        notes,
        idempotencyKey: window.crypto.randomUUID(),
        budgetOverride,
      });

      clear();
      await refresh();
      navigate(`/order/${data.order.code}`);
    } catch (requestError) {
      const code = requestError.response?.data?.code;

      if (code === 'BUDGET_CONFIRM_REQUIRED') {
        setError(
          'Order melebihi budget. Centang konfirmasi overage di ringkasan, lalu coba lagi.'
        );
      } else if (code === 'BUDGET_EXCEEDED') {
        setError(
          'Mode strict menolak order di atas budget. Kecilkan item atau ubah preset budget.'
        );
      } else {
        setError(requestError.friendlyMessage || 'Gagal membuat order.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="catalog-page">
        <div className="catalog-state">
          <h1>Keranjang masih kosong</h1>
          <p>Pilih treat dulu sebelum checkout.</p>
          <Link className="catalog-cta" to="/menu">
            Lihat menu
          </Link>
        </div>
      </main>
    );
  }

  if (sessionStatus === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat sesi…</div>
      </main>
    );
  }

  if (!profile || !budget) {
    return (
      <main className="catalog-page">
        <div className="catalog-state">
          <h1>Masuk untuk checkout</h1>
          <p>Order pickup memerlukan akun agar budget dan kode order tersimpan.</p>
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
        <p className="catalog-eyebrow">Checkout</p>
        <h1 className="catalog-title">Pilih waktu pickup</h1>
        <p className="catalog-subtitle">
          {itemCount} item · total gula {totalSugar} g · {profile.email}
        </p>
      </header>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-card">
            <h2>Item pesanan</h2>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.slug}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.sugarGrams} g gula / porsi</span>
                  </div>
                  <span>
                    {item.qty} × {formatRupiah(item.price)}
                  </span>
                  <strong>{formatRupiah(item.price * item.qty)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="checkout-card">
            <h2>Pickup</h2>
            <p className="checkout-location">
              {selectedLocation
                ? `${selectedLocation.name} · ${selectedLocation.address}`
                : 'Memuat outlet…'}
            </p>

            <div className="checkout-date-grid" aria-label="Tanggal pickup">
              {dates.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`checkout-date${date === item ? ' is-active' : ''}`}
                  onClick={() => setDate(item)}
                  aria-pressed={date === item}
                >
                  {formatDay(item)}
                </button>
              ))}
            </div>

            <h3 className="checkout-subheading">Slot</h3>
            {loadingSlots ? (
              <p className="checkout-muted">Memuat slot…</p>
            ) : slots.length === 0 ? (
              <p className="checkout-muted">Tidak ada slot untuk tanggal ini.</p>
            ) : (
              <div className="checkout-slot-grid" aria-label="Slot pickup">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    className={`checkout-slot${slotStart === slot.startTime ? ' is-active' : ''}`}
                    onClick={() => setSlotStart(slot.startTime)}
                    disabled={slot.available <= 0}
                    aria-pressed={slotStart === slot.startTime}
                  >
                    <strong>
                      {slot.startTime}–{slot.endTime}
                    </strong>
                    <span>
                      {slot.available > 0
                        ? `${slot.available} slot tersisa`
                        : 'Penuh'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="checkout-card">
            <h2>Pembayaran</h2>
            <p className="checkout-muted">
              Bayar di tempat saat pickup (QRIS atau tunai). Tidak ada payment
              gateway di MVP ini.
            </p>

            <label className="checkout-notes">
              <span>Catatan untuk staff (opsional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Contoh: tanpa kacang, ambil jam 15:30."
              />
            </label>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Ringkasan</h2>

          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <strong>{formatRupiah(subtotal)}</strong>
          </div>
          <div className="checkout-summary-row">
            <span>Total gula</span>
            <strong>{totalSugar} g</strong>
          </div>
          <div className="checkout-summary-row">
            <span>Budget sekarang</span>
            <strong>{budget.remainingGrams} g</strong>
          </div>
          <div className={`checkout-summary-row${overBudget ? ' is-over' : ''}`}>
            <span>Setelah order</span>
            <strong>{remainingAfter} g</strong>
          </div>

          {overBudget && (
            <p className="checkout-warning" role="status" aria-live="polite">
              {strictBlocked
                ? 'Mode strict: order ini ditolak sampai budget cukup.'
                : `Order ini melebihi budget ${Math.abs(remainingAfter)} g.`}
            </p>
          )}

          {overBudget && budget.mode === 'guide' && (
            <label className="checkout-override">
              <input
                type="checkbox"
                checked={budgetOverride}
                onChange={(event) => setBudgetOverride(event.target.checked)}
              />
              <span>Saya tetap lanjut dan mencatat overage ini.</span>
            </label>
          )}

          {error && (
            <p className="checkout-warning" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="checkout-place"
            onClick={handlePlaceOrder}
            disabled={busy || strictBlocked || (overBudget && !budgetOverride)}
            aria-busy={busy}
          >
            {busy ? 'Membuat order…' : 'Buat order pickup'}
          </button>

          <p className="checkout-note">
            Kode order akan muncul setelah order dibuat. Tunjukkan kode ke staff
            saat pickup.
          </p>
        </aside>
      </div>
    </main>
  );
}
