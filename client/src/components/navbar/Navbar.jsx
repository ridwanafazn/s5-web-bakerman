import React, { useState } from "react";
import "./navbar.css";
import { Link } from "react-scroll";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import navbarLogo from '../../assets/ico/navbar-logo.png';

const Menu = ({ closeMenu }) => {
  return (
    <>
      <Link to="/mission" onClick={closeMenu} className="navbar-text">
        Mission
      </Link>
      <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">
        Chance
      </Link>
      <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">
        Category
      </Link>
      <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">
        Profile
      </Link>
    </>
  );
};

const Navbar = () => {
  const [toggleMenu, setToggleMenu] = useState(false);

  const closeMenu = () => {
    setToggleMenu(false);
  };

  return (
    <div className="navbar-container">
      <div className="navbar-left">
        {/* Ganti gambar logo dengan logo yang sesuai */}
        <img className="navbar-logo" src={navbarLogo} alt="Navbar Logo" />
      </div>
      <div className="navbar-right">
        <Menu closeMenu={closeMenu} /> {/* Meneruskan closeMenu sebagai prop */}
      </div>

      <div className="navbar-mobile-menu">
        {toggleMenu ? (
          <RiCloseLine
            color="#272727"
            size={27}
            onClick={() => setToggleMenu(false)}
          />
        ) : (
          <RiMenu3Line
            color="#272727"
            size={27}
            onClick={() => setToggleMenu(true)}
          />
        )}
        {toggleMenu && (
          <div className="navbar-mobile-container">
            <Menu closeMenu={closeMenu} /> {/* Meneruskan closeMenu sebagai prop */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
