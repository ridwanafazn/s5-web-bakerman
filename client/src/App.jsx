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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<>
          <Navbar />
          <Hero />
          <Product />
          <About/>
          <Footer />
        </>} />
        <Route path="/mission" element={<>
          <Navbar />
          <Mission />
          <Footer />
        </>} />
        <Route path="/chance" element={<>
          <Navbar />
          <h1>This is /chance</h1>
          <Footer />
        </>} />
        <Route path="/category" element={<>
          <Navbar />
          <h1>This is /category</h1>
          <Footer />
        </>} />
        <Route path="/account" element={<>
          <Navbar />
          <h1>This is /account</h1>
          <Footer />
        </>} />
        <Route path="/auth/signin" element={<>
          <Navbar />
          <Login/>
          <Footer />
        </>} />
        <Route path="/auth/signup" element={<>
          <Navbar />
          <h1>This is /auth/signup</h1>
          <Footer />
        </>} />
      </Routes>
    </Router>
  );
}

export default App;

