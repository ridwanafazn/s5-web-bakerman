import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './App.css'

import Navbar from './components/navbar/Navbar'
import Hero from './components/hero/Hero'
import Product from './components/product/Product'
import About from './components/about/About'
import Footer from './components/footer/Footer'

// import SignIn from './components/auth/SignIn';
// import SignUp from './components/auth/SignUp';
// import Mission from './components/mission/Mission';
// import Chance from './components/chance/Chance';
// import Products from './components/products/Products';
// import Account from './components/account/Account';
// import Category from './components/category/Category';
// import SpecificCategory from './components/category/SpecificCategory';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<><Navbar /><Hero /><Product /><About /><Footer /></>} />
//         <Route path="/signin" element={<SignIn />} />
//         <Route path="/signup" element={<SignUp />} />
//         <Route path="/mission" element={<Mission />} />
//         <Route path="/chance" element={<Chance />} />
//         <Route path="/products" element={<Products />} />
//         <Route path="/account" element={<Account />} />
//         <Route path="/category" element={<Category />} />
//         <Route path="/category/:categoryId" element={<SpecificCategory />} />
//       </Routes>
//     </Router>
//   );
// }

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

export default App;

