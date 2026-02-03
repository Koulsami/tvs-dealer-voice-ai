// Supabase Configuration
const SUPABASE_URL = 'https://rwnkbwfigdxjrwvoafby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzYyNjcsImV4cCI6MjA4NTYxMjI2N30.RjJPmthpdwGLGjXMC30b0we9acT2IjqnpGx8nDoGtwo';

console.log('[Supabase] Initializing client...');
console.log('[Supabase] URL:', SUPABASE_URL);

// Initialize Supabase client
let supabase;
try {
  if (!window.supabase) {
    console.error('[Supabase] ERROR: window.supabase is not defined. SDK not loaded.');
  } else {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client initialized successfully');
  }
} catch (err) {
  console.error('[Supabase] ERROR initializing client:', err);
}

// ============ MODELS ============
async function fetchModels() {
  console.log('[fetchModels] Starting fetch...');
  if (!supabase) {
    console.error('[fetchModels] ERROR: Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('models')
      .select('id, name, category, engine_cc, ex_showroom_price_base, mileage_kmpl, image_url')
      .eq('is_active', true)
      .order('category');

    if (error) {
      console.error('[fetchModels] ERROR:', error);
      return [];
    }
    console.log('[fetchModels] SUCCESS - Found', data?.length || 0, 'models:', data);
    return data || [];
  } catch (err) {
    console.error('[fetchModels] EXCEPTION:', err);
    return [];
  }
}

// ============ SHOWROOMS ============
async function fetchShowrooms() {
  const { data, error } = await supabase
    .from('showrooms')
    .select('*')
    .eq('is_active', true)
    .order('city');

  if (error) {
    console.error('Error fetching showrooms:', error);
    return [];
  }
  return data || [];
}

// ============ PROMOTIONS ============
async function fetchPromotions() {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
  return data || [];
}

async function addPromotion(promotion) {
  const { data, error } = await supabase
    .from('promotions')
    .insert([{
      name: promotion.name,
      description: promotion.description,
      short_message: promotion.short_message,
      promotion_type: promotion.promotion_type || 'discount',
      discount_amount: promotion.discount_amount,
      valid_from: promotion.valid_from,
      valid_until: promotion.valid_until,
      is_active: promotion.is_active !== false,
      priority: promotion.priority || 1
    }])
    .select();

  return { data, error };
}

async function updatePromotion(id, updates) {
  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', id)
    .select();

  return { data, error };
}

async function deletePromotion(id) {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  return { error };
}

// ============ INVENTORY ============
async function fetchInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      quantity_available,
      expected_arrival,
      models (id, name),
      showrooms (id, name, city),
      colors (id, name, display_name)
    `)
    .order('quantity_available', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
  return data || [];
}

async function updateInventory(id, quantity) {
  const { data, error } = await supabase
    .from('inventory')
    .update({ quantity_available: quantity })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ PRICING ============
async function fetchPricing() {
  const { data, error } = await supabase
    .from('showroom_pricing')
    .select(`
      id,
      ex_showroom_price,
      rto_charges,
      insurance_1yr,
      handling_charges,
      on_road_price,
      models (id, name),
      showrooms (id, name, city)
    `)
    .order('on_road_price');

  if (error) {
    console.error('Error fetching pricing:', error);
    return [];
  }
  return data || [];
}

async function updatePricing(id, updates) {
  const { data, error } = await supabase
    .from('showroom_pricing')
    .update(updates)
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ TEST DRIVE REQUESTS ============
async function fetchTestDriveRequests() {
  const { data, error } = await supabase
    .from('test_drive_requests')
    .select(`
      id,
      customer_name,
      customer_phone,
      city,
      preferred_date,
      preferred_time,
      status,
      created_at,
      models (id, name),
      showrooms (id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching test drive requests:', error);
    return [];
  }
  return data || [];
}

async function updateTestDriveStatus(id, status) {
  const { data, error } = await supabase
    .from('test_drive_requests')
    .update({ status })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ CALLBACKS ============
async function fetchCallbacks() {
  const { data, error } = await supabase
    .from('callbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching callbacks:', error);
    return [];
  }
  return data || [];
}

async function updateCallbackStatus(id, status) {
  const { data, error } = await supabase
    .from('callbacks')
    .update({ status })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ STATS ============
async function fetchStats() {
  const [models, showrooms, testDrives, callbacks, promotions] = await Promise.all([
    supabase.from('models').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('showrooms').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('test_drive_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('callbacks').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('promotions').select('id', { count: 'exact' }).eq('is_active', true)
  ]);

  return {
    models: models.count || 0,
    showrooms: showrooms.count || 0,
    pendingTestDrives: testDrives.count || 0,
    pendingCallbacks: callbacks.count || 0,
    activePromotions: promotions.count || 0
  };
}

// ============ REAL-TIME SUBSCRIPTIONS ============
function subscribeToChanges(table, callback) {
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: table },
      (payload) => {
        console.log(`Change in ${table}:`, payload);
        callback(payload);
      }
    )
    .subscribe();
}
