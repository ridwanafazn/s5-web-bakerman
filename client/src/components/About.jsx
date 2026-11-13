import { Link } from 'react-router-dom';

import '../styles/about.css';
import Official from '../assets/images/official-store.jpg';
import Offline from '../assets/images/offline-bakery.jpg';
import Reseller from '../assets/images/online-reseller-850x550.jpg';

const steps = [
  {
    image: Official,
    alt: 'Atur budget gula',
    caption: '1. Atur budget',
    description: 'Pilih preset 60, 90, atau 120 g gula per minggu.',
    to: '/balance',
  },
  {
    image: Reseller,
    alt: 'Pilih treat dengan label gula',
    caption: '2. Pilih treat',
    description: 'Lihat gula per porsi dan tambahkan ke keranjang.',
    to: '/menu',
  },
  {
    image: Offline,
    alt: 'Pickup di Bakerman Dago',
    caption: '3. Pickup',
    description: 'Ambil pesananmu di Bakerman Dago, Bandung.',
    to: '/menu',
  },
];

export default function About() {
  return (
    <section className="about-container" id="about-us">
      <div className="about-box">
        <div className="about-left-container">
          <p className="about-eyebrow">Cara kerja</p>
          <h2 className="about-title">Dessert tetap bisa dinikmati dengan sadar.</h2>
          <p className="about-description">
            Bakerman Balance bukan diet. Ini alat bantu sederhana: transparansi
            gula, budget mingguan, dan reward aktivitas yang segera hadir.
          </p>
          <Link to="/menu" className="about-cta">
            Mulai pilih menu
          </Link>
        </div>

        <div className="about-right-container">
          {steps.map((step) => (
            <Link key={step.caption} to={step.to} className="about-image-container">
              <img
                className="about-making-cake"
                src={step.image}
                alt={step.alt}
                loading="lazy"
                decoding="async"
              />
              <p className="image-caption">{step.caption}</p>
              <p className="about-step-description">{step.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
