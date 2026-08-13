import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl, mediaUrl } from "../../config";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl('/api/categories')}`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <h1 className="text-3xl font-bold mb-8">
        Explore Categories
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {categories.map((cat) => (
          <Link
  key={cat.id}
  to={`/products?category=${cat.name}`}
  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition"
>
  {cat.image_url && (
    <img
  src={mediaUrl(cat.image_url)}
  alt={cat.name}
  className="w-full aspect-[3/4] object-cover"
/>
  )}

  <div className="p-4 text-center">
    <h2 className="font-bold text-xl">
      {cat.name}
    </h2>

    <p className="text-sm text-gray-500 mt-2">
      Browse Products
    </p>
  </div>
</Link>
        ))}

      </div>

    </div>
  );
};

export default CategoriesPage;