import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarFilter from '../../components/SidebarFilter';
import ProductCard from '../../components/ProductCard';
import { getMockProducts, getMockCategories } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, ArrowUpDown, Grid, Check, Search, X } from 'lucide-react';
import { apiUrl } from '../../config';

const AllProductsPage = ({ sharedFilters, setSharedFilters, setSharedProducts }) => {
  const location = useLocation();
  const { useMock } = useAuth();

  // Extract initial search / category from URL query parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialCategory = queryParams.get('category') || '';
  const initialSearch = queryParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variantsList, setVariantsList] = useState([]);

  // Mobile drawer/bottom sheet states
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dynamically compute the highest product price
  const highestPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(...products.map(p => Number(p.special_price || p.price || 0)));
  }, [products]);

  const [localFilters, setLocalFilters] = useState({
    search: initialSearch,
    sortBy: 'recent',
    categories: initialCategory ? [initialCategory] : [],
    maxPrice: 0,
    variants: [],
    onlyOffers: false,
    inStockOnly: false
  });

  const filters = sharedFilters || localFilters;
  const setFilters = setSharedFilters || setLocalFilters;

  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Sync highestPrice once products are loaded
  useEffect(() => {
    if (highestPrice > 0 && !filtersInitialized) {
      setFilters(prev => ({ ...prev, maxPrice: highestPrice }));
      setFiltersInitialized(true);
    }
  }, [highestPrice, filtersInitialized, setFilters]);

  // Sync URL query parameters to filters state when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const searchParam = params.get('search') || '';

    setFilters(prev => ({
      ...prev,
      search: searchParam,
      categories: categoryParam ? [categoryParam] : prev.categories
    }));
  }, [location.search, setFilters]);

  // Fetch / Load data
  useEffect(() => {
    const loadData = async () => {
      if (useMock) {
        const allProducts = getMockProducts().filter(p => p.is_active);
        setProducts(allProducts);
        if (setSharedProducts) setSharedProducts(allProducts);

        const allCategories = getMockCategories().map(c => c.name);
        setCategories(allCategories);

        // Dynamic extraction of unique variants
        const allVariants = new Set();
        allProducts.forEach(p => {
          p.variants?.forEach(v => {
            const parts = v.name.split(':');
            const cleanName = parts.length > 1 ? parts[1].trim() : v.name;
            allVariants.add(cleanName);
          });
        });
        setVariantsList(Array.from(allVariants));
      } else {
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            fetch(`${apiUrl('/api/products')}`),
            fetch(`${apiUrl('/api/categories')}`)
          ]);
          const productsData = await productsRes.json();
          const categoriesData = await categoriesRes.json();
          
          const allProducts = productsData.filter(p => p.is_active);
          setProducts(allProducts);
          if (setSharedProducts) setSharedProducts(allProducts);

          const allCategories = categoriesData.map(c => c.name);
          setCategories(allCategories);

          const allVariants = new Set();
          allProducts.forEach(p => {
            p.variants?.forEach(v => {
              const parts = v.name.split(':');
              const cleanName = parts.length > 1 ? parts[1].trim() : v.name;
              allVariants.add(cleanName);
            });
          });
          setVariantsList(Array.from(allVariants));
        } catch (err) {
          console.error("Error loading products page data:", err);
        }
      }
    };
    loadData();
  }, [useMock, setSharedProducts]);

  const resetFilters = () => {
    setFilters({
      search: '',
      sortBy: 'recent',
      categories: [],
      maxPrice: highestPrice,
      variants: [],
      onlyOffers: false,
      inStockOnly: false
    });
  };

  // Perform client side filtration using useMemo for performance optimization
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Search Query (Matches Product Name, Description, Category Name, Variant Name)
      const searchText = filters.search || '';
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesName = prod.name?.toLowerCase().includes(searchLower) || false;
        const matchesDesc = prod.description?.toLowerCase().includes(searchLower) || false;
        const matchesCat = prod.category?.toLowerCase().includes(searchLower) || false;
        const matchesVariant = prod.variants?.some(v => v.name?.toLowerCase().includes(searchLower)) || false;

        if (!matchesName && !matchesDesc && !matchesCat && !matchesVariant) {
          return false;
        }
      }

      // 2. Categories
      if ((filters.categories || []).length > 0 && !(filters.categories || []).includes(prod.category)) {
        return false;
      }

      // 3. Max Price
      const basePrice = Number(prod.special_price || prod.price || 0);
      if (filters.maxPrice > 0 && basePrice > Number(filters.maxPrice)) {
        return false;
      }

      // 4. Special Offers Only
      if (filters.onlyOffers && (!prod.special_price || Number(prod.special_price) >= Number(prod.price))) {
        return false;
      }

      // 5. In Stock Only
      if (filters.inStockOnly && prod.availability_status === 'out_of_stock') {
        return false;
      }

      // 6. Variants filter list
      if ((filters.variants || []).length > 0) {
        const productHasMatchingVariant = prod.variants?.some(v => 
          filters.variants.some(fv => v.name.toLowerCase().includes(fv.toLowerCase()))
        );
        if (!productHasMatchingVariant) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = Number(a.special_price || a.price || 0);
      const priceB = Number(b.special_price || b.price || 0);

      if (filters.sortBy === 'price_asc') return priceA - priceB;
      if (filters.sortBy === 'price_desc') return priceB - priceA;
      if (filters.sortBy === 'alpha_asc') return a.name.localeCompare(b.name);
      if (filters.sortBy === 'alpha_desc') return b.name.localeCompare(a.name);
      
      // Default 'recent'
      return b.id - a.id;
    });
  }, [products, filters]);

  return (
    <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-8 pb-16 relative">
      
      {/* Desktop Sidebar Filters */}
      <SidebarFilter 
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        variants={variantsList}
        resetFilters={resetFilters}
        highestPrice={highestPrice}
      />

      {/* Mobile Sticky Bar below top navigation */}
      <div className="lg:hidden sticky top-16 z-40 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] grid grid-cols-3 divide-x divide-[var(--border-color)] py-3 text-center font-bold text-xs text-[var(--text-secondary)] shadow-sm select-none">
        <button onClick={() => setMobileSortOpen(true)} className="flex items-center justify-center gap-1.5 active:text-primary transition-colors py-1">
          <ArrowUpDown size={14} className="text-primary" /> Sort
        </button>
        <button onClick={() => setMobileCategoryOpen(true)} className="flex items-center justify-center gap-1.5 active:text-primary transition-colors py-1">
          <Grid size={14} className="text-primary" /> Category
        </button>
        <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center justify-center gap-1.5 active:text-primary transition-colors py-1">
          <SlidersHorizontal size={14} className="text-primary" /> Filters
        </button>
      </div>

      {/* Product Listings Grid */}
      <div className="flex-1 flex flex-col gap-6 px-3 sm:px-0">
        <div className="flex items-center justify-between border-b border-[var(--border-color)]/70 pb-4">
          <h1 className="font-display font-black text-lg sm:text-xl text-[var(--text-primary)]">
            All Products
          </h1>
          <span className="text-xs text-[var(--text-secondary)] font-semibold bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]/50">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl border-dashed">
            <span className="text-3xl mb-2">🔍</span>
            <h3 className="font-display font-black text-sm text-[var(--text-primary)]">No products found</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Try resetting the filters or modifying search criteria.</p>
            <button 
              onClick={resetFilters}
              className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE UX OVERLAYS (BOTTOM SHEETS) ── */}

      {/* 1. Mobile Sort Bottom Sheet */}
      {mobileSortOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] animate-fadeIn" onClick={() => setMobileSortOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] rounded-t-3xl p-6 animate-slideUp max-h-[80vh] overflow-y-auto select-none w-full max-w-md mx-auto">
            <div className="w-12 h-1 bg-[var(--text-tertiary)]/30 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-sm text-[var(--text-primary)]">Sort Products</h3>
              <button onClick={() => setMobileSortOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: 'recent', label: 'Newest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: 'alpha_asc', label: 'Name: A to Z' },
                { value: 'alpha_desc', label: 'Name: Z to A' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: opt.value }));
                    setMobileSortOpen(false);
                  }}
                  className={`w-full text-left py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                    filters.sortBy === opt.value
                      ? 'bg-primary/5 border-primary/20 text-primary'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {opt.label}
                  {filters.sortBy === opt.value && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 2. Mobile Category Bottom Sheet */}
      {mobileCategoryOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] animate-fadeIn" onClick={() => setMobileCategoryOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] rounded-t-3xl p-6 animate-slideUp max-h-[80vh] overflow-y-auto select-none w-full max-w-md mx-auto">
            <div className="w-12 h-1 bg-[var(--text-tertiary)]/30 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-sm text-[var(--text-primary)]">Categories</h3>
              <button
                onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = (filters.categories || []).includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        categories: (prev.categories || []).includes(cat)
                          ? prev.categories.filter(c => c !== cat)
                          : [...(prev.categories || []), cat]
                      }));
                    }}
                    className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-primary/5 border-primary/20 text-primary'
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {cat}
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-[var(--border-color)] bg-white'}`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setMobileCategoryOpen(false)}
              className="w-full mt-5 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              Apply Selection
            </button>
          </div>
        </>
      )}

      {/* 3. Mobile Filters Slide Drawer / Bottom Sheet */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] animate-fadeIn" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] rounded-t-3xl p-6 animate-slideUp max-h-[80vh] overflow-y-auto select-none w-full max-w-md mx-auto">
            <div className="w-12 h-1 bg-[var(--text-tertiary)]/30 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-5 border-b border-[var(--border-color)] pb-3">
              <h3 className="font-display font-black text-sm text-[var(--text-primary)]">Refine Products</h3>
              <button
                onClick={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider"
              >
                Reset All
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Price Slider */}
              {highestPrice > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Max Price</span>
                    <span className="text-xs font-black text-primary">₹{Number(filters.maxPrice).toLocaleString('en-IN')}</span>
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
                  <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] font-bold">
                    <span>₹0</span>
                    <span>₹{Number(highestPrice).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Dynamic Variants list */}
              {variantsList.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Filter by Option</span>
                  <div className="flex flex-wrap gap-1.5">
                    {variantsList.map((v) => {
                      const isSelected = (filters.variants || []).includes(v);
                      return (
                        <button
                          key={v}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              variants: (prev.variants || []).includes(v)
                                ? prev.variants.filter(x => x !== v)
                                : [...(prev.variants || []), v]
                            }));
                          }}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Deals & Status</span>
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Special Offers Only</span>
                  <input
                    type="checkbox"
                    checked={filters.onlyOffers}
                    onChange={() => setFilters(prev => ({ ...prev, onlyOffers: !prev.onlyOffers }))}
                    className="accent-primary w-4.5 h-4.5"
                  />
                </label>
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-primary)]">In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                    className="accent-primary w-4.5 h-4.5"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full mt-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default AllProductsPage;
