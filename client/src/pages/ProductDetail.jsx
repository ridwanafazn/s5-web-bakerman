import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '../styles/catalog.css';
import '../styles/phase2.css';
import BudgetBar from '../components/BudgetBar';
import SugarBadge from '../components/SugarBadge';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';
import api from '../lib/api';
import { formatRupiah, getProductImage } from '../utils/products';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { budget, profile, status: sessionStatus } = useSession();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');

    api
      .get(`/v1/products/${slug}`)
      .then(({ data }) => {
        if (!active) return;
        setProduct(data.product);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.friendlyMessage || 'Produk tidak ditemukan.');
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const totalSugar = product ? product.sugarGrams * qty : 0;
  const remainingAfter = budget ? budget.remainingGrams - totalSugar : null;
  const overBudget = remainingAfter !== null && remainingAfter < 0;
  const soldOut = product?.stock && product.stock.available <= 0;

  const handleAdd = () => {
    if (!product || soldOut) return;
    addItem(product, qty);
    setAdded(true);
  };

  if (status === 'loading') {
    return (
      <main className="catalog-page">
        <div className="catalog-state">Memuat produk…</div>
      </main>
    );
  }

  if (status === 'error' || !product) {
    return (
      <main className="catalog-page">
        <div className="catalog-state catalog-state-error" role="alert">
          <h2>Produk tidak ditemukan</h2>
          <p>{error}</p>
          <Link className="catalog-cta" to="/menu">
            Kembali ke menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <BudgetBar />

      <div className="product-detail">
        <div className="product-detail-media">
          <img
            className="product-detail-image"
            src={getProductImage(product)}
            alt={product.name}
          />
        </div>

        <div className="product-detail-info">
          <Link to="/menu" className="product-detail-back">
            ← Kembali ke menu
          </Link>

          <div className="product-detail-badges">
            <SugarBadge level={product.sugarLevel} grams={product.sugarGrams} />
            <span className="catalog-badge">{product.category}</span>
          </div>

          <h1 className="product-detail-title">{product.name}</h1>
          <p className="product-detail-description">{product.description}</p>
          <p className="product-detail-price">{formatRupiah(product.price)}</p>

          <div className="product-detail-meta">
            <div>
              <span className="product-detail-label">Gula per porsi</span>
              <strong>{product.sugarGrams} g</strong>
            </div>
            <div>
              <span className="product-detail-label">Tags</span>
              <strong>{product.tags?.length ? product.tags.join(', ') : '—'}</strong>
            </div>
            <div>
              <span className="product-detail-label">Stok hari ini</span>
              <strong>
                {product.stock ? `${product.stock.available} tersedia` : '—'}
              </strong>
            </div>
          </div>

          {product.ingredients?.length > 0 && (
            <div className="product-detail-section">
              <h2>Bahan</h2>
              <p>{product.ingredients.join(', ')}</p>
            </div>
          )}

          <div className="product-detail-section">
            <h2>Allergen</h2>
            <p>
              {product.allergens?.length
                ? product.allergens.join(', ')
                : 'Tidak ada data allergen.'}
            </p>
          </div>

          <div className="product-detail-buy">
            <div className="qty-stepper" aria-label="Jumlah">
              <button
                type="button"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                aria-label="Kurangi jumlah"
              >
                −
              </button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() => setQty((value) => Math.min(10, value + 1))}
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="product-detail-add"
              onClick={handleAdd}
              disabled={soldOut}
            >
              {soldOut
                ? 'Habis hari ini'
                : `Tambah ke keranjang · ${formatRupiah(product.price * qty)}`}
            </button>
          </div>

          {added && (
            <p className="product-detail-success" role="status">
              Ditambahkan. <Link to="/cart">Lihat keranjang</Link>
            </p>
          )}

          <div className={`product-detail-budget${overBudget ? ' is-over' : ''}`}>
            <strong>Dampak ke budget</strong>
            {sessionStatus === 'loading' ? (
              <p>Memuat budget…</p>
            ) : profile && budget ? (
              <p>
                Order ini memakai <strong>{totalSugar} g</strong>. Sisa budget
                setelahnya: <strong>{remainingAfter} g</strong>
                {overBudget
                  ? budget.mode === 'strict'
                    ? ' — mode strict akan menolak order di atas budget.'
                    : ' — kamu masih bisa lanjut di mode guide, tapi ini akan tercatat sebagai overage.'
                  : '.'}
              </p>
            ) : (
              <p>
                <Link to="/signin">Masuk</Link> untuk melihat dampak ke budget
                gula mingguanmu.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
