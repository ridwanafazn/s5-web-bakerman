import React, { useState } from "react";
import './navbar.css';
import {Link} from 'react-scroll'; /* npm install react-scroll */

import navbarLogo from '../../assets/ico/navbar-logo.png'
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri'

const Menu = () => {
  return (
      <>  {}
        <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">Our Mission</Link>
        <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">Shop</Link>
        <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">About Us</Link>
        <Link to="" spy={true} smooth={true} duration={500} className="navbar-text">Login</Link>
      </>
  )
}

const Navbar = () => {
  const[toggleMenu, setToggleMenu] = useState(false);

  return (
    <div className="navbar-container">
      <div className="navbar-left">
        <img className="navbar-logo" src={navbarLogo} />
      </div>
      <div className="navbar-right">
        <Menu />
      </div>

      <div className="navbar-mobile-menu">
        {toggleMenu
            ? <RiCloseLine color="#272727" size={27} onClick={() => setToggleMenu(false)} />
            : <RiMenu3Line color="#272727" size={27} onClick={() => setToggleMenu(true)} />}
        {toggleMenu && (
            <div className="navbar-mobile-container">
              <Menu />
            </div>
        )}
        
      </div>
    </div>
  );
};

export default Navbar;
