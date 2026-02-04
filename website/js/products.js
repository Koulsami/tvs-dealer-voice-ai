// Products page logic

// Global cache for products and preloaded images
window.productCache = {
  products: [],
  images: new Map()
};

// Preload images for instant modal display
function preloadProductImages(products) {
  console.log('[preloadProductImages] Preloading', products.length, 'product images...');
  products.forEach(product => {
    const imageUrl = product.image_url;
    if (imageUrl && !window.productCache.images.has(imageUrl)) {
      const img = new Image();
      img.onload = () => {
        console.log('[preloadProductImages] Cached:', product.name);
      };
      img.onerror = () => {
        console.warn('[preloadProductImages] Failed to cache:', product.name);
      };
      img.src = imageUrl;
      window.productCache.images.set(imageUrl, img);
    }
  });
}

// Get product from cache by name (for modal)
window.getProductByName = function(name) {
  if (!name) return null;
  const nameLower = name.toLowerCase();
  return window.productCache.products.find(p =>
    p.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(p.name.toLowerCase())
  );
};

// Format price in Indian currency format
function formatPrice(price) {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

// Get category badge color
function getCategoryColor(category) {
  const colors = {
    'Sport': 'bg-red-100 text-red-800',
    'Sport Bike': 'bg-red-100 text-red-800',
    'Scooter': 'bg-blue-100 text-blue-800',
    'Commuter': 'bg-green-100 text-green-800',
    'Electric': 'bg-purple-100 text-purple-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

// Get placeholder image based on category
function getPlaceholderImage(category, name) {
  // Real motorcycle images from Unsplash
  const categoryImages = {
    'Sport': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'Sport Bike': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop',
    'Scooter': 'https://images.unsplash.com/photo-1622185135505-2d795003b043?w=400&h=300&fit=crop',
    'Commuter': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop',
    'Electric': 'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=400&h=300&fit=crop'
  };
  return categoryImages[category] || 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=400&h=300&fit=crop';
}

// Create product card HTML
function createProductCard(model) {
  const imageUrl = model.image_url || getPlaceholderImage(model.category);
  const categoryColor = getCategoryColor(model.category);
  const modelData = encodeURIComponent(JSON.stringify({
    name: model.name,
    category: model.category,
    price: model.ex_showroom_price_base,
    engine: model.engine_cc,
    mileage: model.mileage_kmpl
  }));

  return `
    <div class="product-card bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="relative">
        <img src="${imageUrl}" alt="${model.name}" class="w-full h-48 object-cover" onerror="this.src='${getPlaceholderImage(model.category)}'">
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}">
          ${model.category}
        </span>
      </div>
      <div class="p-5">
        <h3 class="text-xl font-bold text-gray-900 mb-2">${model.name}</h3>
        <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
          ${model.engine_cc ? `
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              ${model.engine_cc}cc
            </span>
          ` : ''}
          ${model.mileage_kmpl ? `
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              ${model.mileage_kmpl} kmpl
            </span>
          ` : ''}
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Starting at</p>
            <p class="text-lg font-bold text-tvs-red">${formatPrice(model.ex_showroom_price_base)}</p>
          </div>
          <button onclick="openRiaWithContext('model', '${model.name}', '${modelData}')" class="px-4 py-2 bg-tvs-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Ask Ria
          </button>
        </div>
      </div>
    </div>
  `;
}

// Fetch products from server API (has images)
async function fetchProductsFromServer() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Server API failed');
    const data = await response.json();
    // Store raw data for modal (with full images object)
    window.productCache.rawProducts = data;
    // Transform server data to match expected format
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      engine_cc: p.specs?.engine?.replace(/[^0-9.]/g, '') || null,
      mileage_kmpl: p.specs?.mileage?.replace(/[^0-9]/g, '') || null,
      ex_showroom_price_base: p.price?.ex_showroom || null,
      image_url: p.images?.main || null,
      // Keep full product data for modal reference
      _raw: p
    }));
  } catch (err) {
    console.log('[fetchProductsFromServer] Failed, will use Supabase:', err.message);
    return null;
  }
}

// Render product grid
async function renderProductGrid() {
  console.log('[renderProductGrid] Starting...');
  const container = document.getElementById('product-grid');
  if (!container) {
    console.error('[renderProductGrid] ERROR: product-grid container not found');
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="col-span-full flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-red"></div>
    </div>
  `;

  try {
    // Try server API first (has images), fallback to Supabase
    console.log('[renderProductGrid] Trying server API...');
    let models = await fetchProductsFromServer();

    if (!models || models.length === 0) {
      console.log('[renderProductGrid] Falling back to Supabase...');
      models = await fetchModels();
    }

    console.log('[renderProductGrid] Got models:', models?.length || 0);

    if (!models || models.length === 0) {
      console.warn('[renderProductGrid] No models returned');
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500">No models available at the moment.</p>
          <p class="text-xs text-gray-400 mt-2">Check console for errors (F12)</p>
        </div>
      `;
      return;
    }

    console.log('[renderProductGrid] Rendering', models.length, 'product cards');
    container.innerHTML = models.map(model => createProductCard(model)).join('');

    // Cache products for modal access
    window.productCache.products = models;

    // Preload images for instant modal display
    preloadProductImages(models);

    console.log('[renderProductGrid] Done!');
  } catch (error) {
    console.error('[renderProductGrid] EXCEPTION:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500">Failed to load products. Please refresh the page.</p>
        <p class="text-xs text-gray-400 mt-2">Error: ${error.message}</p>
      </div>
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid();
});
