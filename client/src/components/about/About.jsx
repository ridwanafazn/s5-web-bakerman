import React from "react";
import './about.css';
 
import Shipping from '../../assets/images/shipping-website01_1_900x.webp'

const About = () => {
  return (
    <div className="about-container" id="about-us">
      <div className="about-box">
        <div className="about-left-container">
            <div className="about-title-container">
              <p className="about-title">Delivery and Pick Up Options</p>
            </div>
            <p className="about-description">
            We make it easy for you to get Magnolia Bakery’s best, wherever you are. Order now for nationwide shipping, place an order to pickup at your local shop, or get in touch with our team to arrange custom catering for your next event.
            </p>
          </div>
          <div className="about-right-container">
            <img className="about-making-cake" src={Shipping} />
          </div>
      </div>
        
    </div>
  );
};

export default About;