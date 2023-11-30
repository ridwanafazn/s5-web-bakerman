import React from "react";
import { Link } from "react-scroll";
import '../styles/hero.css';

import heroCake from '../assets/images/hero-cake.webp';

const Hero = () => {
  return (
    <div className="hero-container">
      <div className="hero-left">
        <p className="hero-title">Bakerman is now in Grocery Stores!</p>
        <p className="hero-description">Classic Local x American baked goods and desserts like our world-famous banana pudding, cakes and cupcakes. Order them online to ship or pick up in-store.</p>
        <Link to="about-us" smooth={true} duration={500} className="hero-button-container">
          <p className="hero-button-text">Shop Now</p>
        </Link>
      </div>
      <div className="hero-right">
        <img className="hero-cake" src={heroCake} alt="Hero Cake" />
      </div>
    </div>
  );
};

export default Hero;
