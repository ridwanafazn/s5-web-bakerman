import { Link } from 'react-router-dom';

import '../styles/footer.css';

const LINKS = [
  {
    title: 'Jelajahi',
    items: [
      { label: 'Menu', to: '/menu' },
      { label: 'Balance', to: '/balance' },
      { label: 'Pesanan', to: '/orders' },
      { label: 'Mission', to: '/mission' },
    ],
  },
  {
    title: 'Bakerman',
    items: [
      { label: 'Mission', to: '/mission' },
      { label: 'Kategori', to: '/category' },
      { label: 'Akun', to: '/account' },
    ],
  },
];

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer">
        <div className="info">
          <h5 className="title">Bakerman Balance · Bandung</h5>
          <div className="menu">
            {LINKS.map(({ title, items }) => (
              <ul key={title}>
                <li>
                  <small className="products">{title}</small>
                </li>
                {items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to}>
                      <small className="resources">{item.label}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="copyright-icon">
          <div className="social-icon">
            <a
              href="https://instagram.com/r1dwanafazn/"
              className="icon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Bakerman"
            >
              <svg
                className="social-icon-svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="mailto:hello@bakerman.id"
              className="icon"
              aria-label="Email Bakerman"
            >
              <svg
                className="social-icon-svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
              </svg>
            </a>
          </div>

          <small className="copyright">
            &copy; {currentYear} Bakerman Balance. Dibuat untuk portfolio produk.
          </small>
        </div>
      </div>
    </footer>
  );
}
