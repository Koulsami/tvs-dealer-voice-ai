// Admin Panel Logic

// Current active tab
let activeTab = 'promotions';

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Format datetime for display
function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format price
function formatPrice(price) {
  if (!price) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

// Show toast notification
function showAdminToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${bgColor} z-50 transform transition-all duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Switch tab
function switchTab(tab) {
  activeTab = tab;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-tvs-red', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-700');
  });
  document.getElementById(`tab-${tab}`).classList.remove('bg-gray-100', 'text-gray-700');
  document.getElementById(`tab-${tab}`).classList.add('bg-tvs-red', 'text-white');

  // Load tab content
  loadTabContent(tab);
}

// Load tab content
async function loadTabContent(tab) {
  const container = document.getElementById('table-container');
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-red"></div>
    </div>
  `;

  switch (tab) {
    case 'promotions':
      await renderPromotionsTable();
      break;
    case 'pricing':
      await renderPricingTable();
      break;
    case 'inventory':
      await renderInventoryTable();
      break;
    case 'testdrives':
      await renderTestDrivesTable();
      break;
    case 'callbacks':
      await renderCallbacksTable();
      break;
    case 'models':
      await renderModelsTable();
      break;
    case 'showrooms':
      await renderShowroomsTable();
      break;
  }
}

// ============ PROMOTIONS ============
async function renderPromotionsTable() {
  const container = document.getElementById('table-container');
  const promotions = await fetchPromotions();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Promotions</h2>
      <button onclick="showAddPromotionModal()" class="px-4 py-2 bg-tvs-red text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Promotion
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short Message</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${promotions.length === 0 ? `
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                No promotions yet. Add one to see it in the voice AI!
              </td>
            </tr>
          ` : promotions.map(p => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${p.name || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${p.short_message || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatPrice(p.discount_amount)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(p.valid_until)}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="togglePromotionStatus('${p.id}', ${!p.is_active})" class="px-3 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                  ${p.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="editPromotion('${p.id}')" class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                <button onclick="confirmDeletePromotion('${p.id}')" class="text-red-600 hover:text-red-800">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Show add promotion modal
function showAddPromotionModal(promotion = null) {
  const isEdit = promotion !== null;
  const modal = document.createElement('div');
  modal.id = 'promotion-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
      <h3 class="text-xl font-bold text-gray-900 mb-4">${isEdit ? 'Edit' : 'Add New'} Promotion</h3>
      <form id="promotion-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" name="name" value="${promotion?.name || ''}" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent"
            placeholder="e.g., Festival Sale">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Short Message (for voice AI)</label>
          <input type="text" name="short_message" value="${promotion?.short_message || ''}" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent"
            placeholder="e.g., Get Rs 10,000 off on all Apache models!">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent"
            placeholder="Full description of the offer">${promotion?.description || ''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
            <input type="number" name="discount_amount" value="${promotion?.discount_amount || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent"
              placeholder="5000">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="promotion_type"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent">
              <option value="discount" ${promotion?.promotion_type === 'discount' ? 'selected' : ''}>Discount</option>
              <option value="cashback" ${promotion?.promotion_type === 'cashback' ? 'selected' : ''}>Cashback</option>
              <option value="exchange" ${promotion?.promotion_type === 'exchange' ? 'selected' : ''}>Exchange Bonus</option>
              <option value="finance" ${promotion?.promotion_type === 'finance' ? 'selected' : ''}>Finance Offer</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
            <input type="date" name="valid_from" value="${promotion?.valid_from || new Date().toISOString().split('T')[0]}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <input type="date" name="valid_until" value="${promotion?.valid_until || ''}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent">
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" ${promotion?.is_active !== false ? 'checked' : ''}
            class="w-4 h-4 text-tvs-red border-gray-300 rounded focus:ring-tvs-red">
          <label for="is_active" class="text-sm text-gray-700">Active (visible to customers)</label>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeModal('promotion-modal')"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-2 bg-tvs-red text-white rounded-lg hover:bg-red-700 transition-colors">
            ${isEdit ? 'Update' : 'Add'} Promotion
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('promotion-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      short_message: formData.get('short_message'),
      description: formData.get('description'),
      discount_amount: formData.get('discount_amount') ? parseInt(formData.get('discount_amount')) : null,
      promotion_type: formData.get('promotion_type'),
      valid_from: formData.get('valid_from'),
      valid_until: formData.get('valid_until'),
      is_active: formData.get('is_active') === 'on',
      priority: promotion?.priority || 1
    };

    let result;
    if (isEdit) {
      result = await updatePromotion(promotion.id, data);
    } else {
      result = await addPromotion(data);
    }

    if (result.error) {
      showAdminToast('Failed to save promotion: ' + result.error.message, 'error');
    } else {
      showAdminToast(`Promotion ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
      closeModal('promotion-modal');
      await renderPromotionsTable();
    }
  });
}

// Toggle promotion status
async function togglePromotionStatus(id, newStatus) {
  const result = await updatePromotion(id, { is_active: newStatus });
  if (result.error) {
    showAdminToast('Failed to update status', 'error');
  } else {
    showAdminToast(`Promotion ${newStatus ? 'activated' : 'deactivated'}`, 'success');
    await renderPromotionsTable();
  }
}

// Edit promotion
async function editPromotion(id) {
  const promotions = await fetchPromotions();
  const promotion = promotions.find(p => p.id === id);
  if (promotion) {
    showAddPromotionModal(promotion);
  }
}

// Confirm delete promotion
function confirmDeletePromotion(id) {
  if (confirm('Are you sure you want to delete this promotion?')) {
    deletePromotionById(id);
  }
}

// Delete promotion
async function deletePromotionById(id) {
  const result = await deletePromotion(id);
  if (result.error) {
    showAdminToast('Failed to delete promotion', 'error');
  } else {
    showAdminToast('Promotion deleted', 'success');
    await renderPromotionsTable();
  }
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

// ============ PRICING ============
async function renderPricingTable() {
  const container = document.getElementById('table-container');
  const pricing = await fetchPricing();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Showroom Pricing</h2>
      <button onclick="loadTabContent('pricing')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Showroom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ex-Showroom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RTO</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Road Price</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${pricing.length === 0 ? `
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">No pricing data available.</td>
            </tr>
          ` : pricing.map(p => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${p.models?.name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.showrooms?.name || '-'} (${p.showrooms?.city || ''})</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatPrice(p.ex_showroom_price)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatPrice(p.rto_charges)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatPrice(p.insurance_1yr)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-tvs-red">${formatPrice(p.on_road_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ INVENTORY ============
async function renderInventoryTable() {
  const container = document.getElementById('table-container');
  const inventory = await fetchInventory();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Inventory</h2>
      <button onclick="loadTabContent('inventory')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Showroom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${inventory.length === 0 ? `
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">No inventory data available.</td>
            </tr>
          ` : inventory.map(i => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${i.models?.name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${i.colors?.display_name || i.colors?.name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${i.showrooms?.name || '-'} (${i.showrooms?.city || ''})</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${i.quantity_available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  ${i.quantity_available} units
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="showUpdateInventoryModal(${i.id}, ${i.quantity_available})" class="text-blue-600 hover:text-blue-800">Update Stock</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Show update inventory modal
function showUpdateInventoryModal(id, currentQty) {
  const modal = document.createElement('div');
  modal.id = 'inventory-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
      <h3 class="text-xl font-bold text-gray-900 mb-4">Update Stock</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
        <input type="number" id="new-quantity" value="${currentQty}" min="0"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tvs-red focus:border-transparent">
      </div>
      <div class="flex gap-3">
        <button onclick="closeModal('inventory-modal')"
          class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onclick="updateInventoryQty(${id})"
          class="flex-1 px-4 py-2 bg-tvs-red text-white rounded-lg hover:bg-red-700 transition-colors">
          Update
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Update inventory quantity
async function updateInventoryQty(id) {
  const quantity = parseInt(document.getElementById('new-quantity').value);
  const result = await updateInventory(id, quantity);
  if (result.error) {
    showAdminToast('Failed to update inventory', 'error');
  } else {
    showAdminToast('Inventory updated', 'success');
    closeModal('inventory-modal');
    await renderInventoryTable();
  }
}

// ============ TEST DRIVES ============
async function renderTestDrivesTable() {
  const container = document.getElementById('table-container');
  const testDrives = await fetchTestDriveRequests();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Test Drive Requests</h2>
      <button onclick="loadTabContent('testdrives')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${testDrives.length === 0 ? `
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">No test drive requests yet.</td>
            </tr>
          ` : testDrives.map(td => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${td.customer_name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${td.customer_phone || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${td.models?.name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${td.city || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDateTime(td.created_at)}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                  td.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  td.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  td.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }">
                  ${td.status || 'pending'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <select onchange="updateTDStatus('${td.id}', this.value)" class="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="pending" ${td.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="confirmed" ${td.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="completed" ${td.status === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${td.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Update test drive status
async function updateTDStatus(id, status) {
  const result = await updateTestDriveStatus(id, status);
  if (result.error) {
    showAdminToast('Failed to update status', 'error');
  } else {
    showAdminToast('Status updated', 'success');
  }
}

// ============ CALLBACKS ============
async function renderCallbacksTable() {
  const container = document.getElementById('table-container');
  const callbacks = await fetchCallbacks();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Callback Requests (Escalations)</h2>
      <button onclick="loadTabContent('callbacks')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${callbacks.length === 0 ? `
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">No callback requests yet.</td>
            </tr>
          ` : callbacks.map(cb => `
            <tr class="hover:bg-gray-50 ${cb.priority === 'high' || cb.priority === 'urgent' ? 'bg-red-50' : ''}">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${cb.customer_name || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cb.customer_phone || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">${cb.reason || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                  cb.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  cb.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }">
                  ${cb.priority || 'normal'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDateTime(cb.created_at)}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                  cb.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  cb.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                  cb.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }">
                  ${cb.status || 'pending'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <select onchange="updateCBStatus('${cb.id}', this.value)" class="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="pending" ${cb.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="contacted" ${cb.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                  <option value="resolved" ${cb.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Update callback status
async function updateCBStatus(id, status) {
  const result = await updateCallbackStatus(id, status);
  if (result.error) {
    showAdminToast('Failed to update status', 'error');
  } else {
    showAdminToast('Status updated', 'success');
  }
}

// ============ MODELS (View Only) ============
async function renderModelsTable() {
  const container = document.getElementById('table-container');
  const models = await fetchModels();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Models</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engine</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${models.map(m => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${m.name}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${m.category || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${m.engine_cc ? m.engine_cc + 'cc' : '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatPrice(m.ex_showroom_price_base)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ SHOWROOMS (View Only) ============
async function renderShowroomsTable() {
  const container = document.getElementById('table-container');
  const showrooms = await fetchShowrooms();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Showrooms</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${showrooms.map(s => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${s.name}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${s.city || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${s.area || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${s.phone || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ STATS ============
async function loadStats() {
  const stats = await fetchStats();

  document.getElementById('stat-models').textContent = stats.models;
  document.getElementById('stat-showrooms').textContent = stats.showrooms;
  document.getElementById('stat-testdrives').textContent = stats.pendingTestDrives;
  document.getElementById('stat-callbacks').textContent = stats.pendingCallbacks;
  document.getElementById('stat-promotions').textContent = stats.activePromotions;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  switchTab('promotions');

  // Subscribe to real-time updates
  subscribeToChanges('promotions', () => {
    if (activeTab === 'promotions') renderPromotionsTable();
    loadStats();
  });

  subscribeToChanges('test_drive_requests', () => {
    if (activeTab === 'testdrives') renderTestDrivesTable();
    loadStats();
  });

  subscribeToChanges('callbacks', () => {
    if (activeTab === 'callbacks') renderCallbacksTable();
    loadStats();
  });
});
