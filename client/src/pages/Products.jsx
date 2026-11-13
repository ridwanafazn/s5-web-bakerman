import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '../styles/catalog.css';
import BudgetBar from '../components/BudgetBar';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { CATEGORY_BY_SLUG, CATEGORY_FILTERS } from '../utils/products';

function MenuSkeleton() {
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

export default function Products() {
  const { slug } = useParams();
  const activeCategory = slug ? CATEGORY_BY_SLUG[slug] : null;
  const invalidCategory = Boolean(slug && !activeCategory);

  const [products, setProducts] = useState([]);
  const [menuDate, setMenuDate] = useState('');
  const [locationName, setLocationName] = useState('Bakerman Dago');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const loadMenu = async () => {
    setStatus('loading');
    setError('');

    try {
      const [menuResponse, locationResponse] = await Promise.all([
        api.get('/v1/menu/today'),
        api.get('/v1/locations'),
      ]);

      setProducts(menuResponse.data.products || []);
      setMenuDate(menuResponse.data.date || '');
      setLocationName(locationResponse.data.locations?.[0]?.name || 'Bakerman Dago');
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.friendlyMessage || 'Menu belum bisa dimuat.');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const title = invalidCategory
    ? 'Kategori tidak ditemukan'
    : activeCategory || 'Menu Minggu Ini';

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="catalog-eyebrow">Bakerman Balance · Bandung</p>
        <h1 className="catalog-title">{title}</h1>
        <p className="catalog-subtitle">
          Stok hari ini{menuDate ? ` · ${menuDate}` : ''} · Pickup di {locationName}
        </p>
      </header>

      <BudgetBar />

      <nav className="catalog-filters" aria-label="Filter kategori">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive =
            (filter.value === null && !activeCategory) || filter.value === activeCategory;

          return (
            <Link
              key={filter.slug}
              to={filter.slug === 'all' ? '/menu' : `/category/${filter.slug}`}
              className={`catalog-filter${isActive ? ' is-active' : ''}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {status === 'loading' && (
        <div className="catalog-grid" aria-busy="true" aria-label="Memuat menu">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <MenuSkeleton key={item} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="catalog-state catalog-state-error" role="alert">
          <h2>Menu belum bisa dimuat</h2>
          <p>{error}</p>
          <button type="button" className="catalog-cta" onClick={loadMenu}>
            Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && (invalidCategory || filteredProducts.length === 0) && (
        <div className="catalog-state">
          <h2>{invalidCategory ? 'Kategori tidak ditemukan' : 'Belum ada produk'}</h2>
          <p>
            {invalidCategory
              ? 'Coba lihat seluruh menu yang tersedia.'
              : 'Kategori ini belum punya produk hari ini.'}
          </p>
          <Link className="catalog-cta" to="/menu">
            Lihat semua menu
          </Link>
        </div>
      )}

      {status === 'ready' && !invalidCategory && filteredProducts.length > 0 && (
        <section className="catalog-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </section>
      )}
    </main>
  );
}
