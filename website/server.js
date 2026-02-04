require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Retell API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_2c149db1a0a0a022c2c2b7878f';

// Log configuration status on startup
console.log('=== TVS Demo Website Configuration ===');
console.log('RETELL_API_KEY:', RETELL_API_KEY ? 'Configured' : 'NOT SET - Voice calls will fail!');
console.log('RETELL_AGENT_ID:', RETELL_AGENT_ID);
console.log('=====================================');

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

app.listen(PORT, () => {
  console.log(`TVS Demo Website running on port ${PORT}`);
});
