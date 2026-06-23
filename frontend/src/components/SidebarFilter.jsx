import React from 'react';
import { SlidersHorizontal, Search, RefreshCw } from 'lucide-react';

const SidebarFilter = ({
  filters = {},
  setFilters,
  categories = [],
  variants = [],
  resetFilters,
  highestPrice = 1000
}) => {

  const safeFilters = {
    search: '',
    sortBy: 'recent',
    categories: [],
    variants: [],
    maxPrice: highestPrice,
    onlyOffers: false,
    inStockOnly: false,
    ...filters
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleCategoryToggle = (categoryName) => {
    setFilters(prev => ({
      ...prev,
      categories: (prev.categories || []).includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...(prev.categories || []), categoryName]
    }));
  };

  const handleVariantToggle = (variantName) => {
    setFilters(prev => ({
      ...prev,
      variants: (prev.variants || []).includes(variantName)
        ? prev.variants.filter(v => v !== variantName)
        : [...(prev.variants || []), variantName]
    }));
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col gap-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-2xl h-fit sticky top-24">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          <h2>Filters</h2>
        </div>

        <button onClick={resetFilters}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={safeFilters.search}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <Search
          size={14}
          className="absolute right-3 top-3"
        />
      </div>

      <select
        value={safeFilters.sortBy}
        onChange={(e) =>
          setFilters(prev => ({
            ...prev,
            sortBy: e.target.value
          }))
        }
        className="border rounded-lg p-2"
      >
        <option value="recent">Recent</option>
        <option value="price_asc">Price Low → High</option>
        <option value="price_desc">Price High → Low</option>
        <option value="alpha_asc">A → Z</option>
        <option value="alpha_desc">Z → A</option>
      </select>

      {categories.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Categories</h3>

          {categories.map(cat => (
            <label
              key={cat}
              className="flex gap-2 text-sm mb-1"
            >
              <input
                type="checkbox"
                checked={(safeFilters.categories || []).includes(cat)}
                onChange={() => handleCategoryToggle(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Variants</h3>

          {variants.map(v => (
            <button
              key={v}
              onClick={() => handleVariantToggle(v)}
              className={`m-1 px-2 py-1 rounded border ${
                (safeFilters.variants || []).includes(v)
                  ? 'bg-blue-500 text-white'
                  : ''
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};

export default SidebarFilter;