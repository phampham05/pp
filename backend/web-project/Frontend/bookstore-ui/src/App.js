import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, BookOpen, LogIn, Search } from 'lucide-react';

import Home from './pages/Home';
import BookList from './pages/BookList';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import {
  CartProvider,
  useCartActions,
  useCartState
} from './contexts/CartContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { resolveAvatarUrl, DEFAULT_AVATAR_URL } from './config/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const { cartItemCount } = useCartState();
  const { fetchCart } = useCartActions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // const totalItems = cart?.totalItems || 0;
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (location.pathname === '/books') {
      const params = new URLSearchParams(location.search);
      setSearchInput(params.get('q') || '');
      return;
    }

    setSearchInput('');
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    const keyword = searchInput.trim();

    if (keyword) {
      params.set('q', keyword);
    }

    navigate({
      pathname: '/books',
      search: params.toString() ? `?${params.toString()}` : ''
    });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <BookOpen /> BookStore
          </Link>

          <div className="flex items-center gap-4 lg:hidden">
            <Link to="/books" className="hover:text-blue-600">Sách</Link>
            <Link to="/cart" className="relative p-2 hover:text-blue-600">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-24 outline-none transition focus:border-blue-400 focus:bg-white"
            placeholder="Tìm sách theo tên hoặc tác giả..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-sm text-white transition hover:bg-blue-700"
          >
            Tìm
          </button>
        </form>

        <div className="hidden items-center gap-6 font-medium lg:flex">
          <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
          <Link to="/books" className="hover:text-blue-600">Sách</Link>

          <Link to="/cart" className="relative p-2 hover:text-blue-600">
            <ShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link to="/account" className="group flex items-center gap-2 hover:text-blue-600">
              <img
                src={resolveAvatarUrl(user.avatar)}
                alt="User"
                className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
              />
              <span className="hidden max-w-[100px] truncate xl:block">{user.name}</span>
            </Link>
          ) : (
            <Link to="/login" className="flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700">
              <LogIn size={18} /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <HistoryProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800 font-sans">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/books" element={<BookList />} />
                  <Route path="/book/:id" element={<BookDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Routes>
              </main>

              <ToastContainer
                position="top-right"
                autoClose={2000}
                newestOnTop
              />

              <footer className="mt-auto bg-gray-800 py-8 text-center text-white">
                <p>&copy; 2024 BookStore. All rights reserved.</p>
              </footer>
            </div>
          </Router>
        </CartProvider>
      </HistoryProvider>
    </AuthProvider>
  );
}

export default App;
