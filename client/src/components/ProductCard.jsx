import { Link } from 'react-router-dom';

import '../styles/catalog.css';
import SugarBadge from './SugarBadge';
import { useCart } from '../context/CartContext';
import { formatRupiah, getProductImage } from '../utils/products';

export default function ProductCard({ product, showStock = true }) {
  const { addItem } = useCart();
  const available = product.stock?.available;
  const soldOut = showStock && typeof available === 'number' && available <= 0;

  return (
    <article className="catalog-card">
      <Link to={`/product/${product.slug}`} className="catalog-image-link">
        <img
          className="catalog-image"
          src={getProductImage(product)}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
      </Link>

      <div className="catalog-body">
        <div className="catalog-badges">
          <SugarBadge level={product.sugarLevel} grams={product.sugarGrams} />
          <span className="catalog-badge">{product.category}</span>
        </div>

        <h2 className="catalog-name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h2>

        <p className="catalog-description">{product.description}</p>

        <div className="catalog-meta">
          <span>{product.sugarGrams} g gula</span>
          {showStock && typeof available === 'number' && (
            <span>{soldOut ? 'Habis hari ini' : `Stok ${available}`}</span>
          )}
        </div>

        <div className="catalog-card-actions">
          <p className="catalog-price">{formatRupiah(product.price)}</p>
          <button
            type="button"
            className="catalog-add"
            onClick={() => addItem(product)}
            disabled={soldOut}
          >
            {soldOut ? 'Habis' : 'Tambah'}
          </button>
        </div>
      </div>
    </article>
  );
}
