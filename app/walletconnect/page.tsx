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
          <h3 className="font-semibold">How to use:</h3>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>Get a WalletConnect URI from a dApp (usually shown as QR code or link)</li>
            <li>Paste it here or use a deeplink: <code className="bg-black/50 px-1 rounded">/walletconnect?uri=wc:...</code></li>
            <li>Click "Connect" to pair</li>
            <li>You'll be redirected to approve the connection</li>
            <li>After approval, you're connected!</li>
          </ol>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Example Deeplink:</h3>
          <code className="block bg-black/50 p-3 rounded text-xs break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}/walletconnect?uri=wc:1234567890abcdef@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=abc123
          </code>
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

