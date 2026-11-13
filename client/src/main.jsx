import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import './styles/index.css';
import './styles/phase2.css';
import './styles/phase4.css';
import './styles/phase5.css';
import './styles/phase7.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </SessionProvider>
  </React.StrictMode>
);
