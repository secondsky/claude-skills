import { Conversation } from '@elevenlabs/client';

// Configuration
const AGENT_ID = 'your-agent-id';
const API_KEY = process.env.ELEVENLABS_API_KEY; // Server-side only, never expose in browser

// Initialize conversation
const conversation = new Conversation({
  agentId: AGENT_ID,

  // Authentication (choose one)
  // Option 1: API key (for private agents)
  apiKey: API_KEY,

  // Option 2: Signed URL (most secure)
  // signedUrl: 'https://api.elevenlabs.io/v1/convai/auth/...',

  // Client tools (browser-side functions)
  clientTools: {
    updateCart: {
      description: "Update shopping cart",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string" },
          quantity: { type: "number" }
        },
        required: ["item", "quantity"]
      },
      handler: async ({ item, quantity }) => {
        console.log('Cart updated:', item, quantity);
        // Your cart logic here
        return { success: true };
      }
    }
  },

  // Event handlers
  onConnect: () => {
    console.log('Connected to agent');
    updateStatus('connected');
    clearTranscript();
  },

  onDisconnect: () => {
    console.log('Disconnected from agent');
    updateStatus('disconnected');
  },

  onEvent: (event) => {
    switch (event.type) {
      case 'transcript':
        addToTranscript('user', event.data.text);
        break;

      case 'agent_response':
        addToTranscript('agent', event.data.text);
        break;

      case 'tool_call':
        console.log('Tool called:', event.data.tool_name);
        break;

      case 'error':
        console.error('Agent error:', event.data);
        showError(event.data.message);
        break;
    }
  },

  onError: (error) => {
    console.error('Connection error:', error);
    showError(error.message);
  },

  // Regional compliance
  serverLocation: 'us' // 'us' | 'global' | 'eu-residency' | 'in-residency'
});

// UI Helpers
function updateStatus(status) {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `Status: ${status}`;
  }
}

function addToTranscript(role, text) {
  const transcriptEl = document.getElementById('transcript');
  if (transcriptEl) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.innerHTML = `
      <strong>${role === 'user' ? 'You' : 'Agent'}:</strong>
      <p>${text}</p>
    `;
    transcriptEl.appendChild(messageEl);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }
}

function clearTranscript() {
  const transcriptEl = document.getElementById('transcript');
  if (transcriptEl) {
    transcriptEl.innerHTML = '';
  }
}

function showError(message) {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = `Error: ${message}`;
    errorEl.style.display = 'block';
  }
}

function hideError() {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

// Button event listeners
document.getElementById('start-btn')?.addEventListener('click', async () => {
  try {
    hideError();
    await conversation.start();
  } catch (error) {
    console.error('Failed to start conversation:', error);
    showError(error.message);
  }
});

document.getElementById('stop-btn')?.addEventListener('click', async () => {
  try {
    await conversation.stop();
  } catch (error) {
    console.error('Failed to stop conversation:', error);
    showError(error.message);
  }
});

// HTML Template
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ElevenLabs Voice Agent</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    button {
      padding: 10px 20px;
      margin: 5px;
      cursor: pointer;
    }
    #status {
      margin: 10px 0;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    #error {
      display: none;
      margin: 10px 0;
      padding: 10px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
    }
    #transcript {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }
    .message {
      margin: 10px 0;
      padding: 10px;
      border-radius: 4px;
    }
    .message.user {
      background: #e3f2fd;
    }
    .message.agent {
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <h1>ElevenLabs Voice Agent</h1>

  <div>
    <button id="start-btn">Start Conversation</button>
    <button id="stop-btn">Stop</button>
  </div>

  <div id="status">Status: disconnected</div>
  <div id="error"></div>

  <div id="transcript"></div>

  <script type="module" src="./app.js"></script>
</body>
</html>
*/
