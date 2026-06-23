import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLikes } from '../../context/LikesContext';
import { getMockProducts } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import ProductCard from '../../components/ProductCard';
import { Heart, ShoppingCart, ArrowLeft, Percent, PackageOpen, Award, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleLike, isLiked, getLikesCount } = useLikes();
  const { useMock, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Swipe Gestures for image gallery
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd > 50) {
      handleNextImage(); // Swiped left
    }
    if (touchStart - touchEnd < -50) {
      handlePrevImage(); // Swiped right
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    if (useMock) {
      const allProducts = getMockProducts();
      const foundProduct = allProducts.find(p => p.id === Number(id));
      
      if (foundProduct) {
        setProduct(foundProduct);
        setActiveImageIdx(0);
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedVariant(foundProduct.variants[0]);
        } else {
          setSelectedVariant(null);
        }

        // Same category only, exclude current product, maximum 8 products
        const similar = allProducts.filter(
          p => p.category === foundProduct.category && p.id !== foundProduct.id && p.is_active
        ).slice(0, 8);
        setSimilarProducts(similar);
      } else {
        navigate('/products');
      }
    } else {
      const loadProduct = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/products');
          const allProducts = await res.json();
          const foundProduct = allProducts.find(p => p.id === Number(id));
          
          if (foundProduct) {
            setProduct(foundProduct);
            setActiveImageIdx(0);
            if (foundProduct.variants && foundProduct.variants.length > 0) {
              setSelectedVariant(foundProduct.variants[0]);
            } else {
              setSelectedVariant(null);
            }

            const similar = allProducts.filter(
              p => p.category === foundProduct.category && p.id !== foundProduct.id && p.is_active
            ).slice(0, 8);
            setSimilarProducts(similar);
          } else {
            navigate('/products');
          }
        } catch (err) {
          console.error("Error loading product detail page:", err);
          navigate('/products');
        }
      };
      loadProduct();
    }
  }, [id, navigate, useMock]);

  // View tracking
  useEffect(() => {
    if (!useMock && product) {
      fetch(`http://localhost:5000/api/products/${product.id}/view`, {
        method: 'POST'
      }).catch(err => console.error("Error tracking view:", err));
    }
  }, [product, useMock]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const liked = isLiked(product.id);
  const likesCount = getLikesCount(product);
  
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const specPrice = selectedVariant ? selectedVariant.special_price : product.special_price;
  const hasOffer = specPrice && Number(specPrice) < Number(basePrice);
  const currentPrice = hasOffer ? specPrice : basePrice;
  const availability = selectedVariant ? (selectedVariant.availability_status || 'in_stock') : product.availability_status;

  const discountPercentage = product.offer_percentage || (hasOffer 
    ? Math.round(((Number(basePrice) - Number(specPrice)) / Number(basePrice)) * 100)
    : 0);

  // Carousel images
  const images = Array.from(new Set([
    product.image_url, 
    ...(product.variants || []).map(v => v.image_url).filter(Boolean)
  ].filter(Boolean)));

  const handleVariantSelect = (v) => {
    setSelectedVariant(v);
    if (v.image_url) {
      const idx = images.indexOf(v.image_url);
      if (idx !== -1) {
        setActiveImageIdx(idx);
      }
    }
  };

  const handleNextImage = () => {
    setActiveImageIdx(prev => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIdx(prev => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(product, selectedVariant, quantity);
  };

  const handleToggleLike = () => {
    if (!user) {
      alert('Please login to add products to favourites');
      navigate('/login');
      return;
    }
    toggleLike(product.id);
  };

  const handleWhatsAppEnquiry = () => {
    if (!useMock) {
      fetch(`http://localhost:5000/api/products/${product.id}/enquiry`, {
        method: 'POST'
      }).catch(err => console.error("Error tracking enquiry:", err));
    }

    const message = encodeURIComponent(`Hi! I am interested in this product from your catalogue:\n*${product.name}*\nPrice: ${formatPrice(currentPrice)}\nVariants: ${selectedVariant ? selectedVariant.name : 'None'}\nLink: ${window.location.href}`);
    
    const savedSettings = localStorage.getItem('brandSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    const phone = settings.contactInfo?.phone || '';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      alert("WhatsApp Enquiry failed: Merchant contact number is not configured.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full flex flex-col gap-6 pb-16 px-3 sm:px-6">
      
      {/* Back button */}
      <div>
        <Link 
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-primary transition-colors font-bold"
        >
          <ArrowLeft size={14} />
          Back to Catalogue
        </Link>
      </div>

      {/* Main Grid: Left Side 70%, Right Side 30% on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* LEFT SIDE (70% - lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Card Wrapper for Image & Product Actions */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl flex flex-col md:flex-row gap-6 shadow-sm">
            
            {/* 1. Product Image Gallery */}
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <div 
                className="relative aspect-square w-full rounded-2xl bg-white overflow-hidden border border-[var(--border-color)] flex items-center justify-center p-3 select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <img
                    src={
                      images[activeImageIdx]?.startsWith('http')
                        ? images[activeImageIdx]
                        : `http://localhost:5000${images[activeImageIdx]}`
                    }
                    alt={`${product.name} preview ${activeImageIdx + 1}`}
                    className="w-full h-full object-contain bg-white transition-all duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=600&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)] bg-white">No image available</div>
                )}
                
                {hasOffer && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Percent size={10} />
                    {discountPercentage}% OFF
                  </div>
                )}

                {/* Left/Right carousel controllers */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-850 shadow-sm hover:bg-white transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-850 shadow-sm hover:bg-white transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Dots and thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-10 h-10 rounded-xl bg-white border overflow-hidden p-0.5 transition-all ${
                        activeImageIdx === idx ? 'border-primary ring-2 ring-primary/25' : 'border-[var(--border-color)]'
                      }`}
                    >
                      <img
                        src={img?.startsWith('http') ? img : `http://localhost:5000${img}`}
                        alt="Thumbnail"
                        className="w-full h-full object-contain bg-white"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=100&q=70';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Actions Column */}
            <div className="w-full md:w-1/2 flex flex-col justify-between">
              
              <div>
                {/* 2. Product Information */}
                <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest mb-1.5 block">
                  {product.category || 'General'}
                </span>

                <h1 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)] leading-tight mb-2 tracking-tight">
                  {product.name}
                </h1>

                {/* Bookmark/Like toggle button */}
                <div className="flex items-center gap-2.5 mb-4">
                  <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      liked 
                        ? 'bg-rose-50 border-rose-100 text-rose-500' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-500'
                    }`}
                  >
                    <Heart size={12} fill={liked ? "currentColor" : "none"} />
                    {liked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-bold">
                    {likesCount} users bookmarked this
                  </span>
                </div>

                {/* 3. Price Block */}
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] mb-4">
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Pricing Options</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-primary">
                      {formatPrice(currentPrice)}
                    </span>
                    {hasOffer && (
                      <span className="text-xs text-[var(--text-tertiary)] line-through font-bold">
                        {formatPrice(basePrice)}
                      </span>
                    )}
                  </div>
                  {hasOffer && (
                    <span className="text-[10px] text-rose-500 font-extrabold block mt-1 uppercase tracking-wider">
                      Promo price applied (Save {formatPrice(Number(basePrice) - Number(specPrice))})
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    availability === 'in_stock' 
                      ? 'bg-emerald-500 animate-pulse' 
                      : availability === 'pre_order' 
                        ? 'bg-amber-500 animate-pulse' 
                        : 'bg-rose-500'
                  }`}></div>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {availability ? availability.replace('_', ' ') : 'Out of Stock'}
                  </span>
                </div>

                {/* 4. Variant Selector */}
                {product.variants && product.variants.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Select Variant Options</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => handleVariantSelect(v)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-sm' 
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-primary/45'
                            }`}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 5, 6, 7. Quantity Selector, Add to Cart, & WhatsApp Enquiry */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-[var(--border-color)]/50 border-dashed">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Quantity Selector */}
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between sm:justify-start rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-1 shrink-0">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] hover:text-primary transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-[var(--text-primary)]">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] hover:text-primary transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={availability === 'out_of_stock'}
                    className="w-full sm:flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </div>

                {/* WhatsApp Enquiry */}
                <button
                  onClick={handleWhatsAppEnquiry}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
                >
                  <MessageSquare size={14} />
                  Enquire via WhatsApp
                </button>
              </div>

            </div>
          </div>

          {/* 8. Description & Specs */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm">
            <h2 className="font-display font-black text-sm text-[var(--text-primary)] border-b border-[var(--border-color)]/70 pb-2.5 mb-4">
              Description & Specifications
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-medium">
              {product.description || 'No descriptive information available for this catalogue item.'}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[var(--border-color)]/50 border-dashed">
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] font-semibold">
                <Award size={14} className="text-primary shrink-0" />
                <span>100% Quality Inspected</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] font-semibold">
                <PackageOpen size={14} className="text-primary shrink-0" />
                <span>Express Catalogue Compilation</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE / BOTTOM (30% - lg:col-span-3 - Similar Products) */}
        {/* Desktop = 30% with vertical scroll. Mobile = full width with 2 cards per row */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="pb-3 border-b border-[var(--border-color)]/70">
            <h2 className="font-display font-black text-sm text-[var(--text-primary)]">
              Similar Products
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-semibold uppercase tracking-wider text-primary">Category: {product.category}</p>
          </div>

          {similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:max-h-[700px] lg:overflow-y-auto no-scrollbar lg:pr-1">
              {similarProducts.map((prod) => (
                <div key={prod.id} className="w-full">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl border-dashed">
              <span className="text-2xl mb-1">🎁</span>
              <h3 className="font-display font-bold text-xs text-[var(--text-primary)]">Exclusive Item</h3>
              <p className="text-[10px] text-[var(--text-secondary)] text-center mt-1 px-4 leading-relaxed">
                This is a unique product in its category.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductDetailPage;
