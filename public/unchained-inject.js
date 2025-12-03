/**
 * Unchained Wallet Injector Script
 * This script is injected into iframes to provide window.ethereum
 * It acts like a browser extension, redirecting to the wallet for approvals
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.ethereum && window.ethereum.isUnchained) {
    return;
  }

  // Detect if we're in an iframe
  const isInIframe = window.self !== window.top;
  
  // Get wallet origin from parent or use current origin
  const walletOrigin = isInIframe 
    ? (window.parent.location.origin || window.location.origin)
    : window.location.origin;

  // Create the ethereum provider
  const provider = {
    isUnchained: true,
    isMetaMask: true,  // For compatibility
    isCoinbaseWallet: true,  // For compatibility
    
    // Request method - intercepts all requests
    request: async (args) => {
      const { method, params = [] } = args;
      const requestId = Math.random().toString(36).substring(7);
      
      // If in iframe, send to parent
      if (isInIframe) {
        return new Promise((resolve, reject) => {
          // Store resolve/reject
          window._unchainedPendingRequests = window._unchainedPendingRequests || {};
          window._unchainedPendingRequests[requestId] = { resolve, reject };
          
          // Send message to parent
          window.parent.postMessage({
            type: 'UNCHAINED_WALLET_REQUEST',
            requestId,
            method,
            params,
            origin: window.location.origin
          }, walletOrigin);
          
          // Listen for response
          const messageListener = (event) => {
            if (event.origin !== walletOrigin) return;
            if (event.data.type === 'UNCHAINED_WALLET_RESPONSE' && event.data.requestId === requestId) {
              window.removeEventListener('message', messageListener);
              delete window._unchainedPendingRequests[requestId];
              
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data.result);
              }
            }
          };
          
          window.addEventListener('message', messageListener);
          
          // Timeout after 5 minutes
          setTimeout(() => {
            window.removeEventListener('message', messageListener);
            delete window._unchainedPendingRequests[requestId];
            reject(new Error('Request timeout'));
          }, 300000);
        });
      } else {
        // Not in iframe - redirect directly
        const redirectUrl = `${walletOrigin}/connect?origin=${encodeURIComponent(window.location.origin)}&method=${encodeURIComponent(method)}&requestId=${requestId}`;
        window.location.href = redirectUrl;
        
        // This will never resolve because we're redirecting
        return new Promise(() => {});
      }
    },
    
    // Event listeners
    on: (event, listener) => {
      window._unchainedListeners = window._unchainedListeners || {};
      window._unchainedListeners[event] = window._unchainedListeners[event] || [];
      window._unchainedListeners[event].push(listener);
    },
    
    removeListener: (event, listener) => {
      if (window._unchainedListeners && window._unchainedListeners[event]) {
        window._unchainedListeners[event] = window._unchainedListeners[event].filter(l => l !== listener);
      }
    },
    
    removeAllListeners: (event) => {
      if (event) {
        if (window._unchainedListeners) {
          delete window._unchainedListeners[event];
        }
      } else {
        window._unchainedListeners = {};
      }
    },
    
    // Chain ID (will be updated)
    get chainId() {
      return '0x1'; // Default to Ethereum
    },
    
    // Network version
    get networkVersion() {
      return '1';
    }
  };
  
  // Make chainId reactive
  Object.defineProperty(provider, 'chainId', {
    get: () => '0x1',
    configurable: true,
    enumerable: true,
  });
  
  // Inject into window
  Object.defineProperty(window, 'ethereum', {
    value: provider,
    writable: false,
    configurable: false
  });
  
  // Dispatch initialized event
  window.dispatchEvent(new Event('ethereum#initialized'));
  
  console.log('[Unchained Wallet] Provider injected', { isInIframe, walletOrigin });
})();

