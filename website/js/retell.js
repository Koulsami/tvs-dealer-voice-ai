// Retell AI Configuration
const RETELL_AGENT_ID = 'agent_2c149db1a0a0a022c2c2b7878f';

// Widget state management
let retellClient = null;
let callState = 'idle'; // idle, connecting, active, speaking, listening

// Initialize Retell client
function initRetell() {
  if (typeof RetellWebClient !== 'undefined') {
    retellClient = new RetellWebClient();
    setupEventListeners();
    console.log('Retell client initialized');
  } else {
    console.error('Retell SDK not loaded');
  }
}

// Setup event listeners
function setupEventListeners() {
  if (!retellClient) return;

  retellClient.on('call_started', () => {
    console.log('Call started');
    callState = 'active';
    updateWidgetState('active');
  });

  retellClient.on('call_ended', () => {
    console.log('Call ended');
    callState = 'idle';
    updateWidgetState('idle');
  });

  retellClient.on('agent_start_talking', () => {
    callState = 'speaking';
    updateWidgetState('speaking');
  });

  retellClient.on('agent_stop_talking', () => {
    callState = 'listening';
    updateWidgetState('listening');
  });

  retellClient.on('error', (error) => {
    console.error('Retell error:', error);
    callState = 'idle';
    updateWidgetState('error');
    showToast('Voice call error. Please try again.', 'error');
  });
}

// Start voice call
async function startVoiceCall() {
  if (!retellClient) {
    showToast('Voice assistant not ready. Please refresh.', 'error');
    return;
  }

  if (callState !== 'idle') {
    console.log('Call already in progress');
    return;
  }

  try {
    callState = 'connecting';
    updateWidgetState('connecting');

    await retellClient.startCall({
      agentId: RETELL_AGENT_ID,
      sampleRate: 24000,
      enableUpdate: true
    });
  } catch (error) {
    console.error('Failed to start call:', error);
    callState = 'idle';
    updateWidgetState('idle');
    showToast('Could not start voice call. Please try again.', 'error');
  }
}

// End voice call
function endVoiceCall() {
  if (retellClient && callState !== 'idle') {
    retellClient.stopCall();
    callState = 'idle';
    updateWidgetState('idle');
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

// Update widget UI based on state
function updateWidgetState(state) {
  const widget = document.getElementById('voice-widget');
  const widgetButton = document.getElementById('voice-widget-btn');
  const widgetIcon = document.getElementById('widget-icon');
  const widgetText = document.getElementById('widget-text');
  const pulseRing = document.getElementById('pulse-ring');

  if (!widget || !widgetButton) return;

  // Remove all state classes
  widget.classList.remove('idle', 'connecting', 'active', 'speaking', 'listening', 'error');
  widget.classList.add(state);

  switch (state) {
    case 'idle':
      widgetIcon.innerHTML = microphoneIcon;
      widgetText.textContent = 'Talk to Us';
      widgetButton.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-red-500');
      widgetButton.classList.add('bg-tvs-red');
      if (pulseRing) pulseRing.classList.add('hidden');
      break;

    case 'connecting':
      widgetIcon.innerHTML = loadingIcon;
      widgetText.textContent = 'Connecting...';
      widgetButton.classList.remove('bg-tvs-red', 'bg-green-500', 'bg-blue-500', 'bg-red-500');
      widgetButton.classList.add('bg-yellow-500');
      if (pulseRing) pulseRing.classList.add('hidden');
      break;

    case 'active':
    case 'listening':
      widgetIcon.innerHTML = listeningIcon;
      widgetText.textContent = 'Listening...';
      widgetButton.classList.remove('bg-tvs-red', 'bg-yellow-500', 'bg-blue-500', 'bg-red-500');
      widgetButton.classList.add('bg-green-500');
      if (pulseRing) pulseRing.classList.remove('hidden');
      break;

    case 'speaking':
      widgetIcon.innerHTML = speakingIcon;
      widgetText.textContent = 'Ria is speaking...';
      widgetButton.classList.remove('bg-tvs-red', 'bg-yellow-500', 'bg-green-500', 'bg-red-500');
      widgetButton.classList.add('bg-blue-500');
      if (pulseRing) pulseRing.classList.remove('hidden');
      break;

    case 'error':
      widgetIcon.innerHTML = errorIcon;
      widgetText.textContent = 'Try again';
      widgetButton.classList.remove('bg-tvs-red', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500');
      widgetButton.classList.add('bg-red-500');
      if (pulseRing) pulseRing.classList.add('hidden');
      break;
  }
}

// Icons (SVG)
const microphoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
</svg>`;

const loadingIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
</svg>`;

const listeningIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
</svg>`;

const speakingIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
</svg>`;

const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>`;

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-24 right-6 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50 ${
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Retell SDK to load
  setTimeout(initRetell, 1000);
});
