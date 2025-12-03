"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getWalletState, getWallets, getPrivateKey, getCurrentWalletId, setCurrentWalletId } from "@/lib/wallet"
import { getProvider, getChainName } from "@/lib/rpc"
import { getUnchainedProvider } from "@/lib/provider"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
} from "lucide-react"
import { ethers } from "ethers"

export default function SignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState("")
  const [origin, setOrigin] = useState("")
  const [params, setParams] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low")
  const [selectedChainId, setSelectedChainId] = useState<number>(1) // Default to Ethereum
  const [wallets, setWallets] = useState<any[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string>("")
  const [isWalletConnect, setIsWalletConnect] = useState(false)
  const [wcRequest, setWcRequest] = useState<any>(null)

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // Load current chain ID from provider
    const provider = getUnchainedProvider()
    setSelectedChainId(provider.getChainId())

    // Check if this is a WalletConnect request
    const wcRequestId = searchParams.get("wc_request")
    if (wcRequestId) {
      setIsWalletConnect(true)
      // Dynamic import to avoid SSR analysis
      import("@/lib/walletConnect").then((mod) => {
        const request = mod.getStoredRequest(wcRequestId)
        if (request) {
          setWcRequest(request)
          const requestMethod = request.params.request.method
          const requestParams = request.params.request.params || []
          
          setMethod(requestMethod)
          
          // Extract origin from WalletConnect request metadata
          const session = request.session
          const dappUrl = session?.peer?.metadata?.url || "Unknown dApp"
          setOrigin(dappUrl)
          
          // Parse WalletConnect request params based on method
          if (requestMethod === "eth_sendTransaction") {
            setParams(requestParams)
          } else if (requestMethod === "personal_sign" || requestMethod === "eth_sign") {
            setParams([requestParams[0], requestParams[1]]) // message, address
          } else if (requestMethod === "eth_signTypedData" || requestMethod === "eth_signTypedData_v4") {
            setParams(requestParams)
          }
        }
      }).catch(console.error)
    } else {
      // Regular injected provider flow
    const methodParam = searchParams.get("method") || ""
    const originParam = searchParams.get("origin") || "Unknown"
    const paramsParam = searchParams.get("params")

    setMethod(methodParam)
    setOrigin(originParam)

    if (paramsParam) {
      try {
        const parsedParams = JSON.parse(decodeURIComponent(paramsParam))
        setParams(parsedParams)

        // Assess risk
        if (methodParam === "eth_sendTransaction") {
          const tx = parsedParams[0] || parsedParams
          const value = tx.value ? ethers.toBeHex(tx.value) : "0x0"
          const valueNum = Number.parseFloat(ethers.formatEther(value))
          if (valueNum > 1 || (tx.data && tx.data.length > 100)) {
            setRiskLevel("high")
          } else if (tx.data && tx.data !== "0x") {
            setRiskLevel("medium")
          }
        }
      } catch (e) {
        console.error("[v0] Error parsing params:", e)
      }
      }
    }

    const allWallets = getWallets()
    setWallets(allWallets)
    const currentId = getCurrentWalletId()
    if (currentId && allWallets.find((w) => w.id === currentId)) {
      setSelectedWalletId(currentId)
    } else if (allWallets.length > 0) {
      setSelectedWalletId(allWallets[0].id)
    }
  }, [router, searchParams])

  const handleApprove = async () => {
    if (!password || password.length !== 4) {
      setError("Please enter your 4-digit PIN")
      return
    }

    if (!params) {
      setError("Invalid transaction parameters")
      return
    }

    setLoading(true)
    try {
      if (wallets.length === 0) {
        throw new Error("No wallet found")
      }

      const wallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0]
      setCurrentWalletId(wallet.id)
      const privateKey = getPrivateKey(wallet, password)

      let result: any = null

      if (method === "eth_sendTransaction") {
        const tx = params[0] || params
        const rpcProvider = getProvider(selectedChainId)
        const walletInstance = new ethers.Wallet(privateKey, rpcProvider)

        const txRequest: any = {
          to: tx.to,
          value: tx.value || "0x0",
          data: tx.data || "0x",
        }

        if (tx.gas) {
          txRequest.gasLimit = tx.gas
        }

        // Update provider chain ID if it changed
        const provider = getUnchainedProvider()
        if (provider.getChainId() !== selectedChainId) {
          provider.setChainId(selectedChainId)
        }

        const txResponse = await walletInstance.sendTransaction(txRequest)
        result = txResponse.hash
      } else if (method === "personal_sign" || method === "eth_sign") {
        const message = params[0]
        const walletInstance = new ethers.Wallet(privateKey)
        result = await walletInstance.signMessage(message)
      } else if (method === "eth_signTypedData_v4" || method === "eth_signTypedData") {
        const domain = params[0]
        const types = params[1]
        const value = params[2]
        const walletInstance = new ethers.Wallet(privateKey)
        result = await walletInstance.signTypedData(domain, types, value)
      }

      setApproved(true)

      if (isWalletConnect && wcRequest) {
        // Handle WalletConnect request response
        const wcMod = await import("@/lib/walletConnect")
        await wcMod.approveSessionRequest(wcRequest.id, result)
        
        setTimeout(() => {
          window.close() // Close popup if opened in popup
      if (window.opener) {
            window.close()
          } else {
            router.push("/dashboard")
          }
        }, 1500)
      } else {
        // Regular injected provider flow - Redirect back to dApp with result
        const returnOrigin = localStorage.getItem("unchained_return_origin") || origin
        const returnUrl = localStorage.getItem("unchained_return_url") || returnOrigin
        const requestId = searchParams.get("requestId") || localStorage.getItem("unchained_request_id") || ""
        
        const returnUrlObj = new URL(returnUrl)
        returnUrlObj.searchParams.set("wallet_result", encodeURIComponent(result))
        returnUrlObj.searchParams.set("wallet_request_id", requestId)
        returnUrlObj.searchParams.set("wallet_status", "approved")
        
        setTimeout(() => {
          window.location.href = returnUrlObj.toString()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || "Signing failed")
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (isWalletConnect && wcRequest) {
      // Handle WalletConnect rejection
      try {
        const wcMod = await import("@/lib/walletConnect")
        await wcMod.rejectSessionRequest(wcRequest.id, "USER_REJECTED")
        setRejected(true)
        setTimeout(() => {
          window.close()
          if (window.opener) {
            window.close()
          } else {
            router.push("/dashboard")
          }
        }, 1500)
      } catch (err: any) {
        setError(err.message || "Failed to reject")
      }
    } else {
      // Regular injected provider flow
    setRejected(true)

      const returnOrigin = localStorage.getItem("unchained_return_origin") || origin
      const returnUrl = localStorage.getItem("unchained_return_url") || returnOrigin
      const requestId = searchParams.get("requestId") || localStorage.getItem("unchained_request_id") || ""
      
      const returnUrlObj = new URL(returnUrl)
      returnUrlObj.searchParams.set("wallet_error", "User rejected transaction")
      returnUrlObj.searchParams.set("wallet_request_id", requestId)
      returnUrlObj.searchParams.set("wallet_status", "rejected")
      
      setTimeout(() => {
        window.location.href = returnUrlObj.toString()
      }, 1000)
    }
  }

  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const formatAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"
  }

  const handleChainChange = (chainId: number) => {
    setSelectedChainId(chainId)
    // Update provider chain ID
    const provider = getUnchainedProvider()
    provider.setChainId(chainId)
  }

  if (!params) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  const txData = method === "eth_sendTransaction" ? params[0] || params : null
  const messageData = method === "personal_sign" ? params[0] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Review Transaction</h1>
              <p className="text-xs text-gray-400">{getDomainName(origin)}</p>
            </div>
          </div>
          {wallets.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 mb-1">Wallet</span>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="bg-white/5 border border-white/20 text-xs rounded px-2 py-1 text-gray-200"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {(wallet.name || "Wallet") +
                      " - " +
                      wallet.address.slice(0, 6) +
                      "..." +
                      wallet.address.slice(-4)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-4">
        {/* Risk Warning */}
        {riskLevel === "high" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold mb-1">High Risk Transaction</p>
              <p className="text-red-300 text-xs">Please verify all details carefully before approving.</p>
            </div>
          </div>
        )}

        {/* Transaction Type */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Type</span>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${riskLevel === "high" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
            >
              {method === "eth_sendTransaction" ? "Transaction" : "Sign Message"}
            </span>
          </div>
        </div>

        {/* Chain Selector - Only show for transactions */}
        {method === "eth_sendTransaction" && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <span className="text-gray-400 text-sm mb-3 block">Network</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleChainChange(1)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  selectedChainId === 1
                    ? "bg-green-500 text-black"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                Ethereum
              </button>
              <button
                onClick={() => handleChainChange(97741)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  selectedChainId === 97741
                    ? "bg-green-500 text-black"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                PEPU
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {getChainName(selectedChainId)}
            </p>
          </div>
        )}

        {/* Transaction Details */}
        {txData && (
          <>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">From</span>
                <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-green-400" />
              </div>
              <p className="text-white font-mono text-xs break-all">
                {formatAddress(
                  (wallets.find((w) => w.id === selectedWalletId) || wallets[0] || { address: "" }).address || "",
                )}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">To</span>
                <ExternalLink className="w-4 h-4 text-gray-400 hover:text-green-400 cursor-pointer" />
              </div>
              <p className="text-white font-mono text-xs break-all">{formatAddress(txData.to || "")}</p>
            </div>

            {txData.value && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <span className="text-gray-400 text-sm">Amount</span>
                <p className="text-white text-xl font-bold mt-2">
                  {ethers.formatEther(txData.value)} {selectedChainId === 1 ? "ETH" : "PEPU"}
                </p>
              </div>
            )}

            {/* Gas Estimate */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-sm">Estimated Gas Fee</span>
              </div>
              <p className="text-white mt-2">
                ~0.001 {selectedChainId === 1 ? "ETH" : "PEPU"}
              </p>
            </div>
          </>
        )}

        {/* Message Data */}
        {messageData && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <span className="text-gray-400 text-sm">Message</span>
            <p className="text-white text-xs mt-2 break-all font-mono bg-black/50 p-2 rounded">{messageData}</p>
          </div>
        )}

        {/* Advanced Details */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <span className="text-gray-400 text-sm">Advanced Details</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && txData && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
            {txData.gas && (
              <div>
                <span className="text-gray-400 text-xs">Gas Limit</span>
                <p className="text-white font-mono text-sm">{txData.gas}</p>
              </div>
            )}
            {txData.data && txData.data !== "0x" && (
              <div>
                <span className="text-gray-400 text-xs">Data</span>
                <p className="text-white font-mono text-xs break-all bg-black/50 p-2 rounded">{txData.data}</p>
              </div>
            )}
          </div>
        )}

        {/* Password Input */}
        {!approved && !rejected && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <label className="block text-gray-400 mb-3 text-sm font-medium">Enter 4-Digit PIN to Confirm</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4)
                setPassword(val)
              }}
              maxLength={4}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest font-bold focus:border-green-500 focus:outline-none"
              placeholder="0000"
              autoFocus
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {approved && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 font-semibold">Transaction Approved</p>
          </div>
        )}

        {/* Rejected Message */}
        {rejected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-semibold">Transaction Rejected</p>
          </div>
        )}

        {/* Action Buttons */}
        {!approved && !rejected && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500/20 border border-red-500/50 text-red-400 font-bold py-4 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={!password || password.length !== 4 || loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve & Sign"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
