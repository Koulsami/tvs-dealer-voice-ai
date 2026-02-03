// Products page logic

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
function getPlaceholderImage(category) {
  const images = {
    'Sport': 'https://via.placeholder.com/400x300/E31837/FFFFFF?text=Sport+Bike',
    'Sport Bike': 'https://via.placeholder.com/400x300/E31837/FFFFFF?text=Sport+Bike',
    'Scooter': 'https://via.placeholder.com/400x300/1E40AF/FFFFFF?text=Scooter',
    'Commuter': 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Commuter',
    'Electric': 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Electric'
  };
  return images[category] || 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=TVS';
}

// Create product card HTML
function createProductCard(model) {
  const imageUrl = model.image_url || getPlaceholderImage(model.category);
  const categoryColor = getCategoryColor(model.category);

  return `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
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
          <button onclick="askAboutModel('${model.name}')" class="px-4 py-2 bg-tvs-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            Ask Ria
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render product grid
async function renderProductGrid() {
  const container = document.getElementById('product-grid');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="col-span-full flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-red"></div>
    </div>
  `;

  try {
    const models = await fetchModels();

    if (models.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500">No models available at the moment.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = models.map(model => createProductCard(model)).join('');
  } catch (error) {
    console.error('Error rendering products:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500">Failed to load products. Please refresh the page.</p>
      </div>
    `;
  }
}

// Ask Ria about a specific model
function askAboutModel(modelName) {
  // Start voice call and the user can ask about the model
  if (typeof toggleVoiceCall === 'function') {
    toggleVoiceCall();
    showToast(`Ask Ria about the ${modelName}!`, 'info');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid();
});
