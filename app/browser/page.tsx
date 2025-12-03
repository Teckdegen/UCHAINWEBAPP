"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWalletState } from "@/lib/wallet"
import { ArrowLeft, Home, RefreshCw, Plus, X, ExternalLink, Monitor, History, Trash2 } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import Link from "next/link"

const POPULAR_DAPPS = [
  { name: "Uniswap", url: "https://app.uniswap.org", icon: "🦄" },
  { name: "Aave", url: "https://app.aave.com", icon: "👻" },
  { name: "Curve", url: "https://curve.fi", icon: "📈" },
  { name: "OpenSea", url: "https://opensea.io", icon: "🌊" },
  { name: "Lido", url: "https://lido.fi", icon: "🔷" },
  { name: "Compound", url: "https://compound.finance", icon: "💱" },
]

export default function BrowserPage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [currentUrl, setCurrentUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [tabs, setTabs] = useState<{ id: string; url: string; title: string }[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [desktopMode, setDesktopMode] = useState(false)
  const [history, setHistory] = useState<{ url: string; title: string; timestamp: number }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [showNavBar, setShowNavBar] = useState(true)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    // No password required for browser
    const savedHistory = localStorage.getItem("browser_history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    // Inject window.ethereum into iframe when it loads
    const injectEthereumProvider = () => {
      if (!iframeRef.current || !currentUrl) return

      try {
        const iframe = iframeRef.current
        const iframeWindow = iframe.contentWindow
        
        if (!iframeWindow) return

        // Inject ethereum provider script into iframe
        const script = `
          (function() {
            if (window.ethereum && window.ethereum.isUnchained) {
              return; // Already injected
            }

            const walletOrigin = '${window.location.origin}';
            
            // Create ethereum provider
            const provider = {
              isUnchained: true,
              isMetaMask: true,
              isCoinbaseWallet: true,
              
              request: async (args) => {
                const { method, params = [] } = args;
                const requestId = Math.random().toString(36).substring(7);
                
                // Send request to parent (browser page)
                return new Promise((resolve, reject) => {
                  // Store resolve/reject for later
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
              },
              
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
              
              chainId: '0x1',
              networkVersion: '1'
            };
            
            Object.defineProperty(window, 'ethereum', {
              value: provider,
              writable: false,
              configurable: false
            });
            
            // Dispatch initialized event
            window.dispatchEvent(new Event('ethereum#initialized'));
          })();
        `;

        // Try to inject script into iframe
        // Note: This only works for same-origin iframes
        // For cross-origin, we'll use postMessage
        try {
          iframeWindow.eval(script);
        } catch (e) {
          // Cross-origin iframe - can't inject directly
          // We'll handle via postMessage from iframe
          console.log('[Browser] Cross-origin iframe, will use postMessage');
        }
      } catch (error) {
        console.error('[Browser] Error injecting ethereum provider:', error);
      }
    };

    // Inject when iframe loads
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        setTimeout(injectEthereumProvider, 500); // Wait for iframe to fully load
      };
      
      // Also try immediately if already loaded
      if (iframe.contentDocument?.readyState === 'complete') {
        injectEthereumProvider();
      }
    }

    // Listen for messages from iframe
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      if (event.data.type === 'UNCHAINED_WALLET_REQUEST') {
        const { requestId, method, params, origin } = event.data;
        
        // Store request info
        localStorage.setItem(`browser_request_${requestId}`, JSON.stringify({
          method,
          params,
          origin,
          timestamp: Date.now()
        }));
        
        // Redirect to web wallet based on method
        if (method === 'eth_requestAccounts') {
          // Redirect to connect page
          const connectUrl = `${window.location.origin}/connect?origin=${encodeURIComponent(origin)}&method=${encodeURIComponent(method)}&requestId=${requestId}&from=browser`;
          window.location.href = connectUrl;
        } else if (method === 'eth_sendTransaction' || method === 'eth_sign' || method === 'personal_sign') {
          // Redirect to sign page
          const signUrl = `${window.location.origin}/sign?method=${encodeURIComponent(method)}&params=${encodeURIComponent(JSON.stringify(params))}&origin=${encodeURIComponent(origin)}&requestId=${requestId}&from=browser`;
          window.location.href = signUrl;
        } else {
          // For other methods, try to handle directly or redirect
          const connectUrl = `${window.location.origin}/connect?origin=${encodeURIComponent(origin)}&method=${encodeURIComponent(method)}&requestId=${requestId}&from=browser`;
          window.location.href = connectUrl;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router, currentUrl])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("browser_history", JSON.stringify(history.slice(0, 50)))
    }
  }, [history])

  // Check for return from wallet approval and send result to iframe
  useEffect(() => {
    if (!currentUrl || !iframeRef.current) return

    // Check URL params for wallet result
    const urlParams = new URLSearchParams(window.location.search)
    const walletStatus = urlParams.get("wallet_status")
    const requestId = urlParams.get("requestId")

    if (walletStatus === "approved" && requestId) {
      // Get result from localStorage
      const resultStr = localStorage.getItem(`browser_result_${requestId}`)
      if (resultStr) {
        try {
          const result = JSON.parse(resultStr)
          
          // Send result to iframe
          if (iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: "UNCHAINED_WALLET_RESPONSE",
              requestId,
              result: result.accounts || result
            }, "*") // Use * for cross-origin, or specific origin if known
          }
          
          // Clean up
          localStorage.removeItem(`browser_result_${requestId}`)
          localStorage.removeItem(`browser_request_${requestId}`)
          
          // Clean URL
          window.history.replaceState({}, "", window.location.pathname)
        } catch (e) {
          console.error("[Browser] Error parsing result:", e)
        }
      }
    }
  }, [currentUrl])

  // Hide both header and nav bar when searching
  useEffect(() => {
    if (isSearchFocused || url.length > 0) {
      setShowNavBar(false)
      setShowHeader(false)
    }
  }, [isSearchFocused, url])

  const handleNavigate = (targetUrl: string) => {
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl
    }

    setCurrentUrl(targetUrl)
    setUrl(targetUrl)
    setLoading(true)
    setShowHistory(false)
    setIsSearchFocused(false) // Reset search focus after navigation

    const newEntry = {
      url: targetUrl,
      title: new URL(targetUrl).hostname,
      timestamp: Date.now(),
    }
    setHistory((prev) => [newEntry, ...prev.filter((h) => h.url !== targetUrl)])

    setTimeout(() => setLoading(false), 1000)
  }

  const openNewTab = (url: string) => {
    const tabId = Math.random().toString(36).substring(7)
    const newTab = { id: tabId, url, title: url }
    setTabs([...tabs, newTab])
    setActiveTab(tabId)
    handleNavigate(url)
  }

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((t) => t.id !== tabId)
    setTabs(newTabs)
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[0].id)
      handleNavigate(newTabs[0].url)
    } else if (newTabs.length === 0) {
      setCurrentUrl("")
      setUrl("")
      setIsSearchFocused(false)
      setShowHeader(true)
      setShowNavBar(true)
    }
  }

  const goHome = () => {
    setCurrentUrl("")
    setUrl("")
    setIsSearchFocused(false)
    setShowHeader(true)
    setShowNavBar(true)
  }

  const clearHistory = () => {
    if (confirm("Clear all browser history?")) {
      setHistory([])
      localStorage.removeItem("browser_history")
    }
  }

  const toggleHeader = () => {
    // When clicking screen, show both header and nav bar if they're hidden
    if (!showHeader || !showNavBar) {
      setShowHeader(true)
      setShowNavBar(true)
      setIsSearchFocused(false)
    } else if (currentUrl) {
      // If both are visible and we have a URL, hide them
      setShowHeader(false)
      setShowNavBar(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header - Just the search bar, no extra space */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Just the search bar - minimal padding */}
        <div className="flex gap-2 items-center px-2 py-1.5 bg-black/80 backdrop-blur-sm">
          {currentUrl && (
            <Link href="/dashboard" className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex gap-1 items-center bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 flex-1 min-w-0">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleNavigate(url)
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (url.length === 0) {
                    setIsSearchFocused(false)
                  }
                }, 200)
              }}
              placeholder="Enter URL..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/60 min-w-0"
            />
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleNavigate(url)
              }} 
              className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 text-white" /> : <Home className="w-4 h-4 text-white" />}
            </button>
          </div>
          {currentUrl && (
            <button
              onClick={() => setDesktopMode(!desktopMode)}
              className={`p-1.5 rounded transition-colors flex items-center flex-shrink-0 ${
                desktopMode ? "bg-green-500/30 text-green-400" : "hover:bg-white/10 text-white"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs - Only show if there are tabs, minimal space */}
        {tabs.length > 0 && (
          <div className="flex gap-1 overflow-x-auto px-2 pb-1 bg-black/80 backdrop-blur-sm">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                handleNavigate(tab.url)
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs whitespace-nowrap cursor-pointer transition-colors flex-shrink-0 ${
                activeTab === tab.id ? "bg-green-500/30 text-green-400" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <span className="truncate max-w-xs">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="p-0.5 hover:bg-white/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => openNewTab("")}
            className="px-2 py-0.5 rounded text-xs bg-white/10 hover:bg-white/20 flex items-center flex-shrink-0 text-white"
          >
            <Plus className="w-3 h-3" />
          </button>
          {currentUrl && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-0.5 rounded text-xs bg-white/10 hover:bg-white/20 flex items-center flex-shrink-0 text-white"
            >
              <History className="w-3 h-3" />
            </button>
          )}
        </div>
        )}
      </div>

      {/* Floating Search Bar - Shows when header is hidden */}
      {!showHeader && (
        <div className="fixed top-4 left-4 right-4 z-[60] max-w-2xl mx-auto">
          <div className="flex gap-2 items-center glass-card border border-white/10 rounded-lg px-3 py-2 shadow-2xl">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleNavigate(url)
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (url.length === 0) {
                    setIsSearchFocused(false)
                  }
                }, 200)
              }}
              placeholder="Enter URL..."
              className="flex-1 bg-transparent outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleNavigate(url)
              }} 
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 w-full overflow-hidden transition-all duration-300 ${!showHeader ? "pt-0" : tabs.length > 0 ? "pt-20" : "pt-12"} ${!showNavBar ? "pb-0" : ""}`}>
        {currentUrl ? (
          <div className="w-full h-full bg-white/5 overflow-hidden relative">
            {/* Clickable areas to show header/nav when hidden - larger areas for easier clicking */}
            {!showHeader && (
              <div 
                className="absolute top-0 left-0 right-0 h-24 z-50"
                onClick={toggleHeader}
                onTouchStart={toggleHeader}
              />
            )}
            {!showNavBar && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-24 z-50"
                onClick={toggleHeader}
                onTouchStart={toggleHeader}
              />
            )}
            {/* Floating button to show UI when hidden */}
            {(!showHeader || !showNavBar) && (
              <button
                onClick={toggleHeader}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] glass-card border border-white/20 rounded-full p-3 shadow-2xl hover:bg-white/10 transition-all"
                style={{ pointerEvents: 'auto' }}
              >
                <Monitor className="w-5 h-5 text-white" />
              </button>
            )}
            
            {showHistory && (
              <div className="absolute top-0 left-0 right-0 bg-black border-b border-white/10 z-40 max-h-96 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm">History</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearHistory()
                      }}
                      className="p-1 hover:bg-white/10 rounded text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-xs text-gray-400">No history</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigate(item.url)
                            setShowHistory(false)
                          }}
                          className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-xs"
                        >
                          <p className="font-semibold text-green-400 truncate">{item.title}</p>
                          <p className="text-gray-400 text-xs truncate">{item.url}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <iframe
              key={`${currentUrl}-${desktopMode}`}
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0 bg-white"
              title="Unchained Browser"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-pointer-lock"
            />
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full">
            <div>
              <h2 className="text-lg font-bold mb-4">Popular Apps</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {POPULAR_DAPPS.map((dapp) => (
                  <button
                    key={dapp.name}
                    onClick={() => openNewTab(dapp.url)}
                    className="glass-card p-4 text-center hover:bg-white/10 transition-all group"
                  >
                    <div className="text-3xl mb-2">{dapp.icon}</div>
                    <p className="text-sm font-semibold mb-1">{dapp.name}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400 group-hover:text-green-400">
                      Open <ExternalLink className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold mb-3">Unchained Browser Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Integrated wallet access across all apps</li>
                <li>• Multiple tabs for browsing</li>
                <li>• Full browsing history tracking</li>
                <li>• Desktop site mode for mobile</li>
                <li>• All transactions signed securely</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav - Fixed at bottom, can be hidden */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showNavBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <BottomNav active="browser" />
      </div>
    </div>
  )
}
