# Unchained Wallet API

**Simple REST API for wallet connection and operations. Cookie-based authentication with localStorage support.**

## 🚀 Quick Start

**All you need to integrate is the API!** No SDK, no npm packages, no complex setup. Just make HTTP requests to these endpoints.

### Minimum Integration (3 lines of code)

```javascript
// 1. Check if wallet exists
const status = await fetch('https://wallet.com/api/wallet/status', { credentials: 'include' }).then(r => r.json());

// 2. Connect wallet
if (status.hasWallet) {
  const { redirectUrl } = await fetch('https://wallet.com/api/wallet/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ returnUrl: window.location.href })
  }).then(r => r.json());
  window.location.href = redirectUrl;
}
```

That's it! The API handles everything else.

## Base URL

```
https://your-wallet-domain.com/api
```

## Authentication

All requests use cookie-based authentication. The `unchained_user_id` cookie is automatically set when a wallet is created.

## Endpoints

### 1. Register User ID

Register a wallet address with a user ID.

```http
POST /api/wallet/register
Content-Type: application/json

{
  "userId": "usr_1234567890_abc123",
  "address": "0x1234..."
}
```

**Response:**
```json
{
  "success": true,
  "userId": "usr_1234567890_abc123"
}
```

### 2. Check Wallet Status

Check if user has a wallet.

```http
GET /api/wallet/status
Cookie: unchained_user_id=usr_1234567890_abc123
```

**Response:**
```json
{
  "exists": true,
  "hasWallet": true,
  "userId": "usr_1234567890_abc123",
  "address": "0x1234..."
}
```

### 3. Connect Wallet

Initiate wallet connection flow.

```http
POST /api/wallet/connect
Content-Type: application/json
Cookie: unchained_user_id=usr_1234567890_abc123

{
  "returnUrl": "https://dapp.com"
}
```

**Response:**
```json
{
  "redirectUrl": "https://wallet.com/connect?token=sess_...&return=https://dapp.com",
  "sessionToken": "sess_..."
}
```

### 4. Get Account

Get wallet account information.

```http
GET /api/wallet/account
Cookie: unchained_user_id=usr_1234567890_abc123
```

**Response:**
```json
{
  "userId": "usr_1234567890_abc123",
  "address": "0x1234...",
  "chainId": 1
}
```

### 5. Sign Message

Request message signature.

```http
POST /api/wallet/sign
Content-Type: application/json
Cookie: unchained_user_id=usr_1234567890_abc123

{
  "message": "Hello World",
  "returnUrl": "https://dapp.com"
}
```

**Response:**
```json
{
  "redirectUrl": "https://wallet.com/sign?method=personal_sign&message=...&requestId=req_...&return=...",
  "requestId": "req_..."
}
```

### 6. Send Transaction

Request transaction signing.

```http
POST /api/wallet/transaction
Content-Type: application/json
Cookie: unchained_user_id=usr_1234567890_abc123

{
  "tx": {
    "to": "0x...",
    "value": "0x0",
    "data": "0x"
  },
  "returnUrl": "https://dapp.com"
}
```

**Response:**
```json
{
  "redirectUrl": "https://wallet.com/sign?method=eth_sendTransaction&params=...&requestId=req_...&return=...",
  "requestId": "req_..."
}
```

### 7. RPC Proxy

Proxy RPC calls to blockchain.

```http
POST /api/rpc
Content-Type: application/json

{
  "method": "eth_getBalance",
  "params": ["0x1234...", "latest"],
  "chainId": 1
}
```

**Response:**
```json
{
  "result": "0x1234567890abcdef"
}
```

## Integration Guide

**All you need to integrate is the API endpoints!** No SDK, no complex setup - just simple API calls.

### Simple HTML Example

Here's a complete working example for a simple HTML website:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My dApp - Connect Unchained Wallet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #0a0a0a;
            color: white;
        }
        button {
            background: #00ff88;
            color: black;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 0;
        }
        button:hover {
            background: #00cc6a;
        }
        button:disabled {
            background: #666;
            cursor: not-allowed;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .connected {
            background: #00ff8820;
            border: 1px solid #00ff88;
        }
        .disconnected {
            background: #ff000020;
            border: 1px solid #ff0000;
        }
    </style>
</head>
<body>
    <h1>My dApp</h1>
    
    <div id="status" class="status disconnected">
        <p>Wallet Status: <span id="statusText">Not Connected</span></p>
        <p id="addressText" style="display: none;">Address: <span id="address"></span></p>
    </div>
    
    <button id="connectBtn" onclick="connectWallet()">Connect Unchained Wallet</button>
    <button id="disconnectBtn" onclick="disconnectWallet()" style="display: none;">Disconnect</button>
    <button id="signBtn" onclick="signMessage()" style="display: none;">Sign Message</button>
    
    <script>
        const API_BASE = 'https://your-wallet-domain.com/api'; // Replace with your wallet domain
        
        // Check wallet status on page load
        async function checkWalletStatus() {
            try {
                const response = await fetch(`${API_BASE}/wallet/status`, {
                    credentials: 'include' // Important: sends cookies
                });
                const status = await response.json();
                
                if (status.hasWallet) {
                    updateUI(true, status.address);
                } else {
                    updateUI(false);
                }
            } catch (error) {
                console.error('Error checking wallet:', error);
                updateUI(false);
            }
        }
        
        // Connect wallet
        async function connectWallet() {
            try {
                const response = await fetch(`${API_BASE}/wallet/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        returnUrl: window.location.href
                    })
                });
                const data = await response.json();
                
                if (data.redirectUrl) {
                    // Redirect to wallet for approval
                    window.location.href = data.redirectUrl;
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
                alert('Failed to connect wallet');
            }
        }
        
        // Get account info
        async function getAccount() {
            try {
                const response = await fetch(`${API_BASE}/wallet/account`, {
                    credentials: 'include'
                });
                const account = await response.json();
                return account;
            } catch (error) {
                console.error('Error getting account:', error);
                return null;
            }
        }
        
        // Sign message
        async function signMessage() {
            const message = prompt('Enter message to sign:');
            if (!message) return;
            
            try {
                const response = await fetch(`${API_BASE}/wallet/sign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: message,
                        returnUrl: window.location.href
                    })
                });
                const data = await response.json();
                
                if (data.redirectUrl) {
                    // Redirect to wallet for signing
                    window.location.href = data.redirectUrl;
                }
            } catch (error) {
                console.error('Error signing message:', error);
                alert('Failed to sign message');
            }
        }
        
        // Send transaction
        async function sendTransaction(tx) {
            try {
                const response = await fetch(`${API_BASE}/wallet/transaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        tx: tx,
                        returnUrl: window.location.href
                    })
                });
                const data = await response.json();
                
                if (data.redirectUrl) {
                    // Redirect to wallet for approval
                    window.location.href = data.redirectUrl;
                }
            } catch (error) {
                console.error('Error sending transaction:', error);
                alert('Failed to send transaction');
            }
        }
        
        // RPC call
        async function rpcCall(method, params, chainId = 1) {
            try {
                const response = await fetch(`${API_BASE}/rpc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method: method,
                        params: params,
                        chainId: chainId
                    })
                });
                const data = await response.json();
                return data.result;
            } catch (error) {
                console.error('RPC error:', error);
                throw error;
            }
        }
        
        // Update UI
        function updateUI(connected, address) {
            const statusDiv = document.getElementById('status');
            const statusText = document.getElementById('statusText');
            const addressText = document.getElementById('addressText');
            const addressSpan = document.getElementById('address');
            const connectBtn = document.getElementById('connectBtn');
            const disconnectBtn = document.getElementById('disconnectBtn');
            const signBtn = document.getElementById('signBtn');
            
            if (connected) {
                statusDiv.className = 'status connected';
                statusText.textContent = 'Connected';
                addressText.style.display = 'block';
                addressSpan.textContent = address || 'Loading...';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                signBtn.style.display = 'inline-block';
            } else {
                statusDiv.className = 'status disconnected';
                statusText.textContent = 'Not Connected';
                addressText.style.display = 'none';
                connectBtn.style.display = 'inline-block';
                disconnectBtn.style.display = 'none';
                signBtn.style.display = 'none';
            }
        }
        
        // Disconnect (just clears local state)
        function disconnectWallet() {
            updateUI(false);
        }
        
        // Check for return from wallet
        window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const walletStatus = urlParams.get('wallet_status');
            const walletResult = urlParams.get('wallet_result');
            
            if (walletStatus === 'approved' && walletResult) {
                // Connection/signing successful
                checkWalletStatus();
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            } else if (walletStatus === 'rejected') {
                alert('User rejected the request');
                window.history.replaceState({}, '', window.location.pathname);
            } else {
                // Normal page load
                checkWalletStatus();
            }
        });
    </script>
</body>
</html>
```

### JavaScript Framework Example (React)

```javascript
import { useState, useEffect } from 'react';

const API_BASE = 'https://your-wallet-domain.com/api';

function App() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    const response = await fetch(`${API_BASE}/wallet/status`, {
      credentials: 'include'
    });
    const status = await response.json();
    
    if (status.hasWallet) {
      setConnected(true);
      setAddress(status.address);
    }
  };

  const connectWallet = async () => {
    const response = await fetch(`${API_BASE}/wallet/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        returnUrl: window.location.href
      })
    });
    const { redirectUrl } = await response.json();
    window.location.href = redirectUrl;
  };

  return (
    <div>
      {connected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={connectWallet}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
// Simple integration - just copy and paste!

const UNCHAINED_API = 'https://your-wallet-domain.com/api';

// Check if wallet exists
async function hasUnchainedWallet() {
  const response = await fetch(`${UNCHAINED_API}/wallet/status`, {
    credentials: 'include'
  });
  const { hasWallet } = await response.json();
  return hasWallet;
}

// Connect wallet
async function connectUnchainedWallet() {
  const response = await fetch(`${UNCHAINED_API}/wallet/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ returnUrl: window.location.href })
  });
  const { redirectUrl } = await response.json();
  window.location.href = redirectUrl;
}

// Get account
async function getUnchainedAccount() {
  const response = await fetch(`${UNCHAINED_API}/wallet/account`, {
    credentials: 'include'
  });
  return await response.json();
}

// Sign message
async function signWithUnchained(message) {
  const response = await fetch(`${UNCHAINED_API}/wallet/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, returnUrl: window.location.href })
  });
  const { redirectUrl } = await response.json();
  window.location.href = redirectUrl;
}

// Send transaction
async function sendUnchainedTransaction(tx) {
  const response = await fetch(`${UNCHAINED_API}/wallet/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tx, returnUrl: window.location.href })
  });
  const { redirectUrl } = await response.json();
  window.location.href = redirectUrl;
}
```

## How It Works

1. **User creates wallet** → `userId` generated and stored in localStorage
2. **Cookie set** → `unchained_user_id` cookie set for cross-domain detection
3. **API registration** → Wallet address registered with API using userId
4. **dApp calls API** → API reads cookie to identify user
5. **API verifies** → Checks if userId exists in registry
6. **Returns result** → Wallet info or redirect URL

## Important Notes

- **All you need is the API!** No SDK, no npm packages, no complex setup
- Just make HTTP requests to the API endpoints
- All storage is localStorage-based (client-side)
- API uses in-memory storage (use database in production)
- Cookies enable cross-domain wallet detection
- userId is generated on wallet creation: `usr_timestamp_random`
- **Reset Wallet** deletes everything including cookies and localStorage

## Reset Wallet

When a user clicks "Reset Wallet" in the wallet settings:
- All localStorage data is cleared
- All cookies are deleted (including `unchained_user_id`)
- User is redirected to setup page
- User must create a new wallet to use the API again

This ensures complete data removal for privacy and security.

