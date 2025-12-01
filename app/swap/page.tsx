"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity } from "@/lib/wallet"
import { getSwapQuote, approveToken, executeSwap, checkAllowance } from "@/lib/swap"
import { getNativeBalance, getTokenBalance } from "@/lib/rpc"
import { TrendingUp, Loader, ArrowRightLeft, ChevronDown } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import TokenDetailsModal from "@/components/TokenDetailsModal"

interface Token {
  address: string
  decimals: number
  symbol: string
  name: string
  balance?: string
  isNative?: boolean
}

const PEPU_NATIVE: Token = {
  address: "0x0000000000000000000000000000000000000000",
  decimals: 18,
  symbol: "PEPU",
  name: "Pepe Unchained",
  isNative: true,
}

const TOKENS_API = "https://explorer-pepu-v2-mainnet-0.t.conduit.xyz/api/v2/tokens"

export default function SwapPage() {
  const router = useRouter()
  const [fromToken, setFromToken] = useState<Token>(PEPU_NATIVE)
  const [toToken, setToToken] = useState<Token>({
    address: "0xf9cf4a16d26979b929be7176bac4e7084975fcb8",
    decimals: 18,
    symbol: "WPEPU",
    name: "Wrapped PEPU",
  })
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [password, setPassword] = useState("")
  const [chainId, setChainId] = useState(97741)
  const [loading, setLoading] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [allTokens, setAllTokens] = useState<Token[]>([])
  const [fromTokens, setFromTokens] = useState<Token[]>([])
  const [toTokens, setToTokens] = useState<Token[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [showFromSelector, setShowFromSelector] = useState(false)
  const [showToSelector, setShowToSelector] = useState(false)
  const [selectedTokenForDetails, setSelectedTokenForDetails] = useState<Token | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const fromSelectorRef = useRef<HTMLDivElement>(null)
  const toSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }
    updateActivity()
    loadTokens()
  }, [router])

  // Close selectors when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromSelectorRef.current && !fromSelectorRef.current.contains(event.target as Node)) {
        setShowFromSelector(false)
      }
      if (toSelectorRef.current && !toSelectorRef.current.contains(event.target as Node)) {
        setShowToSelector(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadTokens = async () => {
    try {
      setLoadingTokens(true)
      const wallets = getWallets()
      if (wallets.length === 0) return

      const walletAddress = wallets[0].address

      // Fetch all tokens from API (handle pagination)
      let allApiTokens: any[] = []
      let nextPageParams: any = null
      let hasMore = true

      while (hasMore) {
        const url = nextPageParams
          ? `${TOKENS_API}?${new URLSearchParams(nextPageParams).toString()}`
          : TOKENS_API
        const response = await fetch(url)
        const data = await response.json()

        allApiTokens = [...allApiTokens, ...data.items]

        if (data.next_page_params) {
          nextPageParams = data.next_page_params
        } else {
          hasMore = false
        }
      }

      // Process tokens from API
      const tokens: Token[] = allApiTokens
        .filter((item: any) => item.type === "ERC-20" && item.decimals)
        .map((item: any) => ({
          address: item.address_hash.toLowerCase(),
          decimals: Number.parseInt(item.decimals),
          symbol: item.symbol,
          name: item.name,
          isNative: false,
        }))

      // Add native PEPU at the beginning
      const tokensWithNative = [PEPU_NATIVE, ...tokens]

      // Fetch balances for all tokens
      const tokensWithBalances = await Promise.all(
        tokensWithNative.map(async (token) => {
          try {
            let balance = "0"
            if (token.isNative) {
              balance = await getNativeBalance(walletAddress, chainId)
            } else {
              balance = await getTokenBalance(token.address, walletAddress, chainId)
            }
            return { ...token, balance }
          } catch {
            return { ...token, balance: "0" }
          }
        }),
      )

      setAllTokens(tokensWithBalances)

      // Filter tokens with balance > 0 for "from" selector
      // PEPU native should be included if user has balance, and always at top
      const tokensWithBalance = tokensWithBalances.filter(
        (token) => Number.parseFloat(token.balance || "0") > 0,
      )
      
      // Sort: PEPU native first if it has balance, then others
      const sortedFromTokens = tokensWithBalance.sort((a, b) => {
        if (a.isNative) return -1
        if (b.isNative) return 1
        return 0
      })
      setFromTokens(sortedFromTokens)

      // For "to" selector, show all tokens but PEPU native ALWAYS at top
      // Remove PEPU from tokens array if it exists, then add it at the beginning
      const tokensWithoutPepu = tokens.filter(
        (token) => token.address.toLowerCase() !== PEPU_NATIVE.address.toLowerCase(),
      )
      const toTokensList = [PEPU_NATIVE, ...tokensWithoutPepu]
      setToTokens(toTokensList)
    } catch (err) {
      console.error("Error loading tokens:", err)
    } finally {
      setLoadingTokens(false)
    }
  }

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) === 0) {
        setAmountOut("")
        setNeedsApproval(false)
        return
      }

      setQuoting(true)
      setError("")
      try {
        const quote = await getSwapQuote(fromToken, toToken, amountIn, chainId)
        setAmountOut(quote)

        // Check if approval is needed (only for ERC20 tokens, not native)
        if (fromToken.address !== "0x0000000000000000000000000000000000000000") {
          const wallets = getWallets()
          if (wallets.length > 0) {
            const allowanceCheck = await checkAllowance(
              fromToken.address,
              wallets[0].address,
              "0x150c3F0f16C3D9EB34351d7af9c961FeDc97A0fb", // SWAP_ROUTER_ADDRESS
              amountIn,
              fromToken.decimals,
              chainId,
            )
            setNeedsApproval(allowanceCheck.needsApproval)
          }
        } else {
          setNeedsApproval(false)
        }
      } catch (err: any) {
        setError(err.message)
        setAmountOut("")
        setNeedsApproval(false)
      } finally {
        setQuoting(false)
      }
    }

    const timer = setTimeout(fetchQuote, 500)
    return () => clearTimeout(timer)
  }, [amountIn, fromToken, toToken, chainId])

  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token)
    setShowFromSelector(false)
    setAmountIn("")
    setAmountOut("")
  }

  const handleToTokenSelect = (token: Token) => {
    setToToken(token)
    setShowToSelector(false)
    setAmountOut("")
  }

  const handleApprove = async () => {
    if (!password || !amountIn) {
      setError("Missing required fields")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      await approveToken(fromToken.address, wallets[0], password, amountIn, fromToken.decimals, chainId)
      setNeedsApproval(false)
      setSuccess("Token approved")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!password || !amountIn || !amountOut) {
      setError("Missing required fields")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      const txHash = await executeSwap(fromToken, toToken, amountIn, amountOut, wallets[0], password, 0.5, chainId)

      setSuccess(`Swap successful: ${txHash.slice(0, 10)}...`)
      setAmountIn("")
      setAmountOut("")
      setPassword("")

      // Reload tokens to update balances
      setTimeout(() => {
        loadTokens()
      }, 2000)

      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fromTokenBalance = fromToken.balance || "0"
  const maxAmount = Number.parseFloat(fromTokenBalance)

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Unchained Swap</h1>
              <p className="text-sm text-gray-400">Powered by Uniswap V3</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-8 space-y-6">
          {/* Chain Selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Network</label>
            <button
              onClick={() => setChainId(97741)}
              className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-black w-full"
            >
              Pepe Unchained V2
            </button>
          </div>

          {/* From Token */}
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <div className="relative" ref={fromSelectorRef}>
              <button
                onClick={() => setShowFromSelector(!showFromSelector)}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors mb-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold">{fromToken.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{fromToken.symbol}</p>
                    <p className="text-xs text-gray-400">{fromToken.name}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showFromSelector && (
                <div className="absolute z-50 w-full mt-2 glass-card max-h-60 overflow-y-auto border border-white/10 rounded-lg">
                  {loadingTokens ? (
                    <div className="p-4 text-center text-gray-400">Loading tokens...</div>
                  ) : fromTokens.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">No tokens with balance found</div>
                  ) : (
                    <div className="p-2">
                      {fromTokens.map((token: Token) => (
                        <div
                          key={token.address}
                          className="flex items-center gap-2 mb-1"
                        >
                          <button
                            onClick={() => handleFromTokenSelect(token)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors ${
                              fromToken.address === token.address ? "bg-green-500/20" : ""
                            }`}
                          >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">{token.symbol}</p>
                              <p className="text-xs text-gray-400">{token.name}</p>
                            </div>
                          </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {Number.parseFloat(token.balance || "0").toFixed(4)}
                              </p>
                            </div>
                          </button>
                          {!token.isNative && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTokenForDetails(token)
                                setShowTokenModal(true)
                                setShowFromSelector(false)
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="View token details"
                            >
                              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="input-field flex-1"
                step="0.0001"
              />
              <button
                onClick={() => setAmountIn(fromTokenBalance)}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-semibold whitespace-nowrap text-sm"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Balance: {Number.parseFloat(fromTokenBalance).toFixed(6)} {fromToken.symbol}
            </p>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const temp = fromToken
                setFromToken(toToken)
                setToToken(temp)
                setAmountIn("")
                setAmountOut("")
              }}
              className="glass-card p-3 hover:bg-white/10 transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5 text-green-500 rotate-90" />
            </button>
          </div>

          {/* To Token */}
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <div className="relative" ref={toSelectorRef}>
              <button
                onClick={() => setShowToSelector(!showToSelector)}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors mb-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold">{toToken.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{toToken.symbol}</p>
                    <p className="text-xs text-gray-400">{toToken.name}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showToSelector && (
                <div className="absolute z-50 w-full mt-2 glass-card max-h-60 overflow-y-auto border border-white/10 rounded-lg">
                  {loadingTokens ? (
                    <div className="p-4 text-center text-gray-400">Loading tokens...</div>
                  ) : (
                    <div className="p-2">
                      {toTokens.map((token: Token) => (
                        <div
                          key={token.address}
                          className="flex items-center gap-2 mb-1"
                        >
                          <button
                            onClick={() => handleToTokenSelect(token)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors ${
                              toToken.address === token.address ? "bg-green-500/20" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                              </div>
                              <div className="text-left">
                                <p className="font-semibold">{token.symbol}</p>
                                <p className="text-xs text-gray-400">{token.name}</p>
                              </div>
                            </div>
                          </button>
                          {!token.isNative && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTokenForDetails(token)
                                setShowTokenModal(true)
                                setShowToSelector(false)
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="View token details"
                            >
                              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <input
              type="number"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              placeholder="0.0"
              disabled
              className="input-field opacity-60 w-full"
            />
            {quoting && <p className="text-xs text-gray-400 mt-2">Getting quote...</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="glass-card p-4 border border-green-500/50 bg-green-500/10">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Buttons */}
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Approve Token
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={loading || !amountIn || !amountOut || !password || quoting}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? "Swapping..." : "Swap"}
            </button>
          )}
        </div>
      </div>

      <BottomNav active="swap" />

      {/* Token Details Modal */}
      {selectedTokenForDetails && (
        <TokenDetailsModal
          tokenAddress={selectedTokenForDetails.address}
          tokenSymbol={selectedTokenForDetails.symbol}
          tokenName={selectedTokenForDetails.name}
          tokenDecimals={selectedTokenForDetails.decimals}
          isOpen={showTokenModal}
          onClose={() => {
            setShowTokenModal(false)
            setSelectedTokenForDetails(null)
          }}
          chainId={chainId}
        />
      )}
    </div>
  )
}
