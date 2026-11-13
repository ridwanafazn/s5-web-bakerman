import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/product.css';
import BudgetBar from './BudgetBar';
import ProductCard from './ProductCard';
import api from '../lib/api';

function ProductSkeleton() {
  return (
    <div className="catalog-card catalog-skeleton-card" aria-hidden="true">
      <div className="catalog-image catalog-skeleton" />
      <div className="catalog-body">
        <div className="catalog-skeleton catalog-skeleton-text" />
        <div className="catalog-skeleton catalog-skeleton-text short" />
      </div>
    </div>
  );
}

export default function Product() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setStatus('loading');
    setError('');

    try {
      const { data } = await api.get('/v1/products');
      setProducts((data.products || []).slice(0, 3));
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Gagal memuat produk.');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <section className="product-container" id="product">
      <div className="product-top">
        <div>
          <p className="product-eyebrow">Menu pilihan</p>
          <h2 className="product-title">Treat dengan gula yang kamu tahu.</h2>
        </div>
        <p className="product-description">
          Setiap produk punya label gula per porsi. Pilih yang paling pas dengan
          sisa budget mingguanmu — tanpa perlu menebak-nebak.
        </p>
      </div>

      <BudgetBar />

      {status === 'loading' && (
        <div className="catalog-grid catalog-grid-three" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <ProductSkeleton key={item} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="catalog-state catalog-state-error" role="alert">
          <h2>Menu belum bisa dimuat</h2>
          <p>{error}</p>
          <button type="button" className="catalog-cta" onClick={loadProducts}>
            Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && products.length === 0 && (
        <div className="catalog-state">
          <h2>Belum ada produk</h2>
          <p>Menu minggu ini belum tersedia. Coba lagi nanti.</p>
        </div>
      )}

      {status === 'ready' && products.length > 0 && (
        <>
          <div className="catalog-grid catalog-grid-three">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} showStock={false} />
            ))}
          </div>

          <div className="product-cta-row">
            <Link to="/menu" className="product-cta">
              Lihat semua menu
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
