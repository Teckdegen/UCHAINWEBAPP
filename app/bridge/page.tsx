"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity } from "@/lib/wallet"
import { getNativeBalance } from "@/lib/rpc"
import { getFeePercentage, executeBridge, getPoolBalance } from "@/lib/bridge"
import { Zap, Loader } from "lucide-react"
import BottomNav from "@/components/BottomNav"

const MAX_POOL = 35009000 // 35,009,000 tokens

export default function BridgePage() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState("0")
  const [poolBalance, setPoolBalance] = useState("0")
  const [feePercentage, setFeePercentage] = useState(0.05)
  const [loading, setLoading] = useState(false)
  const [loadingPool, setLoadingPool] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [successTx, setSuccessTx] = useState<{
    original: string
    received: string
    hash: string
  } | null>(null)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }

    updateActivity()
    loadBridgeData()
  }, [router])

  const loadBridgeData = async () => {
    try {
      const wallets = getWallets()
      if (wallets.length === 0) return

      setLoadingPool(true)
      const [pepuBalance, fee, poolBal] = await Promise.all([
        getNativeBalance(wallets[0].address, 97741),
        getFeePercentage(97741),
        getPoolBalance(),
      ])

      setBalance(pepuBalance)
      setFeePercentage(fee)
      setPoolBalance(poolBal)
    } catch (err) {
      console.error("Error loading bridge data:", err)
    } finally {
      setLoadingPool(false)
    }
  }

  const handleBridge = async () => {
    setError("")
    setSuccess("")
    setTxHash(null)
    setSuccessTx(null)

    if (!amount) {
      setError("Please enter amount")
      return
    }

    if (Number.parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
      setError("Insufficient PEPU balance")
      return
    }

    // Check if L1 pool has sufficient balance for bridge amount
    const receivePercentage = 1 - feePercentage
    const bridgeAmount = Number.parseFloat(amount) * receivePercentage
    const l1PoolAmount = Number.parseFloat(poolBalance)

    if (bridgeAmount > l1PoolAmount) {
      setError("Insufficient pool funds. Please try a smaller amount or check back later.")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      const hash = await executeBridge(wallets[0], null, amount, 97741)
      setTxHash(hash)

      const receivedAmount = Number.parseFloat(amount) * receivePercentage
      setSuccessTx({
        original: amount,
        received: receivedAmount.toFixed(6),
        hash,
      })

      // Store transaction in history with full link
      const explorerUrl = `https://pepuscan.com/tx/${hash}`
      const txHistory = JSON.parse(localStorage.getItem("transaction_history") || "[]")
      txHistory.unshift({
        hash,
        type: "bridge",
        amount,
        received: receivedAmount.toFixed(6),
        chainId: 97741,
        timestamp: Date.now(),
        explorerUrl,
      })
      localStorage.setItem("transaction_history", JSON.stringify(txHistory.slice(0, 100)))

      setAmount("")

      // Reload pool balance after successful bridge
      setTimeout(() => {
        loadBridgeData()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Bridge failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDismissSuccess = () => {
    setSuccessTx(null)
    setTxHash(null)
    setAmount("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val || isNaN(Number(val))) {
      setAmount(val)
      return
    }

    const numVal = Number(val)
    if (numVal > Number.parseFloat(balance)) {
      setAmount(balance)
      setError("Amount exceeds wallet balance")
    } else {
      setAmount(val)
      setError("")
    }
  }

  const receivePercentage = 1 - feePercentage
  const receivedAmount = amount ? Number.parseFloat(amount) * receivePercentage : 0
  const bridgeFee = amount ? Number.parseFloat(amount) * feePercentage : 0

  const pool = Number.parseFloat(poolBalance)
  const percent = Math.min((pool / MAX_POOL) * 100, 100)
  const formattedPool = pool.toLocaleString(undefined, { maximumFractionDigits: 3 })

  const bridgeAmount = amount ? Number.parseFloat(amount) * receivePercentage : 0
  const l1PoolAmount = Number.parseFloat(poolBalance)
  const hasInsufficientL1Pool = bridgeAmount > l1PoolAmount && bridgeAmount > 0

  const isBridgeDisabled =
    loading || !amount || Number.parseFloat(amount) <= 0 || hasInsufficientL1Pool

  const wallets = getWallets()
  const walletAddress = wallets.length > 0 ? wallets[0].address : ""

  function shortenAddress(addr: string) {
    if (!addr) return ""
    return addr.slice(0, 6) + "..." + addr.slice(-4)
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Unchained Bridge</h1>
              <p className="text-sm text-gray-400">Bridge PEPU from L2 → L1</p>
            </div>
          </div>
        </div>

        {/* Main Bridge Card */}
        <div className="p-4 sm:p-8">
          <div className="relative">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent rounded-3xl pointer-events-none"></div>

            {/* Main card */}
            <div className="relative backdrop-blur-xl bg-white/[0.05] rounded-3xl shadow-2xl border border-white/[0.15] overflow-hidden">
              {/* Card Header */}
              <div className="relative p-6 border-b border-white/[0.12]">
                <h2 className="text-3xl font-bold text-white text-center">Unchained Bridge</h2>
                <p className="text-white/70 mt-1 text-center">Bridge PEPU from L2 → L1</p>
              </div>

              {/* Card Body */}
              <div className="relative p-6">
          {/* Network Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-xs">L2</span>
                    </div>
                    <span className="text-white text-sm">
                      From <span className="font-bold">Pepe Unchained V2 Mainnet</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs">L1</span>
                    </div>
                    <span className="text-white text-sm">
                      To <span className="font-bold">Ethereum Mainnet</span>
                    </span>
            </div>
          </div>

                {/* Progress Bar */}
                <div className="w-full h-5 bg-black border border-white/[0.2] rounded-full mb-2 relative">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${percent}%` }}
                  ></div>
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">
                    {loadingPool ? "..." : `${percent.toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-white mb-1">
                  <span>0</span>
                  <span>{MAX_POOL.toLocaleString()}</span>
                </div>
                <div className="text-center text-white text-sm mb-6">
                  Unchained Bridge Pool (v1):{" "}
                  {loadingPool ? (
                    <span className="font-bold">Loading...</span>
                  ) : (
                    <span className="font-bold">{formattedPool} PEPU</span>
                  )}
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-white text-sm mb-1">You Send</label>
                  <div className="text-green-500 text-xs mb-1">Enter amount to bridge</div>
              <input
                type="number"
                    className="w-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.2] rounded-lg px-2 py-1 text-white text-base sm:text-lg focus:outline-none placeholder:text-xs focus:ring-2 focus:ring-white/20 focus:border-white/30"
                value={amount}
                    onChange={handleInputChange}
                    min="0"
                    step="any"
                    placeholder="Enter amount"
                  />
                  {hasInsufficientL1Pool && amount && (
                    <div className="text-orange-400 text-xs mt-1">
                      ⚠️ Insufficient pool funds. Try a smaller amount.
            </div>
          )}
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>Available:</span>
                    <span className="text-white">
                      {Number.parseFloat(balance).toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })}{" "}
                      PEPU
                    </span>
                  </div>
                </div>

                {/* Bridge Button */}
                <div className="relative w-full mb-4">
                  <button
                    className={`w-full font-bold text-sm sm:text-base py-1.5 sm:py-2 rounded-full border transition-colors ${
                      isBridgeDisabled
                        ? "bg-white/[0.05] text-white/30 cursor-not-allowed border-white/[0.08] backdrop-blur-sm"
                        : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white hover:scale-[1.02] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-transparent"
                    }`}
                    disabled={isBridgeDisabled}
                    onClick={handleBridge}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Bridging...
                      </span>
                    ) : (
                      "Bridge Assets"
                    )}
                  </button>
                </div>

                {/* Transaction Status Messages */}
          {error && (
                  <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    {error}
            </div>
          )}

                {loading && txHash && (
                  <div className="backdrop-blur-sm bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4 text-blue-100 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 animate-pulse">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                      <div className="font-bold text-lg">Transaction Pending</div>
                    </div>

                    <div className="text-sm mb-3">
                      Your bridge transaction is being processed on Pepe Unchained V2 mainnet...
                    </div>

                    <div className="bg-black/40 rounded-lg p-2 mb-3">
                      <div className="text-xs text-gray-300 mb-1">Transaction:</div>
                      <a
                        href={`https://pepuscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-yellow-300 hover:text-yellow-200 underline break-all"
                      >
                        https://pepuscan.com/tx/{txHash}
                      </a>
                    </div>

                    <div className="text-xs text-gray-300">
                      🔄 Please wait while we confirm your transaction...
                    </div>
            </div>
          )}

                {successTx && (
                  <div className="backdrop-blur-sm bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-green-100 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-lg">✓</span>
                      </div>
                      <div className="font-bold text-lg">Bridge Successful!</div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                        <span className="text-sm">Amount Bridged:</span>
                        <span className="font-mono font-bold text-green-300">
                          {successTx.original} PEPU
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                        <span className="text-sm">You'll Receive:</span>
                        <span className="font-mono font-bold text-yellow-300">
                          {successTx.received} PEPU
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                        <span className="text-sm">Network Fee ({(feePercentage * 100).toFixed(1)}%):</span>
                        <span className="font-mono text-red-300">
                          {(Number.parseFloat(successTx.original) * feePercentage).toFixed(6)} PEPU
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 rounded-lg p-2 mb-3">
                      <div className="text-xs text-gray-300 mb-1">Transaction:</div>
                      <a
                        href={`https://pepuscan.com/tx/${successTx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-yellow-300 hover:text-yellow-200 underline break-all"
                      >
                        https://pepuscan.com/tx/{successTx.hash}
                      </a>
                    </div>

                    <div className="text-xs text-gray-300 mb-3">
                      ⏱️ Your tokens will arrive on Ethereum mainnet in approximately 30 seconds
                    </div>

          <button
                      onClick={handleDismissSuccess}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
          >
                      Continue Bridging
          </button>
                  </div>
                )}

                {/* Bridge Info */}
                {!loading && !txHash && !successTx && (
                  <div className="backdrop-blur-sm bg-white/[0.03] border border-white/[0.1] rounded-lg p-4">
                    <div className="flex justify-between text-xs text-gray-300 mb-2">
                      <span>Recipient address</span>
                      <span className="text-white">{shortenAddress(walletAddress)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 mb-2">
                      <span>Time spend</span>
                      <span className="text-white">≈ 30s</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 mb-2">
                      <span>You will receive</span>
                      <span className="text-white">
                        {amount && !isNaN(Number(amount))
                          ? `${receivedAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })} PEPU`
                          : "0 PEPU"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Fees ({(feePercentage * 100).toFixed(1)}%)</span>
                      <span className="text-white">
                        {amount && !isNaN(Number(amount))
                          ? `${bridgeFee.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })} PEPU`
                          : "0 PEPU"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="relative backdrop-blur-sm bg-white/[0.03] px-6 py-4 border-t border-white/[0.1]">
                <p className="text-xs text-white/70 text-center">
                  Bridge fee: {(feePercentage * 100).toFixed(1)}% | No token restrictions
                </p>
              </div>
            </div>
          </div>

          {/* Contract Addresses Section */}
          <div className="mt-8 relative">
            <div className="text-center text-white text-lg mb-4 font-semibold">
              Contract Addresses
            </div>
            <div className="space-y-3">
              {/* L2 Bridge Contract */}
              <div className="backdrop-blur-sm bg-white/[0.05] rounded-xl p-4 border border-white/[0.15] shadow-lg">
                <div className="text-sm text-white/70 mb-2">L2 Bridge Contract (Pepu Mainnet)</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-yellow-300 font-mono break-all flex-1 bg-black/30 px-3 py-2 rounded">
                    {process.env.NEXT_PUBLIC_SUPERBRIDGE_L2_ADDRESS || "Not set"}
                  </code>
                  <a
                    href={`https://pepuscan.com/address/${process.env.NEXT_PUBLIC_SUPERBRIDGE_L2_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 text-sm px-4 py-2 rounded border border-yellow-400 hover:bg-yellow-400/10 transition-colors whitespace-nowrap font-medium flex items-center gap-1"
                  >
                    View on PepuScan
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* L1 Bridge Contract */}
              <div className="backdrop-blur-sm bg-white/[0.05] rounded-xl p-4 border border-white/[0.15] shadow-lg">
                <div className="text-sm text-white/70 mb-2">
                  L1 Bridge Contract (Ethereum Mainnet)
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-yellow-300 font-mono break-all flex-1 bg-black/30 px-3 py-2 rounded">
                    {process.env.NEXT_PUBLIC_SUPERBRIDGE_L1_ADDRESS || "Not set"}
                  </code>
                  <a
                    href={`https://etherscan.io/address/${process.env.NEXT_PUBLIC_SUPERBRIDGE_L1_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 text-sm px-4 py-2 rounded border border-yellow-400 hover:bg-yellow-400/10 transition-colors whitespace-nowrap font-medium flex items-center gap-1"
                  >
                    View on Etherscan
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="bridge" />
    </div>
  )
}
