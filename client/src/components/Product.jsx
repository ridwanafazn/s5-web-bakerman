import React from "react";
import '../styles/product.css';
 
import productLine from '../assets/svg/line-y.svg'
import horizontalLine from '../assets/images/product-horizontal-line.png'
import Buns from '../assets/images/epic-morning-buns.webp'
import WheatLoaf from '../assets/images/organic-wheat-free-loaf.webp'
import BananaPudding from '../assets/images/classic-banana-pudding.webp'

const ProductBox = ({image, desc}) => {
  return (
    <div className="product-function-container">
      <img className="product-function-image" src={image} />
      <p className="product-function-description" >{desc}</p>
    </div>
  )
}

const Product = () => {
  return (
    <div className="product-container" id="product">
        <div className="product-top">
          <p className="product-title">Our Products </p>
          <img className="product-horizontal-line" src={horizontalLine} />
          <img className="product-line" src={productLine} />
          <p className="product-description">For more than 25 years, Bakerman Bakery has been making America and Indonesia's favorite baked goods the old-fashioned way: from scratch, in small batches, and using the finest ingredients.</p>
        </div>
        <div className="product-bottom">
          <div className="product-bottom-first-row">
            <div className="product-box">
              <ProductBox image={Buns} desc={"Epic Morning Buns"} />
              <ProductBox image={WheatLoaf} desc={"Organic Wheat-Free Loaf"} />
              <ProductBox image={BananaPudding} desc={"Classic Banana Pudding Party Bowl"} />
            </div>
          </div>
        </div>
    </div>
  );
};

export default Product;