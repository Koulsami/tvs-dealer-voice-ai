// ================================================
// RIA AI ASSISTANT - Chat & Voice Integration
// ================================================

// Retell AI Configuration
const RETELL_AGENT_ID = 'agent_2c149db1a0a0a022c2c2b7878f';

// State management
let retellClient = null;
let callState = 'idle'; // idle, connecting, active, speaking, listening
let currentMode = 'chat'; // chat, voice
let isWidgetExpanded = false;

// Context management for personalized interactions
let currentContext = {
  type: null,        // 'model', 'insurance', 'finance', 'test_drive', 'offers', 'service'
  name: null,        // e.g., 'Apache RTR 200 4V'
  data: null,        // additional data like price, specs
  intent: null       // user's likely intent
};

// ================================================
// WIDGET CONTROLS
// ================================================

function toggleRiaWidget() {
  const widget = document.getElementById('ria-widget');
  isWidgetExpanded = !isWidgetExpanded;

  if (isWidgetExpanded) {
    widget.classList.add('expanded');
  } else {
    widget.classList.remove('expanded');
    // End call if closing while in voice mode
    if (callState !== 'idle') {
      endVoiceCall();
    }
    // Clear context when closing
    clearContext();
  }
}

// Open Ria with specific context (called from product cards, feature cards, etc.)
function openRiaWithContext(type, name, dataString) {
  // Parse the data if it's a string
  let data = null;
  try {
    if (typeof dataString === 'string') {
      data = JSON.parse(decodeURIComponent(dataString));
    } else {
      data = dataString;
    }
  } catch (e) {
    console.log('[Ria] Could not parse context data:', e);
  }

  // Set the context
  currentContext = {
    type: type,
    name: name,
    data: data,
    intent: getIntentFromType(type)
  };

  console.log('[Ria] Opening with context:', currentContext);

  // Open the widget
  const widget = document.getElementById('ria-widget');
  if (!isWidgetExpanded) {
    isWidgetExpanded = true;
    widget.classList.add('expanded');
  }

  // Clear previous messages and add context-aware greeting
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '';

  // Add context-aware greeting
  const greeting = getContextualGreeting(type, name, data);
  addChatMessage(greeting, 'ria');

  // Update quick suggestions based on context
  updateQuickSuggestions(type, name);

  // Switch to chat mode by default for context interactions
  switchMode('chat');
}

// Get intent based on context type
function getIntentFromType(type) {
  const intents = {
    'model': 'product_inquiry',
    'insurance': 'insurance_inquiry',
    'finance': 'finance_inquiry',
    'test_drive': 'test_drive_booking',
    'offers': 'offers_inquiry',
    'service': 'service_inquiry',
    'price': 'price_inquiry',
    'comparison': 'comparison_inquiry'
  };
  return intents[type] || 'general_inquiry';
}

// Generate context-aware greeting
function getContextualGreeting(type, name, data) {
  switch (type) {
    case 'model':
      const price = data?.price ? formatPriceInWords(data.price) : '';
      const engine = data?.engine ? `${data.engine}cc` : '';
      const specs = [engine, data?.mileage ? `${data.mileage} kmpl` : ''].filter(Boolean).join(', ');
      return `Great choice! You're interested in the **${name}**! ${specs ? `It features ${specs}.` : ''} ${price ? `Starting at ${price}.` : ''}\n\nWhat would you like to know? I can help with:\n• Detailed specifications\n• On-road price for your city\n• Available colors\n• EMI options\n• Test drive booking`;

    case 'insurance':
      return `I'd be happy to help you with **insurance options** for your TVS vehicle!\n\nWe offer:\n• Comprehensive coverage\n• Third-party insurance\n• Zero depreciation add-on\n• Personal accident cover\n\nWhich vehicle do you need insurance for?`;

    case 'finance':
      return `Let me help you with **finance and EMI options**!\n\nWe have partnerships with leading banks offering:\n• EMI starting from ₹2,999/month\n• Interest rates as low as 7.99%\n• Up to 100% on-road funding\n• Quick approval in 30 minutes\n\nWhich model are you looking to finance?`;

    case 'test_drive':
      return `Exciting! I'll help you **book a test drive**! 🏍️\n\nPlease share:\n• Which model would you like to test?\n• Your preferred date and time\n• Your city/location\n\nI'll find the nearest showroom for you!`;

    case 'offers':
      return `Here are our **current offers and promotions**! 🎉\n\n• Exchange bonus up to ₹10,000\n• Low-interest EMI options\n• Free first-year insurance (select models)\n• Accessories worth ₹5,000\n\nWhich model are you interested in?`;

    case 'service':
      return `I can help you with **service-related queries**!\n\n• Book a service appointment\n• Find service centers near you\n• Check service costs\n• Warranty information\n• Spare parts availability\n\nWhat do you need help with?`;

    case 'price':
      if (name) {
        return `Let me get you the **pricing details for ${name}**!\n\nI can provide:\n• Ex-showroom price\n• On-road price for your city\n• EMI calculations\n• Available variants and colors\n\nWhich city are you in?`;
      }
      return `I'll help you with **pricing information**!\n\nWhich TVS model would you like to know the price for?`;

    default:
      return `Hi! I'm Ria, your TVS assistant. How can I help you today? Ask me about prices, models, test drives, or anything else!`;
  }
}

// Format price in words
function formatPriceInWords(price) {
  if (!price) return '';
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lakh`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

// Update quick suggestions based on context
function updateQuickSuggestions(type, name) {
  const suggestionsContainer = document.querySelector('.quick-suggestions-list');
  if (!suggestionsContainer) return;

  let suggestions = [];

  switch (type) {
    case 'model':
      suggestions = [
        { text: 'On-road price', query: `What's the on-road price of ${name}?` },
        { text: 'Book test drive', query: `I want to test drive the ${name}` },
        { text: 'EMI options', query: `What are the EMI options for ${name}?` },
        { text: 'Colors available', query: `What colors is ${name} available in?` }
      ];
      break;

    case 'insurance':
      suggestions = [
        { text: 'Comprehensive', query: 'Tell me about comprehensive insurance' },
        { text: 'Premium cost', query: 'How much does insurance cost?' },
        { text: 'Claim process', query: 'How do I claim insurance?' },
        { text: 'Add-ons', query: 'What add-ons are available?' }
      ];
      break;

    case 'finance':
      suggestions = [
        { text: 'EMI calculator', query: 'Calculate EMI for me' },
        { text: 'Down payment', query: 'What is the minimum down payment?' },
        { text: 'Documents needed', query: 'What documents do I need for loan?' },
        { text: 'Interest rates', query: 'What are the current interest rates?' }
      ];
      break;

    default:
      suggestions = [
        { text: 'Apache price', query: "What's the price of Apache RTR 200?" },
        { text: 'Test drive', query: 'Book a test drive' },
        { text: 'Offers', query: 'Current offers?' },
        { text: 'iQube range', query: 'iQube range?' }
      ];
  }

  suggestionsContainer.innerHTML = suggestions.map(s =>
    `<button class="suggestion-chip" onclick="useSuggestion('${s.query.replace(/'/g, "\\'")}')">${s.text}</button>`
  ).join('');
}

// Clear context
function clearContext() {
  currentContext = {
    type: null,
    name: null,
    data: null,
    intent: null
  };
}

function switchMode(mode) {
  currentMode = mode;

  const chatMode = document.getElementById('chat-mode');
  const voiceMode = document.getElementById('voice-mode');

  // Update mode buttons
  document.getElementById('mode-chat').classList.toggle('active', mode === 'chat');
  document.getElementById('mode-voice').classList.toggle('active', mode === 'voice');

  // Show/hide content with proper flex styling
  if (mode === 'chat') {
    chatMode.style.display = 'flex';
    chatMode.style.flexDirection = 'column';
    voiceMode.style.display = 'none';
  } else {
    chatMode.style.display = 'none';
    voiceMode.style.display = 'flex';
    voiceMode.style.flexDirection = 'column';
  }
}

// ================================================
// CHAT FUNCTIONALITY
// ================================================

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message) return;

  // Add user message
  addChatMessage(message, 'user');
  input.value = '';

  // Show typing indicator
  showTypingIndicator();

  // Simulate AI response (in production, this would call your AI backend)
  setTimeout(() => {
    hideTypingIndicator();
    const response = generateResponse(message);
    addChatMessage(response, 'ria');
  }, 1000 + Math.random() * 1000);
}

function addChatMessage(text, sender) {
  const container = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.textContent = text;
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message ria';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

function handleChatKeypress(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

function useSuggestion(text) {
  if (currentMode === 'chat') {
    document.getElementById('chat-input').value = text;
    sendChatMessage();
  } else {
    // For voice mode, start call and show suggestion
    if (callState === 'idle') {
      startVoiceCall();
    }
  }
}

// Context-aware response generator
function generateResponse(message) {
  const lowerMessage = message.toLowerCase();
  const ctx = currentContext;

  // If we have context about a specific model, use it
  if (ctx.type === 'model' && ctx.name) {
    const modelName = ctx.name;
    const modelData = ctx.data || {};

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('on-road') || lowerMessage.includes('on road')) {
      const basePrice = modelData.price ? formatPriceInWords(modelData.price) : 'Price on request';
      return `The **${modelName}** has an ex-showroom price of ${basePrice}.\n\nFor the exact on-road price, I'll need your city. The on-road price includes:\n• Road tax\n• Insurance\n• Registration\n\nWhich city are you in?`;
    }

    if (lowerMessage.includes('test drive') || lowerMessage.includes('test ride') || lowerMessage.includes('book')) {
      return `Excellent choice! I'll help you book a test drive for the **${modelName}**! 🏍️\n\nPlease share:\n• Your preferred date and time\n• Your city/area\n\nI'll find the nearest showroom with availability!`;
    }

    if (lowerMessage.includes('emi') || lowerMessage.includes('finance') || lowerMessage.includes('loan')) {
      const price = modelData.price || 150000;
      const emi = Math.round(price / 36);
      return `For the **${modelName}**, here are your EMI options:\n\n• 12 months: ~₹${Math.round(price/12).toLocaleString('en-IN')}/month\n• 24 months: ~₹${Math.round(price/24).toLocaleString('en-IN')}/month\n• 36 months: ~₹${emi.toLocaleString('en-IN')}/month\n\nInterest rates start at 7.99% p.a. Would you like me to connect you with a finance executive?`;
    }

    if (lowerMessage.includes('color') || lowerMessage.includes('colour')) {
      return `The **${modelName}** comes in several attractive colors! The exact options depend on the variant.\n\nWould you like me to:\n• Show available colors for your city?\n• Help you book a showroom visit to see them in person?`;
    }

    if (lowerMessage.includes('spec') || lowerMessage.includes('feature') || lowerMessage.includes('detail')) {
      const engine = modelData.engine ? `${modelData.engine}cc engine` : '';
      const mileage = modelData.mileage ? `${modelData.mileage} kmpl mileage` : '';
      return `Here are the key specifications for **${modelName}**:\n\n${engine ? `• Engine: ${engine}\n` : ''}${mileage ? `• Mileage: ${mileage}\n` : ''}• ABS: Available\n• Digital console with Bluetooth\n• LED lighting\n\nWant more detailed specs or a comparison with other models?`;
    }

    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
      return `I can help you compare the **${modelName}** with other models!\n\nWhich model would you like to compare it with? Or should I suggest competitors in the same segment?`;
    }
  }

  // Insurance context
  if (ctx.type === 'insurance') {
    if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('premium')) {
      return `Insurance premium depends on:\n• Vehicle model and price\n• Type of coverage (Comprehensive/Third-party)\n• Add-ons selected\n• Your city (IDV varies)\n\nFor a **two-wheeler priced at ₹1 Lakh**, comprehensive insurance typically costs ₹3,000-5,000/year.\n\nWhich vehicle do you want to insure?`;
    }

    if (lowerMessage.includes('comprehensive')) {
      return `**Comprehensive Insurance** covers:\n\n✅ Third-party liability\n✅ Own vehicle damage\n✅ Theft protection\n✅ Fire damage\n✅ Natural calamities\n\nAdd-ons available:\n• Zero depreciation\n• Engine protection\n• Roadside assistance\n\nWould you like a quote?`;
    }
  }

  // Finance context
  if (ctx.type === 'finance') {
    if (lowerMessage.includes('document') || lowerMessage.includes('doc')) {
      return `**Documents required for bike loan:**\n\n📄 Identity Proof (Aadhaar/PAN/Passport)\n📄 Address Proof\n📄 Income Proof (Salary slips/ITR)\n📄 Bank statements (3 months)\n📄 Passport size photos\n\nFor salaried: Additional employer letter\nFor self-employed: Business proof\n\nApproval typically takes 30 minutes to 24 hours!`;
    }

    if (lowerMessage.includes('down') || lowerMessage.includes('payment')) {
      return `**Down payment options:**\n\n• Minimum: 10-15% of on-road price\n• Recommended: 20-25% for lower EMI\n• Zero down payment available (for select customers)\n\nHigher down payment = Lower EMI + Lower interest!\n\nWhich model are you planning to finance?`;
    }
  }

  // Default responses (no context or context doesn't match)
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    if (lowerMessage.includes('apache') || lowerMessage.includes('rtr')) {
      return "The Apache RTR 200 4V starts at ₹1,42,975 (ex-showroom). The on-road price varies by city. Would you like me to get you the exact on-road price for your city?";
    }
    if (lowerMessage.includes('jupiter')) {
      return "The Jupiter 125 starts at ₹79,530 (ex-showroom). It's our best-selling scooter! Want me to share the on-road price for your location?";
    }
    if (lowerMessage.includes('ntorq')) {
      return "The Ntorq 125 starts at ₹86,677 (ex-showroom). The Race Edition is priced at ₹96,560. Interested in a test ride?";
    }
    if (lowerMessage.includes('iqube')) {
      return "The iQube Electric starts at ₹1,17,639 (ex-showroom) before subsidies. With government subsidies, you could save up to ₹30,000! Want more details?";
    }
    return "I'd be happy to help with pricing! Which model are you interested in - Apache series, Jupiter, Ntorq, iQube, or any other?";
  }

  if (lowerMessage.includes('test drive') || lowerMessage.includes('test ride')) {
    return "Great choice! I can help you book a test drive. Please share your preferred date, time, and the model you'd like to test. Which showroom location works best for you?";
  }

  if (lowerMessage.includes('offer') || lowerMessage.includes('discount')) {
    return "We have exciting offers this month! 🎉 Exchange bonus up to ₹10,000, low-interest EMI options, and free first-year insurance on select models. Which model are you considering?";
  }

  if (lowerMessage.includes('emi') || lowerMessage.includes('finance') || lowerMessage.includes('loan')) {
    return "We offer flexible EMI options starting from ₹2,999/month! Our finance partners include HDFC, ICICI, and Bajaj Finance with interest rates as low as 7.99%. Want me to calculate EMI for a specific model?";
  }

  if (lowerMessage.includes('insurance')) {
    openRiaWithContext('insurance', 'Insurance', null);
    return "I'll help you with insurance options! Let me show you what we offer...";
  }

  if (lowerMessage.includes('range') || lowerMessage.includes('iqube')) {
    return "The iQube Electric offers a certified range of 100+ km on a single charge! It takes about 5 hours for a full charge. The TFT display shows real-time range. Would you like to know more about its features?";
  }

  if (lowerMessage.includes('mileage') || lowerMessage.includes('fuel')) {
    return "Our bikes offer excellent mileage! Apache RTR 160 gives 45+ kmpl, Jupiter 125 delivers 52+ kmpl, and Star City+ offers an impressive 70+ kmpl. Which type of vehicle are you looking for?";
  }

  if (lowerMessage.includes('showroom') || lowerMessage.includes('dealer') || lowerMessage.includes('location')) {
    return "I can help you find the nearest TVS showroom! Could you share your city or pin code? We have an extensive network across India.";
  }

  if (lowerMessage.includes('color') || lowerMessage.includes('colour')) {
    return "Our vehicles come in multiple attractive colors! Apache series has racing-inspired colors, Jupiter offers elegant options, and Ntorq has bold, youthful shades. Which model's colors would you like to see?";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! 👋 I'm Ria, your TVS virtual assistant. I can help you with prices, specifications, test drives, offers, EMI calculations, and more. What would you like to know?";
  }

  if (lowerMessage.includes('thank')) {
    return "You're welcome! 😊 Is there anything else I can help you with? Feel free to ask about any TVS products or services!";
  }

  // Context-aware default
  if (ctx.type === 'model' && ctx.name) {
    return `What else would you like to know about the **${ctx.name}**?\n\nI can help with:\n• Pricing and EMI options\n• Specifications and features\n• Test drive booking\n• Color options\n• Comparisons`;
  }

  return "I'd be happy to help! You can ask me about:\n• Vehicle prices and offers\n• Test drive bookings\n• EMI calculations\n• Specifications and features\n• Showroom locations\n\nWhat would you like to know?";
}

// ================================================
// VOICE CALL FUNCTIONALITY
// ================================================

// Initialize Retell client when SDK is loaded
function initRetell() {
  if (typeof window.RetellWebClient !== 'undefined') {
    retellClient = new window.RetellWebClient();
    setupEventListeners();
    console.log('[Retell] Client initialized successfully');
  } else {
    console.error('[Retell] SDK not loaded yet');
  }
}

// Wait for SDK to load
window.addEventListener('retell-sdk-loaded', () => {
  console.log('[Retell] SDK loaded event received');
  initRetell();
});

// Fallback: try to initialize after a delay
setTimeout(() => {
  if (!retellClient && typeof window.RetellWebClient !== 'undefined') {
    initRetell();
  }
}, 2000);

// Setup event listeners
function setupEventListeners() {
  if (!retellClient) return;

  retellClient.on('call_started', () => {
    console.log('[Retell] Call started');
    callState = 'active';
    updateVoiceUI('active');
  });

  retellClient.on('call_ended', () => {
    console.log('[Retell] Call ended');
    callState = 'idle';
    updateVoiceUI('idle');
  });

  retellClient.on('agent_start_talking', () => {
    console.log('[Retell] Agent started talking');
    callState = 'speaking';
    updateVoiceUI('speaking');
  });

  retellClient.on('agent_stop_talking', () => {
    console.log('[Retell] Agent stopped talking');
    callState = 'listening';
    updateVoiceUI('listening');
  });

  retellClient.on('error', (error) => {
    console.error('[Retell] Error:', error);
    callState = 'idle';
    updateVoiceUI('error');
    showToast('Voice call error. Please try again.', 'error');
  });
}

// Get access token from backend with context
async function getAccessToken() {
  console.log('[Retell] Requesting access token from backend...');
  console.log('[Retell] Current context:', currentContext);

  // Build dynamic variables from context
  const dynamicVariables = {};

  if (currentContext.type) {
    dynamicVariables.context_type = currentContext.type;
    dynamicVariables.user_intent = currentContext.intent || 'general_inquiry';
  }

  if (currentContext.name) {
    dynamicVariables.selected_model = currentContext.name;
  }

  if (currentContext.data) {
    if (currentContext.data.price) {
      dynamicVariables.model_price = currentContext.data.price.toString();
    }
    if (currentContext.data.category) {
      dynamicVariables.model_category = currentContext.data.category;
    }
    if (currentContext.data.engine) {
      dynamicVariables.model_engine = currentContext.data.engine.toString() + 'cc';
    }
    if (currentContext.data.mileage) {
      dynamicVariables.model_mileage = currentContext.data.mileage.toString() + ' kmpl';
    }
  }

  // Build context prompt for the AI
  let contextPrompt = '';
  if (currentContext.type === 'model' && currentContext.name) {
    contextPrompt = `The user is interested in the ${currentContext.name}. They clicked on this model from the website. Start by acknowledging their interest in this specific model and ask what they would like to know about it - pricing, specifications, test drive booking, EMI options, or color availability.`;
  } else if (currentContext.type === 'insurance') {
    contextPrompt = 'The user is interested in insurance options. Help them understand the insurance offerings for TVS vehicles including comprehensive coverage, third-party insurance, and available add-ons.';
  } else if (currentContext.type === 'finance') {
    contextPrompt = 'The user is interested in finance and EMI options. Explain the available financing options, interest rates, down payment requirements, and loan tenure options.';
  } else if (currentContext.type === 'test_drive') {
    contextPrompt = 'The user wants to book a test drive. Help them schedule a test ride by collecting their preferred model, date, time, and location.';
  }

  if (contextPrompt) {
    dynamicVariables.context_prompt = contextPrompt;
  }

  const response = await fetch('/api/create-web-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata: {
        context_type: currentContext.type,
        selected_model: currentContext.name,
        user_intent: currentContext.intent
      },
      retell_llm_dynamic_variables: dynamicVariables
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get access token');
  }

  const data = await response.json();
  console.log('[Retell] Got access token with context');
  return data.access_token;
}

// Start voice call
async function startVoiceCall() {
  if (!retellClient) {
    showToast('Voice assistant not ready. Please refresh the page.', 'error');
    console.error('[Retell] Client not initialized');
    return;
  }

  if (callState !== 'idle') {
    console.log('[Retell] Call already in progress');
    return;
  }

  try {
    callState = 'connecting';
    updateVoiceUI('connecting');
    showToast('Connecting to Ria...', 'info');

    // Get access token from backend
    const accessToken = await getAccessToken();

    // Start the call with access token
    await retellClient.startCall({
      accessToken: accessToken,
      sampleRate: 24000,
    });

    console.log('[Retell] Call started successfully');
  } catch (error) {
    console.error('[Retell] Failed to start call:', error);
    callState = 'idle';
    updateVoiceUI('idle');

    if (error.message.includes('RETELL_API_KEY')) {
      showToast('Voice assistant not configured. Please contact support.', 'error');
    } else {
      showToast('Could not start voice call: ' + error.message, 'error');
    }
  }
}

// End voice call
function endVoiceCall() {
  if (retellClient && callState !== 'idle') {
    retellClient.stopCall();
    callState = 'idle';
    updateVoiceUI('idle');
    showToast('Call ended', 'info');
  }
}

// Toggle call (start or end)
function toggleVoiceCall() {
  if (callState === 'idle') {
    startVoiceCall();
  } else {
    endVoiceCall();
  }
}

// Update voice UI based on state
function updateVoiceUI(state) {
  const avatar = document.getElementById('voice-avatar');
  const status = document.getElementById('voice-status');
  const hint = document.getElementById('voice-hint');
  const controlBtn = document.getElementById('voice-control-btn');
  const avatarBtn = document.getElementById('ria-avatar-btn');

  if (!avatar || !controlBtn) return;

  // Remove all state classes from avatar
  avatar.classList.remove('speaking', 'listening');

  switch (state) {
    case 'idle':
      status.textContent = 'Ready to talk';
      hint.textContent = 'Click the button to start';
      controlBtn.className = 'voice-control-btn start';
      controlBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
      </svg>`;
      avatarBtn.classList.remove('active');
      break;

    case 'connecting':
      status.textContent = 'Connecting...';
      hint.textContent = 'Please wait';
      controlBtn.className = 'voice-control-btn end';
      controlBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>`;
      break;

    case 'active':
    case 'listening':
      avatar.classList.add('listening');
      status.textContent = 'Listening...';
      hint.textContent = 'Speak now';
      controlBtn.className = 'voice-control-btn end';
      controlBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>`;
      avatarBtn.classList.add('active');
      break;

    case 'speaking':
      avatar.classList.add('speaking');
      status.textContent = 'Ria is speaking...';
      hint.textContent = 'Wait for her to finish';
      controlBtn.className = 'voice-control-btn end';
      controlBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>`;
      avatarBtn.classList.add('active');
      break;

    case 'error':
      status.textContent = 'Connection error';
      hint.textContent = 'Click to try again';
      controlBtn.className = 'voice-control-btn start';
      controlBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>`;
      avatarBtn.classList.remove('active');
      break;
  }
}

// ================================================
// UTILITIES
// ================================================

// Toast notification
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast-notification fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium z-50 ${
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  toast.style.opacity = '0';
  toast.style.transform = 'translate(-50%, 20px)';
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  }, 10);

  // Animate out
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Log initialization status
console.log('[Ria] Widget script loaded');
