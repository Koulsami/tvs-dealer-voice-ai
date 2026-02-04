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
  }
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

// Simple response generator (replace with actual AI backend in production)
function generateResponse(message) {
  const lowerMessage = message.toLowerCase();

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

// Get access token from backend
async function getAccessToken() {
  console.log('[Retell] Requesting access token from backend...');

  const response = await fetch('/api/create-web-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata: {},
      retell_llm_dynamic_variables: {}
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get access token');
  }

  const data = await response.json();
  console.log('[Retell] Got access token');
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
