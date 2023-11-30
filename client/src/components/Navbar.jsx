import React, { useState } from "react";
import "../styles/navbar.css";
import { Link as ScrollLink} from "react-scroll";
import { Link as RouterLink} from "react-router-dom";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import navbarLogo from '../assets/ico/navbar-logo.png';

const Menu = ({ closeMenu }) => {
  const linkStyle = {
    textDecoration: "none"
  };
  return (
    <>
      <RouterLink to="/mission" onClick={closeMenu} className="navbar-text" style={linkStyle}>
        Mission
      </RouterLink>
      <RouterLink to="/chance" onClick={closeMenu} className="navbar-text" style={linkStyle}>
        Chance
      </RouterLink>
      <RouterLink to="/category" onClick={closeMenu} className="navbar-text" style={linkStyle}> 
        Category
      </RouterLink>
      <RouterLink to="/account" onClick={closeMenu} className="navbar-text" style={linkStyle}>
        Profile
      </RouterLink>
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
        <RouterLink to="/">
        {/* Ganti gambar logo dengan logo yang sesuai */}
        <img className="navbar-logo" src={navbarLogo} alt="Navbar Logo" />
        </RouterLink>
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
