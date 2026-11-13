import { Link } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase2.css';
import BudgetBar from '../components/BudgetBar';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';
import { formatRupiah, getProductImage } from '../utils/products';

export default function Cart() {
  const { items, itemCount, subtotal, totalSugar, updateQty, removeItem, clear } =
    useCart();
  const { profile, budget, status } = useSession();

  const remainingAfter = budget ? budget.remainingGrams - totalSugar : null;
  const overBudget = remainingAfter !== null && remainingAfter < 0;

  if (items.length === 0) {
    return (
      <main className="catalog-page">
        <div className="catalog-state">
          <h1>Keranjang masih kosong</h1>
          <p>Pilih treat dengan label gula yang jelas, lalu atur budget-nya.</p>
          <Link className="catalog-cta" to="/menu">
            Lihat menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="catalog-eyebrow">Keranjang</p>
        <h1 className="catalog-title">Review treat mingguanmu</h1>
        <p className="catalog-subtitle">
          {itemCount} item · total gula {totalSugar} g
        </p>
      </header>

      <BudgetBar />

      <div className="cart-layout">
        <section className="cart-items" aria-label="Item keranjang">
          {items.map((item) => (
            <article className="cart-item" key={item.slug}>
              <img
                className="cart-item-image"
                src={getProductImage(item)}
                alt={item.name}
              />

              <div className="cart-item-info">
                <Link to={`/product/${item.slug}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="cart-item-meta">
                  {item.sugarGrams} g gula / porsi · {formatRupiah(item.price)}
                </span>
              </div>

              <div className="qty-stepper" aria-label={`Jumlah ${item.name}`}>
                <button
                  type="button"
                  onClick={() => updateQty(item.slug, item.qty - 1)}
                  aria-label="Kurangi jumlah"
                >
                  −
                </button>
                <span>{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.slug, item.qty + 1)}
                  aria-label="Tambah jumlah"
                >
                  +
                </button>
              </div>

              <strong className="cart-item-total">
                {formatRupiah(item.price * item.qty)}
              </strong>

              <button
                type="button"
                className="cart-item-remove"
                onClick={() => removeItem(item.slug)}
              >
                Hapus
              </button>
            </article>
          ))}

          <button type="button" className="cart-clear" onClick={clear}>
            Kosongkan keranjang
          </button>
        </section>

        <aside className="cart-summary">
          <h2>Ringkasan</h2>

          <div className="cart-summary-row">
            <span>Subtotal</span>
            <strong>{formatRupiah(subtotal)}</strong>
          </div>
          <div className="cart-summary-row">
            <span>Total gula</span>
            <strong>{totalSugar} g</strong>
          </div>

          {status === 'loading' ? (
            <p className="cart-login-hint">Memuat budget…</p>
          ) : profile && budget ? (
            <>
              <div className="cart-summary-row">
                <span>Sisa budget sekarang</span>
                <strong>{budget.remainingGrams} g</strong>
              </div>
              <div className={`cart-summary-row${overBudget ? ' is-over' : ''}`}>
                <span>Setelah keranjang ini</span>
                <strong>{remainingAfter} g</strong>
              </div>

              {overBudget && (
                <p className="cart-warning" role="status">
                  {budget.mode === 'strict'
                    ? 'Mode strict: checkout akan ditolak sampai budget cukup.'
                    : 'Mode guide: kamu masih bisa lanjut, tetapi ini akan tercatat sebagai overage.'}
                </p>
              )}
            </>
          ) : (
            <p className="cart-login-hint">
              <Link to="/signin">Masuk</Link> untuk melihat dampak ke budget
              mingguanmu.
            </p>
          )}

          {status === 'loading' ? (
            <span className="cart-checkout is-loading">Memuat sesi…</span>
          ) : profile ? (
            <Link to="/checkout" className="cart-checkout">
              Lanjut ke checkout
            </Link>
          ) : (
            <Link to="/signin" className="cart-checkout">
              Masuk untuk checkout
            </Link>
          )}
          <p className="cart-note">
            Pembayaran dilakukan di outlet (QRIS/tunai) saat pickup.
          </p>
        </aside>
      </div>
    </main>
  );
}
