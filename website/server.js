require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Retell API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_2c149db1a0a0a022c2c2b7878f';

// Store connected clients by call_id
const connectedClients = new Map();

// ================================================
// TVS PRODUCT DATA
// ================================================
const productData = {
  "apache_rtr_160_4v": {
    id: "apache_rtr_160_4v",
    name: "Apache RTR 160 4V",
    tagline: "Race Inspired Performance",
    category: "Sport",
    price: {
      ex_showroom: 121000,
      on_road_bangalore: 138000,
      on_road_mumbai: 142000,
      on_road_delhi: 136000,
      on_road_chennai: 139000,
      on_road_hyderabad: 140000
    },
    specs: {
      engine: "159.7 cc",
      power: "17.63 PS @ 9250 rpm",
      torque: "14.73 Nm @ 7250 rpm",
      mileage: "45 kmpl",
      top_speed: "114 kmph",
      fuel_tank: "12 L",
      weight: "147 kg",
      seat_height: "800 mm",
      ground_clearance: "180 mm",
      transmission: "5-Speed"
    },
    features: [
      "Race Tuned Fuel Injection (RT-Fi)",
      "Dual Channel ABS",
      "LED Headlamp with DRL",
      "SmartXonnect with Bluetooth",
      "Race-derived Aerodynamics",
      "Petal Disc Brakes"
    ],
    colors: [
      { name: "Racing Red", hex: "#E31837", image: "apache-rtr-160-red.jpg" },
      { name: "Matte Blue", hex: "#1E3A5F", image: "apache-rtr-160-blue.jpg" },
      { name: "Knight Black", hex: "#1A1A1A", image: "apache-rtr-160-black.jpg" },
      { name: "Pearl White", hex: "#F5F5F5", image: "apache-rtr-160-white.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
      gallery: []
    },
    emi_starts: 4500
  },
  "apache_rtr_200_4v": {
    id: "apache_rtr_200_4v",
    name: "Apache RTR 200 4V",
    tagline: "The Ultimate Street Racing Machine",
    category: "Sport",
    price: {
      ex_showroom: 143000,
      on_road_bangalore: 162000,
      on_road_mumbai: 168000,
      on_road_delhi: 160000,
      on_road_chennai: 163000,
      on_road_hyderabad: 165000
    },
    specs: {
      engine: "197.75 cc",
      power: "20.8 PS @ 9000 rpm",
      torque: "17.25 Nm @ 7500 rpm",
      mileage: "40 kmpl",
      top_speed: "127 kmph",
      fuel_tank: "12 L",
      weight: "153 kg",
      seat_height: "800 mm",
      ground_clearance: "180 mm",
      transmission: "5-Speed"
    },
    features: [
      "Race Tuned Fuel Injection (RT-Fi)",
      "Dual Channel ABS with RLP",
      "LED Headlamp with DRL",
      "SmartXonnect with Navigation",
      "Race-derived O3C",
      "Clip-on Handlebars"
    ],
    colors: [
      { name: "Gloss Black", hex: "#0D0D0D", image: "apache-rtr-200-black.jpg" },
      { name: "Racing Red", hex: "#E31837", image: "apache-rtr-200-red.jpg" },
      { name: "Pearl White", hex: "#F8F8F8", image: "apache-rtr-200-white.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
      gallery: []
    },
    emi_starts: 5200
  },
  "apache_rr_310": {
    id: "apache_rr_310",
    name: "Apache RR 310",
    tagline: "Born for the Track",
    category: "Sport",
    price: {
      ex_showroom: 275000,
      on_road_bangalore: 310000,
      on_road_mumbai: 320000,
      on_road_delhi: 308000,
      on_road_chennai: 312000,
      on_road_hyderabad: 315000
    },
    specs: {
      engine: "312.2 cc",
      power: "34 PS @ 9700 rpm",
      torque: "27.3 Nm @ 7700 rpm",
      mileage: "35 kmpl",
      top_speed: "160 kmph",
      fuel_tank: "11 L",
      weight: "174 kg",
      seat_height: "810 mm",
      ground_clearance: "180 mm",
      transmission: "6-Speed"
    },
    features: [
      "Reverse Inclined Engine",
      "Dual Channel ABS",
      "TFT Instrument Cluster",
      "4 Ride Modes",
      "Adjustable Levers",
      "Race-spec Exhaust"
    ],
    colors: [
      { name: "Titanium Black", hex: "#2D2D2D", image: "apache-rr-310-black.jpg" },
      { name: "Racing Red", hex: "#CC0000", image: "apache-rr-310-red.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800",
      gallery: []
    },
    emi_starts: 9500
  },
  "jupiter_125": {
    id: "jupiter_125",
    name: "Jupiter 125",
    tagline: "More Power. More Mileage.",
    category: "Scooter",
    price: {
      ex_showroom: 76000,
      on_road_bangalore: 88000,
      on_road_mumbai: 91000,
      on_road_delhi: 86000,
      on_road_chennai: 89000,
      on_road_hyderabad: 90000
    },
    specs: {
      engine: "124.8 cc",
      power: "8.15 PS @ 6500 rpm",
      torque: "10.3 Nm @ 5000 rpm",
      mileage: "52 kmpl",
      top_speed: "90 kmph",
      fuel_tank: "5.3 L",
      weight: "108 kg",
      seat_height: "765 mm",
      ground_clearance: "165 mm",
      transmission: "CVT"
    },
    features: [
      "ETFi Technology",
      "LED Headlamp",
      "External Fuel Lid",
      "USB Charging",
      "21L Boot Space",
      "Mobile Holder"
    ],
    colors: [
      { name: "Starlight Blue", hex: "#1E40AF", image: "jupiter-125-blue.jpg" },
      { name: "Pristine White", hex: "#FFFFFF", image: "jupiter-125-white.jpg" },
      { name: "Midnight Black", hex: "#1A1A1A", image: "jupiter-125-black.jpg" },
      { name: "Volcano Red", hex: "#B91C1C", image: "jupiter-125-red.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800",
      gallery: []
    },
    emi_starts: 2800
  },
  "ntorq_125": {
    id: "ntorq_125",
    name: "Ntorq 125",
    tagline: "The Smartest Scooter",
    category: "Scooter",
    price: {
      ex_showroom: 86000,
      on_road_bangalore: 99000,
      on_road_mumbai: 103000,
      on_road_delhi: 97000,
      on_road_chennai: 100000,
      on_road_hyderabad: 101000
    },
    specs: {
      engine: "124.8 cc",
      power: "9.38 PS @ 7000 rpm",
      torque: "10.5 Nm @ 5500 rpm",
      mileage: "47 kmpl",
      top_speed: "95 kmph",
      fuel_tank: "5.8 L",
      weight: "118 kg",
      seat_height: "770 mm",
      ground_clearance: "165 mm",
      transmission: "CVT"
    },
    features: [
      "SmartXonnect Bluetooth",
      "Navigation Assist",
      "Voice Assistant",
      "LED DRL",
      "Race Mode",
      "Top Speed Indicator"
    ],
    colors: [
      { name: "Metallic Red", hex: "#DC2626", image: "ntorq-red.jpg" },
      { name: "Neon Green", hex: "#22C55E", image: "ntorq-green.jpg" },
      { name: "Matte Yellow", hex: "#FACC15", image: "ntorq-yellow.jpg" },
      { name: "Metallic Grey", hex: "#6B7280", image: "ntorq-grey.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800",
      gallery: []
    },
    emi_starts: 3200
  },
  "iqube_electric": {
    id: "iqube_electric",
    name: "iQube Electric",
    tagline: "Smart. Connected. Electric.",
    category: "Electric",
    price: {
      ex_showroom: 120000,
      on_road_bangalore: 125000,
      on_road_mumbai: 128000,
      on_road_delhi: 115000,
      on_road_chennai: 126000,
      on_road_hyderabad: 127000
    },
    specs: {
      motor: "4.4 kW",
      power: "5.9 PS",
      torque: "140 Nm",
      range: "100 km",
      top_speed: "78 kmph",
      battery: "3.04 kWh Lithium-ion",
      weight: "118 kg",
      seat_height: "770 mm",
      ground_clearance: "165 mm",
      charging_time: "4.5 hours"
    },
    features: [
      "SmartXonnect",
      "TFT Display",
      "Navigation",
      "Geo-fencing",
      "Remote Battery Status",
      "Regenerative Braking"
    ],
    colors: [
      { name: "Mint Blue", hex: "#06B6D4", image: "iqube-blue.jpg" },
      { name: "Pearl White", hex: "#F5F5F5", image: "iqube-white.jpg" },
      { name: "Grey", hex: "#9CA3AF", image: "iqube-grey.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800",
      gallery: []
    },
    emi_starts: 4200
  },
  "raider_125": {
    id: "raider_125",
    name: "Raider 125",
    tagline: "Born to Raid",
    category: "Commuter",
    price: {
      ex_showroom: 92000,
      on_road_bangalore: 106000,
      on_road_mumbai: 110000,
      on_road_delhi: 104000,
      on_road_chennai: 107000,
      on_road_hyderabad: 108000
    },
    specs: {
      engine: "124.8 cc",
      power: "11.38 PS @ 8000 rpm",
      torque: "11.2 Nm @ 6000 rpm",
      mileage: "55 kmpl",
      top_speed: "99 kmph",
      fuel_tank: "10 L",
      weight: "123 kg",
      seat_height: "780 mm",
      ground_clearance: "180 mm",
      transmission: "5-Speed"
    },
    features: [
      "LED Headlamp",
      "Digital Console",
      "USB Charging",
      "Sporty Design",
      "First-in-class Features",
      "Alloy Wheels"
    ],
    colors: [
      { name: "Fiery Yellow", hex: "#EAB308", image: "raider-yellow.jpg" },
      { name: "Wicked Black", hex: "#171717", image: "raider-black.jpg" },
      { name: "Striking Red", hex: "#DC2626", image: "raider-red.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
      gallery: []
    },
    emi_starts: 3400
  },
  "tvs_sport": {
    id: "tvs_sport",
    name: "TVS Sport",
    tagline: "India's Most Economical Bike",
    category: "Commuter",
    price: {
      ex_showroom: 62000,
      on_road_bangalore: 72000,
      on_road_mumbai: 75000,
      on_road_delhi: 70000,
      on_road_chennai: 73000,
      on_road_hyderabad: 74000
    },
    specs: {
      engine: "109.7 cc",
      power: "8.19 PS @ 7350 rpm",
      torque: "8.7 Nm @ 5000 rpm",
      mileage: "65 kmpl",
      top_speed: "85 kmph",
      fuel_tank: "10 L",
      weight: "113 kg",
      seat_height: "760 mm",
      ground_clearance: "180 mm",
      transmission: "4-Speed"
    },
    features: [
      "Dura-Grip Tyres",
      "ET-Fi Technology",
      "Long Seat",
      "Tubeless Tyres",
      "USB Charging",
      "Excellent Mileage"
    ],
    colors: [
      { name: "Black Red", hex: "#B91C1C", image: "sport-red.jpg" },
      { name: "Black Purple", hex: "#7C3AED", image: "sport-purple.jpg" },
      { name: "Black", hex: "#000000", image: "sport-black.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800",
      gallery: []
    },
    emi_starts: 2300
  },
  "radeon": {
    id: "radeon",
    name: "TVS Radeon",
    tagline: "Complete Family Bike",
    category: "Commuter",
    price: {
      ex_showroom: 70000,
      on_road_bangalore: 81000,
      on_road_mumbai: 84000,
      on_road_delhi: 79000,
      on_road_chennai: 82000,
      on_road_hyderabad: 83000
    },
    specs: {
      engine: "109.7 cc",
      power: "8.19 PS @ 7350 rpm",
      torque: "8.7 Nm @ 5000 rpm",
      mileage: "62 kmpl",
      top_speed: "82 kmph",
      fuel_tank: "10 L",
      weight: "112 kg",
      seat_height: "780 mm",
      ground_clearance: "180 mm",
      transmission: "4-Speed"
    },
    features: [
      "Synchronized Braking",
      "Comfortable Seat",
      "DRL",
      "USB Charging",
      "Large Fuel Tank",
      "Tubeless Tyres"
    ],
    colors: [
      { name: "Royal Purple", hex: "#6D28D9", image: "radeon-purple.jpg" },
      { name: "Pearl White", hex: "#F5F5F5", image: "radeon-white.jpg" },
      { name: "Metal Black", hex: "#27272A", image: "radeon-black.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1558981033-0f0309284409?w=800",
      gallery: []
    },
    emi_starts: 2600
  },
  "jupiter": {
    id: "jupiter",
    name: "TVS Jupiter",
    tagline: "India's Favorite Family Scooter",
    category: "Scooter",
    price: {
      ex_showroom: 73000,
      on_road_bangalore: 85000,
      on_road_mumbai: 88000,
      on_road_delhi: 83000,
      on_road_chennai: 86000,
      on_road_hyderabad: 87000
    },
    specs: {
      engine: "109.7 cc",
      power: "7.5 PS @ 7000 rpm",
      torque: "8.4 Nm @ 5500 rpm",
      mileage: "55 kmpl",
      top_speed: "85 kmph",
      fuel_tank: "5.1 L",
      weight: "107 kg",
      seat_height: "765 mm",
      ground_clearance: "165 mm",
      transmission: "CVT"
    },
    features: [
      "ETFi Technology",
      "External Fuel Lid",
      "Mobile Charging",
      "Large Floorboard",
      "Pass Light Switch",
      "Econometer"
    ],
    colors: [
      { name: "Pristine White", hex: "#FFFFFF", image: "jupiter-white.jpg" },
      { name: "Mystic Grey", hex: "#6B7280", image: "jupiter-grey.jpg" },
      { name: "Walnut Brown", hex: "#78350F", image: "jupiter-brown.jpg" },
      { name: "Volcano Red", hex: "#DC2626", image: "jupiter-red.jpg" }
    ],
    images: {
      main: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800",
      gallery: []
    },
    emi_starts: 2700
  }
};

// Helper function to find product by name
function findProductByName(name) {
  const searchName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, product] of Object.entries(productData)) {
    const productName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (productName.includes(searchName) || searchName.includes(productName)) {
      return product;
    }
  }

  // Fallback: partial match
  for (const [key, product] of Object.entries(productData)) {
    if (product.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(product.name.toLowerCase().split(' ')[0])) {
      return product;
    }
  }

  return null;
}

// Log configuration status on startup
console.log('=== TVS Demo Website Configuration ===');
console.log('RETELL_API_KEY:', RETELL_API_KEY ? 'Configured' : 'NOT SET - Voice calls will fail!');
console.log('RETELL_AGENT_ID:', RETELL_AGENT_ID);
console.log('Socket.IO: Enabled');
console.log('=====================================');

// ================================================
// SOCKET.IO CONNECTION HANDLING
// ================================================
io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);

  // Register client with call_id for targeted messaging
  socket.on('register', (data) => {
    if (data.call_id) {
      connectedClients.set(data.call_id, socket.id);
      socket.call_id = data.call_id;
      console.log(`[Socket.IO] Registered call_id ${data.call_id} with socket ${socket.id}`);
    }
  });

  // Also allow registration by session
  socket.on('register_session', (data) => {
    if (data.session_id) {
      connectedClients.set(data.session_id, socket.id);
      socket.session_id = data.session_id;
      console.log(`[Socket.IO] Registered session ${data.session_id} with socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
    // Clean up registrations
    if (socket.call_id) {
      connectedClients.delete(socket.call_id);
    }
    if (socket.session_id) {
      connectedClients.delete(socket.session_id);
    }
  });
});

// ================================================
// RETELL WEBHOOK - Function Calls
// ================================================
app.post('/api/retell-webhook', (req, res) => {
  console.log('[Webhook] Received:', JSON.stringify(req.body, null, 2));

  const { event, call } = req.body;
  const metadata = call?.metadata || req.body.metadata || {};
  const callId = call?.call_id || req.body.call_id;

  // Handle function calls from Retell
  // Retell sends function name as "name" and arguments as "args"
  const functionName = req.body.name || req.body.function_name;
  const args = req.body.args || req.body.arguments || {};

  if (functionName === 'show_vehicle_details') {
    console.log(`[Webhook] Function call detected: ${functionName}`);
    console.log(`[Webhook] Args:`, args);
    console.log(`[Webhook] Call ID: ${callId}`);
    console.log(`[Webhook] Metadata:`, metadata);

    handleShowVehicleDetails(args, callId, metadata);

    // Return result to Retell
    return res.status(200).json({
      response: `Showing details for ${args.model} on the customer's screen.`
    });
  }

  // Handle other events (call_started, call_ended, call_analyzed)
  if (event) {
    console.log(`[Webhook] Event: ${event}`);
  }

  res.status(200).json({ success: true });
});

// Alternative webhook endpoint for custom LLM
app.post('/api/llm-webhook', (req, res) => {
  console.log('[LLM Webhook] Received:', JSON.stringify(req.body, null, 2));

  const metadata = req.body.metadata || {};

  // Check for function call in the request
  const functionCall = req.body.function_call || req.body.tool_calls?.[0]?.function;

  if (functionCall && functionCall.name === 'show_vehicle_details') {
    const args = typeof functionCall.arguments === 'string'
      ? JSON.parse(functionCall.arguments)
      : functionCall.arguments;
    handleShowVehicleDetails(args, req.body.call_id, metadata);
  }

  res.status(200).json({ success: true });
});

// Handle show_vehicle_details function
function handleShowVehicleDetails(args, callId, metadata = {}) {
  const modelName = args.model || args.vehicle || args.name;
  console.log(`[Function] show_vehicle_details called for: ${modelName}`);
  console.log(`[Function] Call ID: ${callId}, Session ID: ${metadata.session_id}`);

  const product = findProductByName(modelName);

  if (product) {
    console.log(`[Function] Found product: ${product.name}`);

    const eventData = {
      product: product,
      timestamp: new Date().toISOString()
    };

    // Try to emit to specific client using session_id or call_id
    const sessionId = metadata.session_id;
    const targetSocketId = connectedClients.get(sessionId) || connectedClients.get(callId);

    if (targetSocketId) {
      // Emit to specific client only
      io.to(targetSocketId).emit('show_product', eventData);
      console.log(`[Function] Sent product to specific client: ${targetSocketId} (session: ${sessionId})`);
    } else {
      // Fallback: broadcast to all (for testing/demo purposes)
      io.emit('show_product', eventData);
      console.log('[Function] No specific client found, broadcasted to all clients');
    }
  } else {
    console.log(`[Function] Product not found: ${modelName}`);
  }
}

// Direct API to show product (for testing)
app.post('/api/show-product', (req, res) => {
  const { model } = req.body;

  if (!model) {
    return res.status(400).json({ error: 'Model name required' });
  }

  const product = findProductByName(model);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  io.emit('show_product', {
    product: product,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, product: product.name });
});

// Get product data API
app.get('/api/products', (req, res) => {
  res.json(Object.values(productData));
});

app.get('/api/products/:id', (req, res) => {
  const product = productData[req.params.id] || findProductByName(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// ================================================
// EXISTING ENDPOINTS
// ================================================

// Create web call endpoint - proxies to Retell API
app.post('/api/create-web-call', async (req, res) => {
  if (!RETELL_API_KEY) {
    return res.status(500).json({
      error: 'RETELL_API_KEY not configured',
      message: 'Please set RETELL_API_KEY environment variable'
    });
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: RETELL_AGENT_ID,
        metadata: req.body.metadata || {},
        retell_llm_dynamic_variables: req.body.retell_llm_dynamic_variables || {}
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Retell API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Retell API error',
        message: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating web call:', error);
    res.status(500).json({
      error: 'Failed to create web call',
      message: error.message
    });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve conversations.html
app.get('/conversations', (req, res) => {
  res.sendFile(path.join(__dirname, 'conversations.html'));
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => {
  console.log(`TVS Demo Website running on port ${PORT}`);
  console.log(`Socket.IO ready for real-time updates`);
});
