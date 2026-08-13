import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getMockProducts, getMockCategories } from '../../utils/mockData';
import ProductCard from '../../components/ProductCard';
import { ChevronRight, ShoppingCart, MessageSquare, ShieldCheck, Star, Phone, Mail, Tag, Sparkles } from 'lucide-react';
import { apiUrl, mediaUrl } from '../../config';

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const SectionHeader = ({ title, subtitle, linkTo, linkLabel }) => (
  <div className="flex items-center justify-between mb-4 mt-2">
    <div>
      <h2 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)] leading-tight tracking-tight">{title}</h2>
      {subtitle && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>}
    </div>
    {linkTo && (
      <Link to={linkTo} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline shrink-0 ml-2">
        {linkLabel} <ChevronRight size={14} />
      </Link>
    )}
  </div>
);

const LandingPage = () => {
  const { brandSettings } = useTheme();
  const { useMock } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (useMock) {
        setProducts(getMockProducts().filter(p => p.is_active));
        setCategories(getMockCategories());
      } else {
        try {
          const [pRes, cRes] = await Promise.all([
            fetch(`${apiUrl('/api/products')}`),
            fetch(`${apiUrl('/api/categories')}`),
          ]);
          const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
          setProducts(Array.isArray(pData) ? pData.filter(p => p.is_active) : []);
          setCategories(Array.isArray(cData) ? cData : []);
        } catch (err) {
          console.error('Landing page load error:', err);
        }
      }
      setLoading(false);
    };
    load();
  }, [useMock]);

  // Image display rules helper
  const getCategoryImage = (cat) => {
    if (cat.image_url) {
      return mediaUrl(cat.image_url);
    }
    // Fallback to first matching product image
    const match = products.find(p => p.category === cat.name && p.image_url);
    if (match) {
      return mediaUrl(match.image_url);
    }
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=400&q=75';
  };

  // Featured Products processing
  let featuredProducts = products.filter(p => p.is_featured);
  if (featuredProducts.length === 0) {
    featuredProducts = products.slice(0, 8); // Latest active products limit 8
  } else {
    featuredProducts = featuredProducts.slice(0, 8); // Max 8 products
  }

  // Special Offers processing
  const specialOffers = products
    .filter(p => p.special_price && Number(p.special_price) < Number(p.price))
    .slice(0, 8); // Max 8 products

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-8 animate-fadeIn">

      {/* ── 1. Hero Banner ── */}
      <header className="relative overflow-hidden rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        {brandSettings.brandLogo ? (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-[var(--border-color)] flex items-center justify-center p-2 shadow-sm shrink-0">
            <img
              src={brandSettings.brandLogo}
              alt={brandSettings.brandName}
              className="w-full h-full object-contain mx-auto"
              loading="eager"
            />
          </div>
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-4xl shadow-md shrink-0 select-none">
            {brandSettings.brandName?.charAt(0) || 'E'}
          </div>
        )}

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 justify-center md:justify-start">
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[var(--text-primary)] leading-tight tracking-tight">
              {brandSettings.brandName}
            </h1>
            {brandSettings.tagline && (
              <span className="text-xs sm:text-sm font-bold text-primary tracking-wide">
                {brandSettings.tagline}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {brandSettings.brandDescription}
          </p>
          <div className="flex items-center gap-3 mt-6 justify-center md:justify-start">
            <Link to="/products" className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm hover:shadow-md transition-all">
              Browse Products
            </Link>
            <Link to="/offers" className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all border border-rose-500/20">
              Exclusive Deals
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Categories ── */}
      {categories.length > 0 && (
        <section>
          <SectionHeader title="Explore Categories" subtitle="Browse our curated catalogue lists" linkTo="/categories" linkLabel="View All" />
          
          {/* Mobile: Horizontal scroll | Desktop: Responsive grid */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="snap-start shrink-0 w-[45vw] sm:w-52 lg:w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"              >
                <div className="w-full h-56 bg-white flex items-center justify-center p-3 relative">
  <img
    src={getCategoryImage(cat)}
    alt={cat.name}
    className="w-full h-full object-cover object-top"
    loading="lazy"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src =
        'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=400&q=75';
    }}
  />
</div>
                <h3 className="font-display font-bold text-xs sm:text-[13px] text-[var(--text-primary)] truncate w-full">{cat.name}</h3>
                <span className="text-[10px] text-primary/80 font-bold mt-1 uppercase tracking-wider">Explore →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section>
          <SectionHeader
            title="Featured Collection"
            subtitle="Our boutique's highlighted styles"
          />
          {/* Responsive grid: Desktop = 4 columns, Tablet = 3 columns, Mobile = 2 columns */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-3">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/products" className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 hover:scale-105">
              View All Products <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ── 4. Brand Information ── */}
      <section
  id="contact"
  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden"
>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {brandSettings.brandLogo ? (
                <div className="w-12 h-12 rounded-xl bg-white border border-[var(--border-color)] flex items-center justify-center p-1.5 shadow-sm">
                  <img
                    src={brandSettings.brandLogo}
                    alt={brandSettings.brandName}
                    className="w-full h-full object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {brandSettings.brandName?.charAt(0) || 'E'}
                </div>
              )}
              <div>
                <h3 className="font-display font-black text-base sm:text-lg text-[var(--text-primary)] leading-tight">{brandSettings.brandName}</h3>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{brandSettings.tagline}</span>
              </div>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
              {brandSettings.brandDescription}
            </p>

            {/* Contact Details */}
            <div className="flex flex-col gap-2.5 mt-2">
              {brandSettings.contactInfo?.phone && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-primary"><Phone size={14} /></div>
                  <span>{brandSettings.contactInfo.phone}</span>
                </div>
              )}
              {brandSettings.contactInfo?.instagram && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-rose-500"><InstagramIcon size={14} /></div>
                  <span>{brandSettings.contactInfo.instagram}</span>
                </div>
              )}
              {brandSettings.contactInfo?.email && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-indigo-500"><Mail size={14} /></div>
                  <span>{brandSettings.contactInfo.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* How to Order */}
          <div className="lg:col-span-7 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] pt-6 lg:pt-0 lg:pl-8">
            <h4 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">How to Place Your Order</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                { icon: ShoppingCart, color: 'bg-primary/10 text-primary', step: '1', title: 'Add to Cart', desc: 'Browse our catalog and add items/variants to your cart.' },
                { icon: ShieldCheck, color: 'bg-indigo-500/10 text-indigo-500', step: '2', title: 'Verify Details', desc: 'Open cart, verify items, and proceed to checkout.' },
                { icon: MessageSquare, color: 'bg-emerald-500/10 text-emerald-500', step: '3', title: 'Send to Order', desc: 'Checkout compiles your order to send directly via DM.' },
              ].map(({ icon: Icon, color, step, title, desc }) => (
                <div key={step} className="flex flex-col items-center sm:items-start text-center sm:text-left p-3 bg-[var(--bg-tertiary)] rounded-2xl">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2.5`}>
                    <Icon size={16} />
                  </div>
                  <h5 className="font-display font-bold text-xs text-[var(--text-primary)] mb-1">{step}. {title}</h5>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {brandSettings.howToOrder && (
              <div className="mt-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] border-dashed text-center sm:text-left">
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider block mb-1">Merchant Instructions</span>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                  "{brandSettings.howToOrder}"
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
