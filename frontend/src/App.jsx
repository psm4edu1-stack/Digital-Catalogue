import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

// User Pages
import LandingPage from './pages/user/LandingPage';
import AllProductsPage from './pages/user/AllProductsPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import SpecialOffersPage from './pages/user/SpecialOffersPage';
import LikedProductsPage from './pages/user/LikedProductsPage';
import CartPage from './pages/user/CartPage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import OfferManagement from './pages/admin/OfferManagement';
import SettingsPage from './pages/admin/SettingsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import CategoriesPage from './pages/user/CategoriesPage';

/**
 * UserLayout — wraps all user-facing pages
 * Passes filter state down to Navbar so the hamburger drawer can
 * control filters on product pages.
 */
const UserLayout = ({ children }) => {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'recent',
    categories: [],
    maxPrice: 0,
    onlyOffers: false,
    inStockOnly: false,
  });
  const [allProducts, setAllProducts] = useState([]);

  const highestPrice = useMemo(() => {
    if (!allProducts.length) return 0;
    return Math.max(...allProducts.map(p => Number(p.special_price || p.price || 0)));
  }, [allProducts]);

  const categories = useMemo(() =>
    [...new Set(allProducts.map(p => p.category).filter(Boolean))],
    [allProducts]
  );

  const resetFilters = () => setFilters({
    search: '',
    sortBy: 'recent',
    categories: [],
    maxPrice: highestPrice,
    onlyOffers: false,
    inStockOnly: false,
  });

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      <Navbar
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        highestPrice={highestPrice}
        resetFilters={resetFilters}
      />
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-4 lg:px-6 pt-4 pb-4 has-bottom-nav">
        {/* Inject filter state and product list setter for pages that need them */}
        {React.isValidElement(children)
          ? React.cloneElement(children, { sharedFilters: filters, setSharedFilters: setFilters, setSharedProducts: setAllProducts })
          : children}
      </main>
      <footer className="hidden lg:block py-5 text-center border-t border-[var(--border-color)] border-dashed text-[10px] text-[var(--text-tertiary)] select-none">
        © {new Date().getFullYear()} Digital Catalogue Platform. Powered by Antigravity.
      </footer>
      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* User routes */}
        <Route path="/" element={<UserLayout><LandingPage /></UserLayout>} />
        <Route path="/products" element={<UserLayout><AllProductsPage /></UserLayout>} />
        <Route path="/categories" element={<UserLayout><CategoriesPage /></UserLayout>} />
        <Route path="/product/:id" element={<UserLayout><ProductDetailPage /></UserLayout>} />
        <Route path="/offers" element={<UserLayout><SpecialOffersPage /></UserLayout>} />
        <Route path="/likes" element={<UserLayout><LikedProductsPage /></UserLayout>} />
        <Route path="/cart" element={<UserLayout><CartPage /></UserLayout>} />
        <Route path="/login" element={<UserLayout><LoginPage /></UserLayout>} />
        <Route path="/register" element={<UserLayout><RegisterPage /></UserLayout>} />
        <Route path="/admin/register" element={<UserLayout><AdminRegisterPage /></UserLayout>} />

        {/* Admin layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="offers" element={<OfferManagement />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <UserLayout>
            <div className="text-center py-20">
              <span className="text-4xl">⚠️</span>
              <h2 className="font-display font-extrabold text-base mt-3 text-[var(--text-primary)]">Page Not Found</h2>
              <Link to="/" className="mt-4 text-xs font-bold text-primary hover:underline block">Return to home</Link>
            </div>
          </UserLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
