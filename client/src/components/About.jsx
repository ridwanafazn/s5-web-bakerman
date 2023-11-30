import React from "react";
import '../styles/about.css';

import Official from '../assets/images/official-store.jpg'
import Offline from '../assets/images/offline-bakery.jpg'
import Reseller from '../assets/images/online-reseller-850x550.jpg'

const About = () => {
  return (
    <div className="about-container" id="about-us">
      <div className="about-box">
        <div className="about-left-container">
          <div className="about-title-container">
            <p className="about-title">Shopping Options</p>
          </div>
          <p className="about-description">
            We make it easy for you to get Bakerman Bakery’s best, wherever you are. Order now for nationwide shipping, place an order to pickup at your local shop, or get in touch with our team to arrange custom catering for your next event.
          </p>
        </div>
        <div className="about-right-container">
          <div className="about-image-container">
            <a href="https://www.tokopedia.com/misolpastry" target="_blank" rel="noopener noreferrer">
              <img className="about-making-cake" src={Official} alt="Official Store" />
            </a>
            <p className="image-caption">Official Store</p>
          </div>

          <div className="about-image-container">
            <a href="/near-online-reseller">
              <img className="about-making-cake" src={Reseller} alt="Near Online Reseller" />
            </a>
            <p className="image-caption">Near Online Reseller</p>
          </div>

          <div className="about-image-container">
            <a href="/visit-offline-store">
              <img className="about-making-cake" src={Offline} alt="Visit Offline Store" />
            </a>
            <p className="image-caption">Visit Offline Store</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
