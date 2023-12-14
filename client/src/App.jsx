import { Component, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './styles/index.css'

// Component
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Product from './components/Product'
import About from './components/About'
import Footer from './components/Footer'

// Pages
import Mission from './pages/Mission';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import Profile from './pages/Profile';
import Chance from './pages/Chance';
import Category from './pages/Category';

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/signin" element={<>
          <Navbar />
          <Login />
          <Footer />
        </>} />
        <Route path="/signup" element={<>
          <Navbar />
          <Signup />
          <Footer />
        </>} />
        <Route path="/" element={<>
          <Navbar />
          <Hero />
          <Product />
          <About />
          <Footer />
        </>} />
        <Route path="/mission" element={<>
          <Navbar />
          <Mission />
          <Footer />
        </>} />
        <Route path="/chance" element={<>
          <Navbar />
          <Chance />
          <Footer />
        </>} />
        <Route path="/category" element={<>
          <Navbar />
          <Category />
          <Footer />
        </>} />
        <Route path="/account" element={<>
          <Navbar />
          <Profile />
          <Footer />

        </>} />
        
      </Routes>
    </Router>
  );
}

export default App;
