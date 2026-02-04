// Supabase Configuration
const SUPABASE_URL = 'https://rwnkbwfigdxjrwvoafby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzYyNjcsImV4cCI6MjA4NTYxMjI2N30.RjJPmthpdwGLGjXMC30b0we9acT2IjqnpGx8nDoGtwo';

console.log('[Supabase] Initializing client...');
console.log('[Supabase] URL:', SUPABASE_URL);

// Initialize Supabase client (using db as variable name to avoid conflict with SDK)
let db = null;
try {
  if (!window.supabase) {
    console.error('[Supabase] ERROR: window.supabase is not defined. SDK not loaded.');
  } else {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client initialized successfully');
  }
} catch (err) {
  console.error('[Supabase] ERROR initializing client:', err);
}

// ============ MODELS ============
async function fetchModels() {
  console.log('[fetchModels] Starting fetch...');
  if (!db) {
    console.error('[fetchModels] ERROR: Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
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
  if (!db) {
    console.error('[fetchShowrooms] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
      .from('showrooms')
      .select('*')
      .eq('is_active', true)
      .order('city');

    if (error) {
      console.error('[fetchShowrooms] Error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchShowrooms] Exception:', err);
    return [];
  }
}

// ============ PROMOTIONS ============
async function fetchPromotions() {
  console.log('[fetchPromotions] Starting...');
  if (!db) {
    console.error('[fetchPromotions] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
      .from('promotions')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('[fetchPromotions] Error:', error);
      return [];
    }
    console.log('[fetchPromotions] Success, found', data?.length || 0, 'promotions');
    return data || [];
  } catch (err) {
    console.error('[fetchPromotions] Exception:', err);
    return [];
  }
}

async function addPromotion(promotion) {
  const { data, error } = await db
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
  const { data, error } = await db
    .from('promotions')
    .update(updates)
    .eq('id', id)
    .select();

  return { data, error };
}

async function deletePromotion(id) {
  const { error } = await db
    .from('promotions')
    .delete()
    .eq('id', id);

  return { error };
}

// ============ INVENTORY ============
async function fetchInventory() {
  if (!db) {
    console.error('[fetchInventory] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
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
      console.error('[fetchInventory] Error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchInventory] Exception:', err);
    return [];
  }
}

async function updateInventory(id, quantity) {
  const { data, error } = await db
    .from('inventory')
    .update({ quantity_available: quantity })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ PRICING ============
async function fetchPricing() {
  if (!db) {
    console.error('[fetchPricing] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
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
      console.error('[fetchPricing] Error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchPricing] Exception:', err);
    return [];
  }
}

async function updatePricing(id, updates) {
  const { data, error } = await db
    .from('showroom_pricing')
    .update(updates)
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ TEST DRIVE REQUESTS ============
async function fetchTestDriveRequests() {
  if (!db) {
    console.error('[fetchTestDriveRequests] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
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
      console.error('[fetchTestDriveRequests] Error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchTestDriveRequests] Exception:', err);
    return [];
  }
}

async function updateTestDriveStatus(id, status) {
  const { data, error } = await db
    .from('test_drive_requests')
    .update({ status })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ CALLBACKS ============
async function fetchCallbacks() {
  if (!db) {
    console.error('[fetchCallbacks] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
      .from('callbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchCallbacks] Error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchCallbacks] Exception:', err);
    return [];
  }
}

async function updateCallbackStatus(id, status) {
  const { data, error } = await db
    .from('callbacks')
    .update({ status })
    .eq('id', id)
    .select();

  return { data, error };
}

// ============ STATS ============
async function fetchStats() {
  if (!db) {
    console.error('[fetchStats] Supabase client not initialized');
    return { models: 0, showrooms: 0, pendingTestDrives: 0, pendingCallbacks: 0, activePromotions: 0 };
  }

  try {
    const [models, showrooms, testDrives, callbacks, promotions] = await Promise.all([
      db.from('models').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('showrooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('test_drive_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('callbacks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return {
      models: models.count || 0,
      showrooms: showrooms.count || 0,
      pendingTestDrives: testDrives.count || 0,
      pendingCallbacks: callbacks.count || 0,
      activePromotions: promotions.count || 0
    };
  } catch (err) {
    console.error('[fetchStats] Error:', err);
    return { models: 0, showrooms: 0, pendingTestDrives: 0, pendingCallbacks: 0, activePromotions: 0 };
  }
}

// ============ REAL-TIME SUBSCRIPTIONS ============
function subscribeToChanges(table, callback) {
  if (!db) {
    console.error('[subscribeToChanges] Supabase client not initialized');
    return null;
  }

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
