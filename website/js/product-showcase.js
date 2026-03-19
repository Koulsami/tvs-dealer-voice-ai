// ================================================
// PRODUCT SHOWCASE - Real-time Display
// ================================================

// Socket.IO connection
let socket = null;
let currentShowcaseProduct = null;

// Initialize Socket.IO connection
function initializeSocket() {
  // Connect to the server
  socket = io({
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected to server');

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('tvs_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('tvs_session_id', sessionId);
    }

    // Register the session
    socket.emit('register_session', { session_id: sessionId });
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected from server');
  });

  // Listen for product showcase events
  socket.on('show_product', (data) => {
    console.log('[Socket.IO] Received show_product event:', data);
    if (data.product) {
      showProductShowcase(data.product);
    }
  });

  // Listen for product + section navigation (shows product then navigates to section)
  socket.on('show_product_section', (data) => {
    console.log('[Socket.IO] Received show_product_section event:', data);
    if (data.product) {
      showProductShowcase(data.product);
      if (data.section) {
        // Defer section navigation until modal has rendered
        setTimeout(() => navigateToSection(data.section), 100);
      }
    }
  });

  // Listen for section-only navigation (no product change)
  socket.on('navigate_section', (data) => {
    console.log('[Socket.IO] Received navigate_section event:', data);
    if (data.section) {
      navigateToSection(data.section);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error);
  });
}

// ================================================
// FORMAT HELPERS
// ================================================

// Format price in Indian format (₹ lakh for >= 1 lakh)
function formatPriceIndian(price) {
  if (!price) return 'Price on request';
  const lakh = price / 100000;
  if (lakh >= 1) {
    return '₹' + lakh.toFixed(2) + ' Lakh';
  }
  return '₹' + new Intl.NumberFormat('en-IN').format(price);
}

// Get category Tailwind classes for badge
function getCategoryClasses(category) {
  const map = {
    'Sport': { bg: 'bg-red-100', text: 'text-red-700' },
    'Scooter': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'Commuter': { bg: 'bg-green-100', text: 'text-green-700' },
    'Electric': { bg: 'bg-purple-100', text: 'text-purple-700' }
  };
  return map[category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
}

// ================================================
// TAB SWITCHING
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Socket.IO
  initializeSocket();

  // Tab click handler
  document.querySelectorAll('.showcase-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sectionId = tab.getAttribute('data-section');
      switchTab(sectionId);
    });
  });
});

function switchTab(sectionId) {
  // Update tab buttons
  document.querySelectorAll('.showcase-tab').forEach(t => {
    t.classList.remove('active');
    t.classList.remove('border-red-600', 'text-red-600');
    t.classList.add('border-transparent', 'text-gray-500');
  });

  const activeTab = document.querySelector(`.showcase-tab[data-section="${sectionId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('border-red-600', 'text-red-600');
  }

  // Show/hide sections
  document.querySelectorAll('.showcase-section').forEach(section => {
    section.classList.add('hidden');
  });

  const targetSection = document.querySelector(`.showcase-section[data-section-id="${sectionId}"]`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // Smooth scroll modal content to top
  const modalContent = document.querySelector('.product-showcase-content');
  if (modalContent) {
    modalContent.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ================================================
// NAVIGATE TO SECTION (programmatic)
// ================================================

function navigateToSection(sectionId) {
  switchTab(sectionId);

  const targetSection = document.querySelector(`.showcase-section[data-section-id="${sectionId}"]`);
  if (targetSection) {
    targetSection.classList.add('section-highlight');
    setTimeout(() => {
      targetSection.classList.remove('section-highlight');
    }, 2000);
  }
}

window.navigateToSection = navigateToSection;

// ================================================
// SHOW PRODUCT SHOWCASE
// ================================================

function showProductShowcase(product) {
  currentShowcaseProduct = product;
  const modal = document.getElementById('product-showcase-modal');

  // --- HEADER ---
  document.getElementById('showcase-title').textContent = product.name;

  const categoryEl = document.getElementById('showcase-category');
  const catClasses = getCategoryClasses(product.category);
  categoryEl.textContent = product.category;
  // Reset category classes and apply new ones
  categoryEl.className = 'showcase-category inline-block text-xs font-semibold px-2.5 py-1 rounded-full';
  categoryEl.classList.add(catClasses.bg, catClasses.text);

  // --- OVERVIEW SECTION ---
  // Image
  const imageEl = document.getElementById('showcase-image');
  let imageUrl = product.images?.main;

  // Check preloaded cache
  if (window.productCache?.images) {
    const cachedProduct = window.productCache?.products?.find(p =>
      p.name.toLowerCase() === product.name.toLowerCase()
    );
    if (cachedProduct?.image_url) {
      imageUrl = cachedProduct.image_url;
      console.log('[showProductShowcase] Using preloaded image for:', product.name);
    }
  }

  imageEl.src = imageUrl || 'https://via.placeholder.com/600x400/E31837/FFFFFF?text=' + encodeURIComponent(product.name);
  imageEl.alt = product.name;

  // Price
  document.getElementById('showcase-price').textContent = formatPriceIndian(product.price?.ex_showroom);

  // Quick specs
  const specs = product.specs || {};
  document.getElementById('spec-engine').textContent = specs.engine || specs.motor || '-';
  document.getElementById('spec-power').textContent = specs.power || '-';
  document.getElementById('spec-mileage').textContent = specs.mileage || specs.range || '-';
  document.getElementById('spec-topspeed').textContent = specs.top_speed || '-';

  // EMI
  if (product.emi_starts) {
    document.getElementById('showcase-emi').textContent = '₹' + new Intl.NumberFormat('en-IN').format(product.emi_starts) + '/month';
  }

  // --- PRICING SECTION ---
  populatePricingSection(product);

  // --- SPECIFICATIONS SECTION ---
  populateSpecificationsSection(product);

  // --- COLORS SECTION ---
  populateColorsSection(product);

  // --- FEATURES SECTION ---
  populateFeaturesSection(product);

  // Reset to Overview tab
  switchTab('overview');

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Play notification sound
  playNotificationSound();
}

// ================================================
// SECTION POPULATORS
// ================================================

function populatePricingSection(product) {
  const price = product.price || {};
  const tbody = document.getElementById('showcase-city-prices');

  // Build city price entries from on_road keys
  const cityKeys = [
    { key: 'on_road_bangalore', name: 'Bangalore' },
    { key: 'on_road_mumbai', name: 'Mumbai' },
    { key: 'on_road_delhi', name: 'Delhi' },
    { key: 'on_road_chennai', name: 'Chennai' },
    { key: 'on_road_hyderabad', name: 'Hyderabad' }
  ];

  // Find cheapest city
  let cheapestPrice = Infinity;
  let cheapestKey = '';
  cityKeys.forEach(c => {
    if (price[c.key] && price[c.key] < cheapestPrice) {
      cheapestPrice = price[c.key];
      cheapestKey = c.key;
    }
  });

  // Generate rows
  tbody.innerHTML = cityKeys.map((city, i) => {
    const cityPrice = price[city.key];
    const isCheapest = city.key === cheapestKey;
    const bgClass = isCheapest ? 'bg-green-50' : (i % 2 === 1 ? 'bg-gray-50' : '');
    return `
      <tr class="border-t border-gray-100 ${bgClass}">
        <td class="px-4 py-3 text-gray-800">${city.name}${isCheapest ? ' <span class="text-xs text-green-600 font-medium ml-1">Lowest</span>' : ''}</td>
        <td class="px-4 py-3 text-right font-semibold text-gray-900">${cityPrice ? formatPriceIndian(cityPrice) : '—'}</td>
      </tr>
    `;
  }).join('');

  // Price breakdown
  document.getElementById('showcase-exshowroom-price').textContent = price.ex_showroom ? formatPriceIndian(price.ex_showroom) : '—';
  document.getElementById('showcase-onroad-price').textContent = price.on_road_bangalore ? formatPriceIndian(price.on_road_bangalore) : '—';

  // EMI pricing
  if (product.emi_starts) {
    document.getElementById('showcase-emi-pricing').textContent = '₹' + new Intl.NumberFormat('en-IN').format(product.emi_starts) + '/month';
  }
}

function populateSpecificationsSection(product) {
  const specs = product.specs || {};
  const isElectric = !!(specs.motor || specs.battery || specs.charging_time);

  const specsContainer = document.getElementById('showcase-full-specs');

  // Petrol spec rows
  const petrolSpecs = ['engine', 'mileage', 'fuel_tank', 'transmission'];
  // Electric spec rows
  const electricSpecs = ['motor', 'battery', 'range', 'charging_time'];

  specsContainer.querySelectorAll('.spec-row').forEach(row => {
    const specType = row.getAttribute('data-spec');

    if (isElectric) {
      // Hide petrol-only rows, show electric rows
      if (petrolSpecs.includes(specType)) {
        row.classList.add('hidden');
      } else if (electricSpecs.includes(specType)) {
        row.classList.remove('hidden');
      } else {
        row.classList.remove('hidden'); // shared specs like power, torque, etc.
      }
    } else {
      // Hide electric rows, show petrol rows
      if (electricSpecs.includes(specType)) {
        row.classList.add('hidden');
      } else if (petrolSpecs.includes(specType)) {
        row.classList.remove('hidden');
      } else {
        row.classList.remove('hidden');
      }
    }
  });

  // Populate values - shared specs
  const setSpec = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  };

  setSpec('spec-full-power', specs.power);
  setSpec('spec-full-torque', specs.torque);
  setSpec('spec-full-topspeed', specs.top_speed);
  setSpec('spec-full-weight', specs.weight);
  setSpec('spec-full-seatheight', specs.seat_height);
  setSpec('spec-full-groundclearance', specs.ground_clearance);

  if (isElectric) {
    setSpec('spec-full-motor', specs.motor);
    setSpec('spec-full-battery', specs.battery);
    setSpec('spec-full-range', specs.range);
    setSpec('spec-full-chargingtime', specs.charging_time);
  } else {
    setSpec('spec-full-engine', specs.engine);
    setSpec('spec-full-mileage', specs.mileage);
    setSpec('spec-full-fueltank', specs.fuel_tank);
    setSpec('spec-full-transmission', specs.transmission);
  }
}

function populateColorsSection(product) {
  const container = document.getElementById('showcase-color-swatches');
  if (!product.colors || product.colors.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">No color options available</p>';
    return;
  }

  container.innerHTML = product.colors.map((color, i) => `
    <button class="showcase-color-swatch flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all"
            data-color-index="${i}" onclick="selectColorSwatch(this)">
      <span class="w-12 h-12 rounded-full border-2 border-gray-200 shadow-inner" style="background-color: ${color.hex};"></span>
      <span class="text-xs font-medium text-gray-700">${color.name}</span>
    </button>
  `).join('');
}

function selectColorSwatch(el) {
  // Remove selected state from all
  document.querySelectorAll('.showcase-color-swatch').forEach(s => {
    s.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
  });
  // Add selected state to clicked
  el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
}

function populateFeaturesSection(product) {
  const container = document.getElementById('showcase-feature-cards');
  if (!product.features || product.features.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">No features listed</p>';
    return;
  }

  container.innerHTML = product.features.map(feature => `
    <div class="showcase-feature-card flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
      <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="text-sm text-gray-800">${feature}</span>
    </div>
  `).join('');
}

// ================================================
// EXISTING FUNCTIONS (unchanged)
// ================================================

// Close the product showcase modal
function closeProductShowcase() {
  const modal = document.getElementById('product-showcase-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Book test drive from showcase
function bookTestDriveFromShowcase() {
  if (currentShowcaseProduct) {
    closeProductShowcase();
    // Open Ria with test drive context
    if (typeof openRiaWithContext === 'function') {
      openRiaWithContext('test_drive', currentShowcaseProduct.name, {
        name: currentShowcaseProduct.name,
        category: currentShowcaseProduct.category,
        price: currentShowcaseProduct.price?.ex_showroom
      });
    }
  }
}

// Ask Ria about the showcased product
function askRiaAboutShowcase() {
  if (currentShowcaseProduct) {
    closeProductShowcase();
    // Open Ria with model context
    if (typeof openRiaWithContext === 'function') {
      openRiaWithContext('model', currentShowcaseProduct.name, {
        name: currentShowcaseProduct.name,
        category: currentShowcaseProduct.category,
        price: currentShowcaseProduct.price?.ex_showroom,
        engine: currentShowcaseProduct.specs?.engine,
        mileage: currentShowcaseProduct.specs?.mileage
      });
    }
  }
}

// Play notification sound
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported or blocked
  }
}

// Handle keyboard events
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductShowcase();
  }
});

// Test function - can be called from console
window.testShowcase = function(modelName = 'Apache RTR 200 4V') {
  fetch('/api/show-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName })
  })
  .then(res => res.json())
  .then(data => console.log('Test showcase response:', data))
  .catch(err => console.error('Test showcase error:', err));
};
