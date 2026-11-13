import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import './styles/index.css';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Product from './components/Product';
import About from './components/About';
import Footer from './components/Footer';

// Pages — dipisah per route agar bundle awal lebih kecil.
const Mission = lazy(() => import('./pages/Mission'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/SignUp'));
const Profile = lazy(() => import('./pages/Profile'));
const Category = lazy(() => import('./pages/Category'));
const ProductsPage = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const Staff = lazy(() => import('./pages/Staff'));
const BalancePage = lazy(() => import('./pages/Balance'));
const NotFound = lazy(() => import('./pages/NotFound'));

const TITLES = {
  '/': 'Bakerman Balance — Dessert dengan budget gula',
  '/signin': 'Masuk — Bakerman Balance',
  '/signup': 'Daftar — Bakerman Balance',
  '/mission': 'Mission — Bakerman Balance',
  '/account': 'Akun — Bakerman Balance',
  '/menu': 'Menu minggu ini — Bakerman Balance',
  '/all': 'Menu minggu ini — Bakerman Balance',
  '/category': 'Kategori — Bakerman Balance',
  '/cart': 'Keranjang — Bakerman Balance',
  '/checkout': 'Checkout — Bakerman Balance',
  '/orders': 'Pesanan saya — Bakerman Balance',
  '/staff': 'Staff dashboard — Bakerman Balance',
  '/balance': 'Balance — Bakerman Balance',
};

function titleForPath(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/product/')) return 'Detail produk — Bakerman Balance';
  if (pathname.startsWith('/category/')) return 'Kategori — Bakerman Balance';
  if (pathname.startsWith('/order/')) return 'Detail order — Bakerman Balance';
  return 'Halaman tidak ditemukan — Bakerman Balance';
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}

function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}

function Page({ children }) {
  return (
    <>
      <Navbar />
      <div id="main-content" className="main-content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="route-loading" role="status" aria-live="polite">
              Memuat halaman…
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <ScrollToTop />
      <DocumentTitle />
      <Routes>
        <Route
          path="/"
          element={
            <Page>
              <Hero />
              <Product />
              <About />
            </Page>
          }
        />

        <Route path="/signin" element={<Page><Login /></Page>} />
        <Route path="/signup" element={<Page><Signup /></Page>} />
        <Route path="/mission" element={<Page><Mission /></Page>} />
        <Route path="/chance" element={<Navigate to="/balance" replace />} />
        <Route path="/account" element={<Page><Profile /></Page>} />

        <Route path="/menu" element={<Page><ProductsPage /></Page>} />
        <Route path="/all" element={<Page><ProductsPage /></Page>} />
        <Route path="/category" element={<Page><Category /></Page>} />
        <Route path="/category/:slug" element={<Page><ProductsPage /></Page>} />
        <Route path="/product/:slug" element={<Page><ProductDetail /></Page>} />
        <Route path="/cart" element={<Page><CartPage /></Page>} />
        <Route path="/checkout" element={<Page><Checkout /></Page>} />
        <Route path="/order/:code" element={<Page><OrderDetail /></Page>} />
        <Route path="/orders" element={<Page><Orders /></Page>} />
        <Route path="/staff" element={<Page><Staff /></Page>} />
        <Route path="/balance" element={<Page><BalancePage /></Page>} />

        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </Router>
  );
}

export default App;
