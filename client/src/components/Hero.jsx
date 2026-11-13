import { Link } from 'react-router-dom';

import '../styles/hero.css';
import heroCake from '../assets/images/hero-cake.webp';

export default function Hero() {
  return (
    <section className="hero-container">
      <div className="hero-left">
        <p className="hero-eyebrow">Bakerman Balance · Bandung</p>
        <h1 className="hero-title">Nikmati manisnya. Jaga progresnya.</h1>
        <p className="hero-description">
          Bakery pre-order dengan gula transparan. Atur budget gula mingguan,
          pilih treat favoritmu, lalu pickup di Bakerman Dago.
        </p>

        <div className="hero-actions">
          <Link to="/menu" className="hero-cta">
            Lihat menu minggu ini
          </Link>
          <Link to="/balance" className="hero-cta hero-cta-secondary">
            Atur budget
          </Link>
        </div>

        <ul className="hero-pills" aria-label="Keunggulan Bakerman Balance">
          <li>Budget 60–120 g/minggu</li>
          <li>Label gula transparan</li>
          <li>Pickup di Dago</li>
        </ul>
      </div>

      <div className="hero-right">
        <img
          className="hero-cake"
          src={heroCake}
          alt="Bakery Bakerman"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}
