import React, { useEffect, useRef } from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';

const FilterDrawer = ({
  open,
  onClose,
  filters,
  setFilters,
  categories,
  highestPrice,
  resetFilters,
}) => {
  const searchInputRef = useRef(null);

  // Lock body scroll when drawer is open and focus search input
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Smooth focus after transition completes
      const timer = setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 320);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  const handleCategoryToggle = (catName) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(catName)
        ? prev.categories.filter(c => c !== catName)
        : [...prev.categories, catName]
    }));
  };

  const activeFilterCount = [
    filters.search,
    filters.categories.length > 0,
    filters.maxPrice > 0 && filters.maxPrice < highestPrice,
    filters.onlyOffers,
    filters.inStockOnly,
  ].filter(Boolean).length;

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close filter drawer"
      />

      {/* Drawer */}
      <aside 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[320px] sm:max-w-[360px] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] overflow-y-auto pb-24 shadow-2xl transition-transform duration-300 ease-in-out z-10 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="complementary"
        aria-label="Filters"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-secondary)] z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary" />
            <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">
              Filters & Search
            </h2>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-4">

          {/* Search */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Search
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isActive = filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        isActive
                          ? 'bg-primary text-white border-primary'
                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-primary/40'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Filter */}
          {highestPrice > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Max Price
                </label>
                <span className="text-xs font-bold text-primary">
                  ₹{Number(filters.maxPrice).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={highestPrice}
                step={Math.max(1, Math.round(highestPrice / 100))}
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[9px] text-[var(--text-tertiary)]">
                <span>₹0</span>
                <span>₹{Number(highestPrice).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Offer Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Offers & Availability
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-[var(--border-color)] hover:border-primary/30 transition-colors">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={filters.onlyOffers}
                  onChange={() => setFilters(prev => ({ ...prev, onlyOffers: !prev.onlyOffers }))}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[var(--bg-tertiary)] rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Special Offers Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-[var(--border-color)] hover:border-primary/30 transition-colors">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[var(--bg-tertiary)] rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">In Stock Only</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="recent">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="alpha_asc">A → Z</option>
              <option value="alpha_desc">Z → A</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { resetFilters(); }}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold hover:bg-[var(--bg-tertiary)] transition-all"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all"
            >
              Apply Filters
            </button>
          </div>

        </div>
      </aside>
    </div>
  );
};

export default FilterDrawer;
