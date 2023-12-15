import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/category.css';

import breadsImage from '../assets/images/category/breads.jpg';
import cakesImage from '../assets/images/category/cakes.webp';
import iceboxImage from '../assets/images/category/icebox.jpg';
import cookiesImage from '../assets/images/category/cookies.jpg';
import donutsImage from '../assets/images/category/donuts.jpg';
import allProductsImage from '../assets/images/category/all.jpg';
import bannerCategory from '../assets/images/category/banner-category.jpg';

const categories = [
  { name: 'Breads', link: '/category/breads', imageSrc: breadsImage },
  { name: 'Cakes', link: '/category/cakes', imageSrc: cakesImage },
  { name: 'Icebox Desserts', link: '/category/icebox-desserts', imageSrc: iceboxImage },
  { name: 'Cookies', link: '/category/cookies', imageSrc: cookiesImage },
  { name: 'Donuts', link: '/category/donuts', imageSrc: donutsImage },
  { name: 'All Products', link: '/all', imageSrc: allProductsImage },
];

const Category = () => {
  return (
    <div className="category-container">
      <div className="hero-banner">
        <img src={bannerCategory} alt="Banner" />
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <Link key={category.name} to={category.link} className="category-item">
            <img src={category.imageSrc} alt={category.name} />
            <p>{category.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Category;
