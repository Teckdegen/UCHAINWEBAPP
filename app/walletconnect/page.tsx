"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getWallets } from "@/lib/wallet"
import { CheckCircle, XCircle, Copy } from "lucide-react"

function WalletConnectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [uri, setUri] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // Check if URI is provided in URL params (deeplink)
    const uriParam = searchParams.get("uri")
    if (uriParam) {
      setUri(decodeURIComponent(uriParam))
      handlePair(uriParam)
    }
  }, [router, searchParams])

  const handlePair = async (pairingUri?: string) => {
    const uriToPair = pairingUri || uri.trim()
    
    if (!uriToPair) {
      setError("Please enter a WalletConnect URI")
      return
    }

    if (!uriToPair.startsWith("wc:")) {
      setError("Invalid WalletConnect URI. Must start with 'wc:'")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Import WalletConnect module
      const wcMod = await import("@/lib/walletConnect")
      
      // Pair with the URI
      await wcMod.pair(uriToPair)
      
      setSuccess("Successfully paired! You will be redirected to approve the connection...")
      
      // The WalletConnect client will automatically handle the session_proposal event
      // and redirect to /connect page
      setTimeout(() => {
        // If not redirected automatically, check for proposal
        const proposalId = localStorage.getItem("wc_proposal_id")
        if (proposalId) {
          router.push(`/connect?wc_proposal=${proposalId}`)
        }
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Failed to pair with WalletConnect URI")
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (uri) {
      navigator.clipboard.writeText(uri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">WalletConnect Deeplink</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 glass-card hover:bg-white/10 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Connect via WalletConnect URI</h2>
            <p className="text-sm text-gray-400 mb-4">
              Paste a WalletConnect URI (starts with <code className="bg-black/50 px-1 rounded">wc:</code>) to connect to a dApp.
              You can also use a deeplink like: <code className="bg-black/50 px-1 rounded">your-app.com/walletconnect?uri=wc:...</code>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400">WalletConnect URI</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="wc:..."
                className="flex-1 input-field"
                disabled={loading}
              />
              {uri && (
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 glass-card hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="glass-card p-4 border border-green-500/50 bg-green-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => handlePair()}
            disabled={loading || !uri.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Pairing..." : "Connect"}
          </button>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">How to get a WalletConnect URI:</h3>
          <div className="space-y-4 text-sm text-gray-400">
            <div>
              <strong className="text-white">Method 1: From a dApp (Most Common)</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                <li>Go to any dApp that supports WalletConnect (Uniswap, Aave, OpenSea, etc.)</li>
                <li>Click "Connect Wallet" or "WalletConnect" button</li>
                <li>The dApp will show a QR code or a connection link</li>
                <li>Copy the WalletConnect URI (starts with <code className="bg-black/50 px-1 rounded">wc:</code>)</li>
                <li>Paste it here to connect</li>
              </ol>
            </div>
            
            <div>
              <strong className="text-white">Method 2: From a QR Code</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                <li>Scan a WalletConnect QR code with your phone</li>
                <li>The QR code contains a WalletConnect URI</li>
                <li>Copy the URI from the scanned result</li>
                <li>Paste it here</li>
              </ol>
            </div>
            
            <div>
              <strong className="text-white">Method 3: Direct Link</strong>
              <p className="mt-2 ml-2">
                Some dApps provide direct links. If you see a link like:
              </p>
              <code className="block bg-black/50 p-2 rounded text-xs break-all mt-2 ml-2">
                https://app.uniswap.org/connect?uri=wc:...
              </code>
              <p className="mt-2 ml-2">
                Copy the part after <code className="bg-black/50 px-1 rounded">uri=</code> (the <code className="bg-black/50 px-1 rounded">wc:...</code> part)
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">How to use the URI:</h3>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>Paste the WalletConnect URI in the input field above</li>
            <li>Click "Connect" to pair</li>
            <li>You'll be redirected to approve the connection</li>
            <li>After approval, you're connected!</li>
          </ol>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Example WalletConnect URI Format:</h3>
          <code className="block bg-black/50 p-3 rounded text-xs break-all">
            wc:1234567890abcdef@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=abc123def456
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Note: This is just an example format. Real URIs are longer and unique for each connection.
          </p>
        </div>

        <div className="glass-card p-6 space-y-4 border border-yellow-500/30 bg-yellow-500/10">
          <h3 className="font-semibold text-yellow-400">💡 Quick Test:</h3>
          <p className="text-sm text-gray-300">
            To test WalletConnect, you can:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-gray-400 ml-2">
            <li>Visit a dApp like <a href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Uniswap</a> or <a href="https://opensea.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenSea</a></li>
            <li>Click "Connect Wallet" → Choose "WalletConnect"</li>
            <li>They'll show a QR code or connection link</li>
            <li>Copy the URI and paste it here!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function WalletConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading WalletConnect...</p>
        </div>
      </div>
    }>
      <WalletConnectContent />
    </Suspense>
  )
}

