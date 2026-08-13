import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLikes } from '../context/LikesContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/currency';
import { Heart, ShoppingCart, Percent } from 'lucide-react';
import { mediaUrl } from '../config';

const getImageSrc = (product) => {
  return mediaUrl(product.image_url) || 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=400&q=75';
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { toggleLike, isLiked } = useLikes();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const liked = isLiked(product.id);
  const hasOffer = product.special_price && Number(product.special_price) < Number(product.price);
  const discountPct = product.offer_percentage ||
    (hasOffer ? Math.round(((Number(product.price) - Number(product.special_price)) / Number(product.price)) * 100) : 0);
  const displayPrice = hasOffer ? product.special_price : product.price;
  const isOutOfStock = product.availability_status === 'out_of_stock';

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { alert('Please login to save favourites'); navigate('/login'); return; }
    toggleLike(product.id);
  };

  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { alert('Please login to add to cart'); navigate('/login'); return; }
    if (!isOutOfStock) addToCart(product);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col w-full h-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative"
      aria-label={`View ${product.name}`}
    >
      {/* Image Container with White Background */}
      <div className="w-full h-40 sm:h-44 bg-white overflow-hidden relative shrink-0">
        <img
          src={getImageSrc(product)}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=400&q=75';
          }}
        />

        {/* Promo Discount Badge */}
        {hasOffer && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
            <Percent size={8} className="sm:w-[9px] sm:h-[9px]" strokeWidth={3} />
            {discountPct}% OFF
          </div>
        )}

        {/* Wishlist Button floating over image */}
        <button
          onClick={handleLike}
          className={`absolute top-2.5 right-2.5 p-1.5 sm:p-2 rounded-xl transition-all duration-300 shadow-sm border border-[var(--border-color)] z-10 ${
            liked
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-white/95 text-[var(--text-secondary)] hover:text-rose-500 hover:scale-110'
          }`}
          aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart size={13} className="sm:w-3.5 sm:h-3.5" fill={liked ? 'currentColor' : 'none'} />
        </button>

        {/* Availability Overlays */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] font-bold text-white uppercase bg-black/75 px-3 py-1 rounded-lg tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {product.availability_status === 'pre_order' && (
          <div className="absolute bottom-2.5 left-2.5 text-[8px] font-bold text-white uppercase bg-amber-500 px-2.5 py-1 rounded-lg shadow-sm">
            Pre-order
          </div>
        )}
      </div>

      {/* Card Details Panel */}
      <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between bg-[var(--bg-secondary)] border-t border-[var(--border-color)]/50">
        <div className="flex flex-col gap-1">
          {/* Name */}
          <h3 className="font-display font-bold text-[11px] sm:text-[13px] text-[var(--text-primary)] group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[28px] sm:min-h-[32px]">
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add To Cart Button */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border-color)]/30">
          <div className="flex flex-col">
            <span className={`font-black text-xs sm:text-[15px] ${hasOffer ? 'text-rose-500' : 'text-primary'}`}>
              {formatPrice(displayPrice)}
            </span>
            {hasOffer && (
              <span className="text-[9px] sm:text-xs text-[var(--text-tertiary)] line-through leading-none">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleCart}
            disabled={isOutOfStock}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 ${
              isOutOfStock
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                : 'bg-primary hover:bg-primary-hover text-white hover:scale-105 shadow-sm hover:shadow-md'
            }`}
            aria-label="Add to cart"
          >
            <ShoppingCart size={13} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;