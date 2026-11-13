import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { RiMenu3Line, RiCloseLine, RiShoppingBag3Line } from 'react-icons/ri';

import '../styles/navbar.css';
import navbarLogo from '../assets/ico/navbar-logo.png';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';

function Menu({ closeMenu, itemCount, profile }) {
  const { pathname } = useLocation();
  const accountTo = profile ? '/account' : '/signin';
  const accountLabel = profile ? 'Akun' : 'Masuk';
  const current = (path) => (pathname === path ? 'page' : undefined);

  return (
    <>
      <RouterLink
        to="/menu"
        onClick={closeMenu}
        className="navbar-text"
        aria-current={current('/menu')}
      >
        Menu
      </RouterLink>
      <RouterLink
        to="/balance"
        onClick={closeMenu}
        className="navbar-text"
        aria-current={current('/balance')}
      >
        Balance
      </RouterLink>
      <RouterLink
        to="/mission"
        onClick={closeMenu}
        className="navbar-text"
        aria-current={current('/mission')}
      >
        Mission
      </RouterLink>
      <RouterLink
        to="/orders"
        onClick={closeMenu}
        className="navbar-text"
        aria-current={current('/orders')}
      >
        Pesanan
      </RouterLink>
      {profile && ['staff', 'admin'].includes(profile.role) && (
        <RouterLink
          to="/staff"
          onClick={closeMenu}
          className="navbar-text"
          aria-current={current('/staff')}
        >
          Staff
        </RouterLink>
      )}
      <RouterLink
        to={accountTo}
        onClick={closeMenu}
        className="navbar-text"
        aria-current={current(accountTo)}
      >
        {accountLabel}
      </RouterLink>
      <RouterLink
        to="/cart"
        onClick={closeMenu}
        className="navbar-text navbar-cart"
        aria-label={`Keranjang, ${itemCount} item`}
        aria-current={current('/cart')}
      >
        <RiShoppingBag3Line aria-hidden="true" />
        <span>Keranjang</span>
        {itemCount > 0 && <span className="navbar-cart-count">{itemCount}</span>}
      </RouterLink>
    </>
  );
}

export default function Navbar() {
  const [toggleMenu, setToggleMenu] = useState(false);
  const { itemCount } = useCart();
  const { profile } = useSession();

  const closeMenu = () => setToggleMenu(false);

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <RouterLink to="/" aria-label="Bakerman Balance — beranda">
          <img className="navbar-logo" src={navbarLogo} alt="Bakerman Balance" />
        </RouterLink>
      </div>

      <nav className="navbar-right" aria-label="Navigasi utama">
        <Menu closeMenu={closeMenu} itemCount={itemCount} profile={profile} />
      </nav>

      <div className="navbar-mobile-menu">
        <button
          type="button"
          className="navbar-menu-button"
          onClick={() => setToggleMenu((open) => !open)}
          aria-label={toggleMenu ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={toggleMenu}
        >
          {toggleMenu ? <RiCloseLine size={27} /> : <RiMenu3Line size={27} />}
        </button>

        {toggleMenu && (
          <nav className="navbar-mobile-container" aria-label="Navigasi mobile">
            <Menu closeMenu={closeMenu} itemCount={itemCount} profile={profile} />
          </nav>
        )}
      </div>
    </header>
  );
}
