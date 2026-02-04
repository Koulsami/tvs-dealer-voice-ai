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

  socket.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error);
  });
}

// Format price in Indian format
function formatPriceIndian(price) {
  if (!price) return 'Price on request';
  const lakh = price / 100000;
  if (lakh >= 1) {
    return '₹' + lakh.toFixed(2) + ' Lakh';
  }
  return '₹' + new Intl.NumberFormat('en-IN').format(price);
}

// Get category color class
function getCategoryColorClass(category) {
  const colors = {
    'Sport': 'category-sport',
    'Scooter': 'category-scooter',
    'Commuter': 'category-commuter',
    'Electric': 'category-electric'
  };
  return colors[category] || 'category-default';
}

// Show the product showcase modal
function showProductShowcase(product) {
  currentShowcaseProduct = product;
  const modal = document.getElementById('product-showcase-modal');

  // Update category
  const categoryEl = document.getElementById('showcase-category');
  categoryEl.textContent = product.category;
  categoryEl.className = 'showcase-category ' + getCategoryColorClass(product.category);

  // Update title and tagline
  document.getElementById('showcase-title').textContent = product.name;
  document.getElementById('showcase-tagline').textContent = product.tagline || '';

  // Update image
  const imageEl = document.getElementById('showcase-image');
  imageEl.src = product.images?.main || 'https://via.placeholder.com/600x400/E31837/FFFFFF?text=' + encodeURIComponent(product.name);
  imageEl.alt = product.name;

  // Update price
  document.getElementById('showcase-price').textContent = formatPriceIndian(product.price?.ex_showroom);

  // Update colors
  const colorOptionsEl = document.getElementById('color-options');
  if (product.colors && product.colors.length > 0) {
    colorOptionsEl.innerHTML = product.colors.map(color => `
      <div class="color-swatch" style="background-color: ${color.hex}" title="${color.name}">
        <span class="color-tooltip">${color.name}</span>
      </div>
    `).join('');
    document.getElementById('showcase-colors').style.display = 'block';
  } else {
    document.getElementById('showcase-colors').style.display = 'none';
  }

  // Update specs
  const specs = product.specs || {};
  document.getElementById('spec-engine').textContent = specs.engine || specs.motor || '-';
  document.getElementById('spec-power').textContent = specs.power || '-';
  document.getElementById('spec-mileage').textContent = specs.mileage || specs.range || '-';
  document.getElementById('spec-topspeed').textContent = specs.top_speed || '-';

  // Update features
  const featuresEl = document.getElementById('showcase-features');
  if (product.features && product.features.length > 0) {
    featuresEl.innerHTML = product.features.slice(0, 6).map(feature => `
      <li class="feature-item">
        <svg class="feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${feature}
      </li>
    `).join('');
  }

  // Update EMI
  if (product.emi_starts) {
    document.getElementById('showcase-emi').textContent = '₹' + new Intl.NumberFormat('en-IN').format(product.emi_starts) + '/month';
  }

  // Show the modal with animation
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Play a subtle sound notification (optional)
  playNotificationSound();
}

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeSocket();
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
