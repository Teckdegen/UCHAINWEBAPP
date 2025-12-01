"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getWalletState, getWallets } from "@/lib/wallet"
import { getUnchainedProvider } from "@/lib/provider"
import { AlertCircle, CheckCircle, XCircle, Globe } from "lucide-react"

export default function ConnectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [origin, setOrigin] = useState("")
  const [method, setMethod] = useState("")
  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }

    const originParam = searchParams.get("origin") || "Unknown App"
    const methodParam = searchParams.get("method") || "eth_requestAccounts"
    setOrigin(originParam)
    setMethod(methodParam)
  }, [router, searchParams])

  const handleApprove = async () => {
    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) {
        setError("No wallet found")
        return
      }

      // Track connection
      const provider = getUnchainedProvider()
      const returnOrigin = localStorage.getItem("unchained_return_origin") || origin
      const dappName = new URL(returnOrigin).hostname
      provider.addConnectedDApp(returnOrigin, dappName)

      const result = {
        approved: true,
        accounts: [wallets[0].address.toLowerCase()],
        chainId: "0x1",
        timestamp: Date.now(),
      }

      // Redirect back to dApp with result (like OAuth callback)
      const returnUrl = localStorage.getItem("unchained_return_url") || returnOrigin
      const returnUrlObj = new URL(returnUrl)
      returnUrlObj.searchParams.set("wallet_result", encodeURIComponent(JSON.stringify(result)))
      returnUrlObj.searchParams.set("wallet_status", "approved")
      
      setApproved(true)
      setTimeout(() => {
        window.location.href = returnUrlObj.toString()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Connection failed")
      setLoading(false)
    }
  }

  const handleReject = () => {
    const returnOrigin = localStorage.getItem("unchained_return_origin") || origin
    const returnUrl = localStorage.getItem("unchained_return_url") || returnOrigin
    
    const returnUrlObj = new URL(returnUrl)
    returnUrlObj.searchParams.set("wallet_error", "User rejected connection")
    returnUrlObj.searchParams.set("wallet_status", "rejected")
    
    setRejected(true)
    setTimeout(() => {
      window.location.href = returnUrlObj.toString()
    }, 1000)
  }

  const getDomainName = (origin: string) => {
    try {
      const url = new URL(origin)
      return url.hostname
    } catch {
      return origin
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="glass-card rounded-2xl border border-white/20">
          {/* Header */}
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Connection Request</h1>
                <p className="text-xs text-gray-400">App wants to connect</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Origin */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-2">Requesting App</p>
              <p className="text-sm font-mono text-green-400 break-all">{getDomainName(origin)}</p>
              <p className="text-xs text-gray-500 mt-1">{origin}</p>
            </div>

            {/* Method */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-2">Request Method</p>
              <p className="text-sm font-mono text-blue-400">{method}</p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-400">Be Careful</p>
                <p className="text-xs text-yellow-200 mt-0.5">Only connect to apps you trust.</p>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs font-semibold text-gray-400 mb-3">This app will be able to:</p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  See your wallet address
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Request transaction signatures
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                  This app cannot spend your funds without your approval
                </li>
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30 flex gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Status Messages */}
            {approved && (
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30 flex gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-300">Connection approved. Closing...</p>
              </div>
            )}

            {rejected && (
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30 flex gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">Connection rejected.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!approved && !rejected && (
            <div className="border-t border-white/10 p-6 flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-black font-bold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : null}
                {loading ? "Approving..." : "Approve"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">Never share your private key with anyone</p>
        </div>
      </div>
    </div>
  )
}
