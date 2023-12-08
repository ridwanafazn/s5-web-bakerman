import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/category.css';

const categories = [
  { name: 'Breads', link: '/category/breads' },
  { name: 'Cakes', link: '/category/cakes' },
  { name: 'Icebox Desserts', link: '/category/icebox-desserts' },
  { name: 'Cookies', link: '/category/cookies' },
  { name: 'Donuts', link: '/category/donuts' },
];

const Category = () => {
  return (
    <div className="category-container">
      <h1>Category</h1>
      <div className="hero-banner">
        {/* Your hero banner content goes here */}
      </div>
      <div className="category-boxes">
        {categories.map((category) => (
          <Link key={category.name} to={category.link} className="category-box">
            {category.name}
          </Link>
        ))}
      </div>
      <Link to="/category/all" className="show-all-products">
        Show All Products
      </Link>
    </div>
  );
};

export default Category;
