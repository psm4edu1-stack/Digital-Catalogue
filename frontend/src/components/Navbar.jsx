import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLikes } from '../context/LikesContext';
import { Sun, Moon, ShoppingCart, Heart, User, LogOut, Search } from 'lucide-react';

const Navbar = ({ filters, setFilters, categories, highestPrice, resetFilters }) => {
  const { darkMode, toggleDarkMode, brandSettings } = useTheme();
  const { user, admin, logout } = useAuth();
  const { getCartCount } = useCart();
  const { likes } = useLikes();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const cartCount = getCartCount();
  const likesCount = likes.length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleContactClick = () => {
  if (location.pathname !== '/') {
    navigate('/');

    setTimeout(() => {
      document
        .getElementById('contact')
        ?.scrollIntoView({
          behavior: 'smooth'
        });
    }, 500);
  } else {
    document
      .getElementById('contact')
      ?.scrollIntoView({
        behavior: 'smooth'
      });
  }
};

  // Sync search query state from URL search parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setSearchQuery(searchParams.get('search') || '');
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--bg-secondary)] border-b border-[var(--border-color)] shadow-sm select-none">
      {/* ── Top Header Row ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand Logo + Brand Name */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="Home">
          {brandSettings.brandLogo ? (
            <div className="w-9 h-9 rounded-xl bg-white border border-[var(--border-color)] flex items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <img
                src={brandSettings.brandLogo}
                alt={brandSettings.brandName}
                className="w-full h-full object-contain bg-white"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow group-hover:scale-105 transition-transform duration-200">
              {brandSettings.brandName?.charAt(0) || 'E'}
            </div>
          )}
          <span className="font-display font-black text-[13px] sm:text-base text-primary tracking-tight truncate max-w-[90px] sm:max-w-none">
            {brandSettings.brandName}
          </span>
        </Link>

        {/* Center: Search Bar */}
        <form
  onSubmit={handleSearchSubmit}
  className="hidden md:flex flex-1 max-w-md relative mx-2"
>
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, options..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-[var(--text-tertiary)]"
          />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Right: Actions (Wishlist, Cart, Theme, Login/Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Wishlist */}
          {/* Mobile Search */}

          <Link
            to="/likes"
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary transition-all duration-200 relative"
            title="Liked Products"
            aria-label={`Liked products: ${likesCount}`}
          >
            <Heart size={15} />
            {likesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary transition-all duration-200 relative"
            title="Shopping Cart"
            aria-label={`Cart: ${cartCount} items`}
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="hidden sm:flex p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary transition-all duration-200"
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User Profile / Admin Link / Login */}
          {user || admin ? (
            <div className="flex items-center gap-1.5">
              {admin && (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex text-[10px] font-bold px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all duration-200"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
              aria-label="Login"
            >
              <User size={15} />
              <span className="hidden md:inline">Login</span>
            </Link>
          )}
        </div>

      </div>

      {/* ── Bottom Navigation Row ── */}
<div className="hidden md:block border-t border-[var(--border-color)]/70 bg-[var(--bg-secondary)] py-2 px-4">
  <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar">

    {[
      { to: '/', label: 'Home' },
      { to: '/categories', label: 'Categories' },
      { to: '/products', label: 'Products' },
      { to: '/offers', label: 'Offers' },
    ].map(({ to, label }) => {
      const isActive =
        location.pathname === to ||
        (to === '/products' &&
          location.pathname.startsWith('/products') &&
          !location.pathname.includes('/product/'));

      return (
        <Link
          key={to}
          to={to}
          className={`text-xs font-bold uppercase tracking-wider transition-all relative py-1 ${
            isActive
              ? 'text-primary'
              : 'text-[var(--text-secondary)] hover:text-primary'
          }`}
        >
          {label}
          {isActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
          )}
        </Link>
      );
    })}

    <button
      onClick={handleContactClick}
      className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-primary transition-all"
    >
      Contact
    </button>

  </div>
</div>
      {searchModalOpen && (
  <div className="fixed inset-0 z-[9999] bg-black/50 flex items-start justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl p-4 mt-20">
      <form
        onSubmit={(e) => {
          handleSearchSubmit(e);
          setSearchModalOpen(false);
        }}
      >
        <input
          autoFocus
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full border rounded-xl px-4 py-3"
        />

        <button
          type="button"
          onClick={() => setSearchModalOpen(false)}
          className="mt-3 w-full py-2 rounded-xl bg-gray-100"
        >
          Close
        </button>
      </form>
    </div>
  </div>
)}
    </nav>
  );
};

export default Navbar;
