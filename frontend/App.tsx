
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './services/cartContext';
import { WishlistProvider } from './services/wishlistContext';
import { AuthProvider } from './services/authContext';
import { ToastProvider } from './services/toastContext';
import { ToastContainer } from './components/Toast';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Checkout } from './pages/Checkout';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { Services } from './pages/Services';
import { Success } from './pages/Success';
import POS from './pages/POS';
import { ProductPage } from './pages/ProductPage';

import { EmailConfirmation } from './pages/EmailConfirmation';
import { ResetPassword } from './pages/ResetPassword';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <HashRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/services" element={<Services />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/login" element={<Login />} />
                <Route path="/connect/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/connect/reset-password" element={<ResetPassword />} />
                <Route path="/account" element={<Account />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/success" element={<Success />} />
                <Route path="/pos" element={<POS />} />
              </Routes>
            </HashRouter>
            <ToastContainer />
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
