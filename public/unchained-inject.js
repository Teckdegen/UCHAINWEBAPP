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
      
      // Store request info in parent's localStorage (via postMessage)
      // Then redirect parent window to wallet
      if (isInIframe) {
        // Send request info to parent first
        window.parent.postMessage({
          type: 'UNCHAINED_STORE_REQUEST',
          requestId,
          method,
          params,
          origin: window.location.origin,
          iframeUrl: window.location.href
        }, walletOrigin);
        
        // Redirect parent window to wallet (like extension does)
        const redirectUrl = method === 'eth_requestAccounts'
          ? `${walletOrigin}/connect?origin=${encodeURIComponent(window.location.origin)}&method=${encodeURIComponent(method)}&requestId=${requestId}&from=browser&iframeUrl=${encodeURIComponent(window.location.href)}`
          : `${walletOrigin}/sign?method=${encodeURIComponent(method)}&params=${encodeURIComponent(JSON.stringify(params))}&origin=${encodeURIComponent(window.location.origin)}&requestId=${requestId}&from=browser&iframeUrl=${encodeURIComponent(window.location.href)}`;
        
        // Redirect parent window
        try {
          window.top.location.href = redirectUrl;
        } catch (e) {
          // If can't access top, try parent
          window.parent.location.href = redirectUrl;
        }
        
        // Return promise that will be resolved when we return
        return new Promise((resolve, reject) => {
          window._unchainedPendingRequests = window._unchainedPendingRequests || {};
          window._unchainedPendingRequests[requestId] = { resolve, reject };
          
          // Listen for response when page returns
          const checkForResult = setInterval(() => {
            // Check localStorage for result (parent will set it)
            try {
              const resultStr = window.localStorage.getItem(`unchained_result_${requestId}`);
              const errorStr = window.localStorage.getItem(`unchained_error_${requestId}`);
              
              if (resultStr || errorStr) {
                clearInterval(checkForResult);
                delete window._unchainedPendingRequests[requestId];
                window.localStorage.removeItem(`unchained_result_${requestId}`);
                window.localStorage.removeItem(`unchained_error_${requestId}`);
                
                if (errorStr) {
                  reject(new Error(errorStr));
                } else {
                  try {
                    const result = JSON.parse(resultStr);
                    resolve(result.accounts || result);
                  } catch (e) {
                    resolve(resultStr);
                  }
                }
              }
            } catch (e) {
              // Cross-origin - can't access localStorage
            }
          }, 100);
          
          // Also listen for postMessage response
          const messageListener = (event) => {
            if (event.origin !== walletOrigin) return;
            if (event.data.type === 'UNCHAINED_WALLET_RESPONSE' && event.data.requestId === requestId) {
              clearInterval(checkForResult);
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
            clearInterval(checkForResult);
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

