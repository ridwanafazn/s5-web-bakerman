import { useState } from 'react'
//import { Route, Routes } from "react-router-dom";

import './App.css'

import Navbar from './components/navbar/Navbar'
import Hero from './components/hero/Hero'
import Product from './components/product/Product'
import About from './components/about/About'
import Footer from './components/footer/Footer'

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Product />
      <About />
      <Footer/>
    </>
  )
}

export default App

