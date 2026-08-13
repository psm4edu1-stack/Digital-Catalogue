import React, { useState, useEffect } from 'react';
import { getMockAnalytics } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { apiUrl, mediaUrl } from '../../config';
import { 
  BarChart3, Eye, Heart, ShoppingBag, Flame, TrendingUp, 
  MessageSquare, AlertCircle, Sparkles, HelpCircle, ShoppingCart 
} from 'lucide-react';

const AnalyticsPage = () => {
  const { useMock } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    if (useMock) {
      setAnalytics(getMockAnalytics());
      setLoading(false);
    } else {
      try {
        const res = await fetch(`${apiUrl('/api/analytics')}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
        setAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load live stats.');
        // Fallback to mock on error
        setAnalytics(getMockAnalytics());
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [useMock]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Pre-calculate sections based on productStats
  const productStats = analytics?.productStats || [];

  // 1. Best Selling (sorted by sales desc)
  const bestSelling = [...productStats].sort((a, b) => b.sales - a.sales).slice(0, 5);

  // 2. Most Viewed (sorted by views desc)
  const mostViewed = [...productStats].sort((a, b) => b.views - a.views).slice(0, 5);

  // 3. Most Liked (sorted by likes desc)
  const mostLiked = [...productStats].sort((a, b) => b.likes - a.likes).slice(0, 5);

  // 4. Most Enquired (sorted by enquiries desc)
  const mostEnquired = [...productStats].sort((a, b) => (b.enquiries || 0) - (a.enquiries || 0)).slice(0, 5);

  // 5. Liked but not added to cart
  const likedNotInCart = analytics?.likedNotInCart || [];

  // 6. Cart Abandonment Products
  const cartAbandonment = analytics?.cartAbandonment || [];

  // 7. Featured Product Performance
  const featuredPerformance = productStats.filter(p => p.is_featured);

  return (
    <div className="flex flex-col gap-6 pb-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="font-display font-extrabold text-lg text-[var(--text-primary)]">Storefront Performance Analytics</h1>
          <p className="text-xs text-[var(--text-secondary)]">
  {productStats.length} products tracked
</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Observe catalog interaction, bookmarking counts, and product viral indices.</p>
        </div>
        {error && (
          <span className="text-[10px] bg-rose-500/10 text-rose-500 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
            <AlertCircle size={10} /> Running in Fallback Mode
          </span>
        )}
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        <div className="glass-panel p-4 rounded-2xl border-opacity-30 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Eye size={20} />
          </div>
          <div>
  <p className="text-xs">TOTAL VIEWS</p>
  <p className="text-3xl font-bold">
    {analytics?.views || 0}
  </p>
</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-opacity-30 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <Heart size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Favorites</span>
            <span className="text-base sm:text-lg font-black text-[var(--text-primary)] mt-0.5 block">{analytics.likes} bookmarks</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-opacity-30 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Total Enquiries</span>
            <span className="text-base sm:text-lg font-black text-[var(--text-primary)] mt-0.5 block">{analytics.enquiries || 0} enquiries</span>
          </div>
        </div>

      </div>

      {/* Row 1: Best Selling & Most Viewed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Most Viewed */}
        <div className="glass-panel p-5 rounded-2xl border-opacity-35 flex flex-col gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <Eye size={14} className="text-blue-500" /> Most Viewed Products
          </span>
          <div className="flex flex-col gap-3">
            {mostViewed.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <span className="font-extrabold text-[var(--text-tertiary)] w-4 text-center">{i + 1}</span>
                <img
  src={
    mediaUrl(p.image_url) ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  }
  alt={p.name}
  className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]"
  onError={(e) => {
    e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200';
  }}
/>
                <span className="font-semibold text-[var(--text-primary)] flex-1 truncate">{p.name}</span>
                <span className="font-bold text-blue-500">{p.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Most Liked & Most Enquired */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 3. Most Liked */}
        <div className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-all duration-300 border-opacity-35 flex flex-col gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <Heart size={14} className="text-rose-500" fill="currentColor" /> Most Liked Products
          </span>
          <div className="flex flex-col gap-3">
            {mostLiked.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <span className="font-extrabold text-[var(--text-tertiary)] w-4 text-center">{i + 1}</span>
                <img
  src={
    mediaUrl(p.image_url) ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  }
  alt={p.name}
  className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]"
  onError={(e) => {
    e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200';
  }}
/>
                <span className="font-semibold text-[var(--text-primary)] flex-1 truncate">{p.name}</span>
                <span className="font-bold text-rose-500">{p.likes} likes</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Most Enquired */}
        <div className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-all duration-300 border-opacity-35 flex flex-col gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <MessageSquare size={14} className="text-purple-500" /> Most Enquired Products
          </span>
          <div className="flex flex-col gap-3">
            {mostEnquired.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <span className="font-extrabold text-[var(--text-tertiary)] w-4 text-center">{i + 1}</span>
                <img
  src={
    mediaUrl(p.image_url) ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  }
  alt={p.name}
  className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]"
  onError={(e) => {
    e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200';
  }}
/>
                <span className="font-semibold text-[var(--text-primary)] flex-1 truncate">{p.name}</span>
                <span className="font-bold text-purple-500">{p.enquiries || 0} enquiries</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Liked But Not Added To Cart */}
      <div className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-all duration-300 border-opacity-35 flex flex-col gap-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
          <Heart size={14} className="text-rose-500" /> Liked But Not Added To Cart
        </span>
        {likedNotInCart.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Liked By</th>
                  <th className="p-3">In Cart By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {likedNotInCart.map(row => (
                  <tr key={row.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="p-3 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <img
  src={
    mediaUrl(row.image_url) ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  }
  alt={row.name}
  className="w-6 h-6 rounded object-cover border border-[var(--border-color)]"
  onError={(e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200';
  }}
/>
                      {row.name}
                    </td>
                    <td className="p-3 font-bold text-rose-500">{row.liked_by} customers</td>
                    <td className="p-3 font-medium text-[var(--text-secondary)]">{row.in_cart_by} customers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4">No data matches this behavioral criteria.</p>
        )}
      </div>

      {/* Row 4: Cart Abandonment Products */}
      <div className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-all duration-300 border-opacity-35 flex flex-col gap-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
          <ShoppingCart size={14} className="text-amber-500" /> Cart Abandonment Products
        </span>
        {cartAbandonment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Added to Cart</th>
                  <th className="p-3">Sales / Conversions</th>
                  <th className="p-3">Abandonment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {cartAbandonment.map(row => (
                  <tr key={row.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="p-3 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <img
  src={
    mediaUrl(row.image_url) ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  }
  alt={row.name}
  className="w-6 h-6 rounded object-cover border border-[var(--border-color)]"
  onError={(e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200';
  }}
/>
                      {row.name}
                    </td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{row.cart_adds} adds</td>
                    <td className="p-3 font-medium text-[var(--text-secondary)]">{row.sales} sales</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.abandonment_rate > 50 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {row.abandonment_rate}% Rate
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4">No data matches this behavioral criteria.</p>
        )}
      </div>

      {/* Row 5: Featured Product Performance */}
      <div className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-all duration-300 border-opacity-35 flex flex-col gap-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
          <Sparkles size={14} className="text-amber-500" /> Featured Product Performance Breakdown
        </span>
        {featuredPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                  <th className="p-3">Catalogue Item</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Bookmarks</th>
                  <th className="p-3">Enquiries</th>
                  <th className="p-3">Virality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {featuredPerformance.map(stat => (
                  <tr key={stat.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="p-3 font-semibold text-[var(--text-primary)]">{stat.name}</td>
                    <td className="p-3 font-medium text-[var(--text-secondary)]">{stat.views}</td>
                    <td className="p-3 font-bold text-rose-500">{stat.likes}</td>
                    <td className="p-3 font-semibold text-purple-500">{stat.enquiries || 0}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[var(--bg-tertiary)] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-1.5 rounded-full" 
                            style={{ width: `${stat.virality}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-[10px] text-[var(--text-secondary)]">{stat.virality}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4">No products currently flagged as featured.</p>
        )}
      </div>

    </div>
  );
};

export default AnalyticsPage;