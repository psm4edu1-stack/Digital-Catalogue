import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  FolderOpen,
  ArrowRight,
  FolderKanban,
  Pencil,
  X
} from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form input states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Bulk Product selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkChecked, setBulkChecked] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const inCat = products
        .filter(p => p.categories?.some(c => c.id === selectedCategory.id))
        .map(p => p.id);
      setBulkChecked(inCat);
    } else {
      setBulkChecked([]);
    }
  }, [selectedCategory, products]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('name', newCatName);
      formData.append('description', newCatDesc);
      if (newCatImage) {
        formData.append('categoryImage', newCatImage);
      }

      const res = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create category');
      }

      setNewCatName('');
      setNewCatDesc('');
      setNewCatImage(null);
      
      const fileInput = document.getElementById('category-image-input');
      if (fileInput) fileInput.value = '';

      fetchCategories();
      alert('Category created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatDesc(cat.description || '');
    setNewCatImage(null);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const formData = new FormData();
      formData.append('name', newCatName);
      formData.append('description', newCatDesc);
      if (newCatImage) {
        formData.append('categoryImage', newCatImage);
      }

      const res = await fetch(`http://localhost:5000/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update category');
      }

      setEditingCategory(null);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatImage(null);

      const fileInput = document.getElementById('category-image-input');
      if (fileInput) fileInput.value = '';

      fetchCategories();
      fetchProducts();
      alert('Category updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete "${cat.name}"? Products in this category will lose this category reference.`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete category');
      }
      if (selectedCategory?.id === cat.id) {
        setSelectedCategory(null);
      }
      fetchCategories();
      fetchProducts();
      alert('Category deleted successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatImage(null);
    const fileInput = document.getElementById('category-image-input');
    if (fileInput) fileInput.value = '';
  };

  const handleToggleProductChecked = (prodId) => {
    setBulkChecked((prev) => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSaveBulkMapping = async () => {
    if (!selectedCategory) return;

    try {
      const promises = products.map(p => {
        const shouldBeInCat = bulkChecked.includes(p.id);
        const hasCat = p.categories?.some(c => c.id === selectedCategory.id);

        if (shouldBeInCat && !hasCat) {
          const currentCatIds = p.categories ? p.categories.map(c => c.id) : [];
          const newCatIds = [...currentCatIds, selectedCategory.id];
          return fetch(`http://localhost:5000/api/products/${p.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: p.name,
              description: p.description,
              price: p.price,
              special_price: p.special_price,
              offer_percentage: p.offer_percentage,
              image_url: p.image_url,
              availability_status: p.availability_status,
              categoryIds: newCatIds,
              variants: p.variants,
              is_active: p.is_active,
              is_featured: p.is_featured
            })
          });
        } else if (!shouldBeInCat && hasCat) {
          const currentCatIds = p.categories ? p.categories.map(c => c.id) : [];
          const newCatIds = currentCatIds.filter(id => id !== selectedCategory.id);
          return fetch(`http://localhost:5000/api/products/${p.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: p.name,
              description: p.description,
              price: p.price,
              special_price: p.special_price,
              offer_percentage: p.offer_percentage,
              image_url: p.image_url,
              availability_status: p.availability_status,
              categoryIds: newCatIds,
              variants: p.variants,
              is_active: p.is_active,
              is_featured: p.is_featured
            })
          });
        }
        return null;
      }).filter(Boolean);

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        const failed = results.find(r => !r.ok);
        if (failed) throw new Error("Failed to map some products.");
      }
      fetchProducts();
      alert(`Products successfully mapped to "${selectedCategory.name}"!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             p.categories?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
             p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const placeholderImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop&q=80';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <h1 className="font-display font-extrabold text-lg text-[var(--text-primary)]">Category Mapping & Management</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Organize items into departments, and perform bulk-assignments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Categories CRUD (Columns: 5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Create/Edit category Form */}
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="glass-panel p-4 rounded-2xl border-opacity-40 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Plus size={12} /> {editingCategory ? "Edit Category" : "Add New Category"}
            </span>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Acoustics)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short description..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                id="category-image-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setNewCatImage(e.target.files[0])}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {editingCategory ? "Update Category" : "Publish Category"}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)] text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Categories List */}
          <div className="glass-panel p-4 rounded-2xl border-opacity-40 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Available Categories</span>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cat.image_url ? `http://localhost:5000${cat.image_url}` : placeholderImage}
                        alt={cat.name}
                        className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">{cat.name}</span>
                        <span className="text-[9px] text-[var(--text-tertiary)] line-clamp-1">{cat.description || 'Browse products'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(cat);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bulk Products Mappings (Columns: 7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {selectedCategory ? (
            <div className="glass-panel p-5 rounded-3xl border-opacity-40 flex flex-col gap-4 animate-fadeIn">
              
              <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Map Products: <span className="text-primary">{selectedCategory.name}</span>
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">Check products you want to assign to this category, then save.</p>
                </div>
                <button
                  onClick={handleSaveBulkMapping}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1"
                >
                  <Check size={12} /> Save Mapping
                </button>
              </div>

              {/* Search filter inside mapping */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter product list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Products list with checkboxes */}
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const isChecked = bulkChecked.includes(prod.id);
                  const prodImage = prod.image_url ? (prod.image_url.startsWith('http') ? prod.image_url : `http://localhost:5000${prod.image_url}`) : placeholderImage;
                  return (
                    <label
                      key={prod.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-primary/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProductChecked(prod.id)}
                        className="rounded border-[var(--border-color)] text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <img 
                        src={prodImage} 
                        alt={prod.name} 
                        className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)]"
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">{prod.name}</span>
                        <span className="text-[9px] text-[var(--text-tertiary)] truncate">
                          Currently in: <span className="font-semibold text-primary">
                            {prod.categories && prod.categories.length > 0 
                              ? prod.categories.map(c => c.name).join(', ') 
                              : (prod.category || 'General')}
                          </span>
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl border-dashed">
              <FolderKanban size={40} className="text-[var(--text-tertiary)] mb-3" />
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Select a Category</h3>
              <p className="text-xs text-[var(--text-secondary)] text-center max-w-xs mt-1 leading-relaxed">
                Click on one of the categories on the left side to load products and modify their assignments.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default CategoryManagement;
