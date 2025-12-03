"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { getWallets, getWalletState, updateActivity, getCurrentWallet } from "@/lib/wallet"
import { getSwapQuote, approveToken, executeSwap, checkAllowance } from "@/lib/swap"
import { getNativeBalance, getTokenBalance, getProviderWithFallback, getTokenInfo } from "@/lib/rpc"
import { TrendingUp, Loader, ArrowRightLeft, ChevronDown, ExternalLink } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import TokenDetailsModal from "@/components/TokenDetailsModal"

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

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
  const [chainId, setChainId] = useState(97741)
  const [loading, setLoading] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [allTokens, setAllTokens] = useState<Token[]>([])
  const [fromTokens, setFromTokens] = useState<Token[]>([])
  const [toTokens, setToTokens] = useState<Token[]>([])
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [showFromSelector, setShowFromSelector] = useState(false)
  const [showToSelector, setShowToSelector] = useState(false)
  const [selectedTokenForDetails, setSelectedTokenForDetails] = useState<Token | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [customToAddress, setCustomToAddress] = useState("")
  const [customToError, setCustomToError] = useState("")
  const [customToLoading, setCustomToLoading] = useState(false)
  const fromSelectorRef = useRef<HTMLDivElement>(null)
  const toSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // No password required to enter page
    updateActivity()
    loadTokens()
  }, [router, chainId])

  // Refresh balance for selected token periodically
  useEffect(() => {
    if (!fromToken || !walletAddress) return
    
    const refreshBalance = async () => {
      try {
        let balance = "0"
        if (fromToken.isNative) {
          balance = await getNativeBalance(walletAddress, chainId)
          console.log(`[Swap] Refreshed PEPU balance:`, balance)
        } else {
          balance = await getTokenBalance(fromToken.address, walletAddress, chainId)
          console.log(`[Swap] Refreshed ${fromToken.symbol} balance:`, balance)
        }
        // Always update balance
        setFromToken((prev) => ({ ...prev, balance }))
        
        // Also update in allTokens and fromTokens
        setAllTokens((prev) =>
          prev.map((t) =>
            t.address.toLowerCase() === fromToken.address.toLowerCase()
              ? { ...t, balance }
              : t
          )
        )
        setFromTokens((prev) =>
          prev.map((t) =>
            t.address.toLowerCase() === fromToken.address.toLowerCase()
              ? { ...t, balance }
              : t
          )
        )
      } catch (error) {
        console.error("[Swap] Error refreshing balance:", error)
      }
    }

    // Refresh immediately and then every 30 seconds
    refreshBalance()
    const interval = setInterval(refreshBalance, 30000)
    return () => clearInterval(interval)
  }, [fromToken?.address, walletAddress, chainId, fromToken?.isNative])

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

      const active = getCurrentWallet() || wallets[0]
      const walletAddress = active.address
      setWalletAddress(walletAddress)

      // Fetch all tokens from API (handle pagination) - gracefully handle CORS errors
      let allApiTokens: any[] = []
      let apiTokens: Token[] = []
      
      try {
        let nextPageParams: any = null
        let hasMore = true
        let pageCount = 0
        const maxPages = 5 // Limit pages to avoid infinite loops

        while (hasMore && pageCount < maxPages) {
          try {
            const url = nextPageParams
              ? `${TOKENS_API}?${new URLSearchParams(nextPageParams).toString()}`
              : TOKENS_API
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            })
            
            if (!response.ok) {
              throw new Error(`API returned ${response.status}`)
            }
            
            const data = await response.json()

            allApiTokens = [...allApiTokens, ...data.items]

            if (data.next_page_params) {
              nextPageParams = data.next_page_params
              pageCount++
            } else {
              hasMore = false
            }
          } catch (fetchError) {
            console.warn("[Swap] API fetch error (CORS or network):", fetchError)
            hasMore = false // Stop trying to fetch more pages
          }
        }

        // Process tokens from API
        apiTokens = allApiTokens
          .filter((item: any) => item.type === "ERC-20" && item.decimals)
          .map((item: any) => ({
            address: item.address_hash.toLowerCase(),
            decimals: Number.parseInt(item.decimals),
            symbol: item.symbol,
            name: item.name,
            isNative: false,
          }))
      } catch (apiError) {
        console.warn("[Swap] Failed to fetch tokens from API (CORS blocked):", apiError)
        // Continue without API tokens - we'll use RPC discovery instead
        apiTokens = []
      }

      // Also scan via RPC to find tokens user actually holds (like dashboard does)
      const rpcDiscoveredTokens: Token[] = []
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc-pepu-v2-mainnet-0.t.conduit.xyz")
        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        const currentBlock = await provider.getBlockNumber()
        const fromBlock = Math.max(0, currentBlock - 10000)
        const addressTopic = ethers.zeroPadValue(walletAddress, 32)

        const [logsFrom, logsTo] = await Promise.all([
          provider.getLogs({
            fromBlock,
            toBlock: "latest",
            topics: [transferTopic, addressTopic],
          }),
          provider.getLogs({
            fromBlock,
            toBlock: "latest",
            topics: [transferTopic, null, addressTopic],
          }),
        ])

        const allLogs = [...logsFrom, ...logsTo]
        const tokenAddresses = [...new Set(allLogs.map((log) => log.address.toLowerCase()))]

        // Fetch token info for RPC-discovered tokens
        for (const tokenAddress of tokenAddresses) {
          try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
            const [decimals, symbol, name] = await Promise.all([
              contract.decimals().catch(() => 18),
              contract.symbol().catch(() => "???"),
              contract.name().catch(() => "Unknown Token"),
            ])

            // Only add if not already in API tokens
            const exists = apiTokens.some((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
            if (!exists) {
              rpcDiscoveredTokens.push({
                address: tokenAddress,
                decimals: Number(decimals),
                symbol: symbol as string,
                name: name as string,
                isNative: false,
              })
            }
          } catch (error) {
            console.error(`Error fetching RPC token ${tokenAddress}:`, error)
          }
        }
      } catch (error) {
        console.error("Error scanning RPC for tokens:", error)
      }

      // Merge API tokens + RPC discovered tokens
      const allTokensList = [...apiTokens, ...rpcDiscoveredTokens]
      // Add native PEPU at the beginning - ALWAYS include it
      const tokensWithNative = [PEPU_NATIVE, ...allTokensList]

      console.log(`[Swap] Loading balances for ${tokensWithNative.length} tokens (PEPU + ${allTokensList.length} others)`)

      // Fetch balances for all tokens - prioritize PEPU native
      const tokensWithBalances = await Promise.all(
        tokensWithNative.map(async (token) => {
          try {
            let balance = "0"
            if (token.isNative) {
              // Always fetch PEPU balance first
              balance = await getNativeBalance(walletAddress, chainId)
              console.log(`[Swap] PEPU native balance for ${walletAddress}:`, balance)
            } else {
              balance = await getTokenBalance(token.address, walletAddress, chainId)
              if (Number.parseFloat(balance) > 0) {
                console.log(`[Swap] Token ${token.symbol} balance:`, balance)
              }
            }
            return { ...token, balance }
          } catch (error) {
            console.error(`[Swap] Error fetching balance for ${token.symbol}:`, error)
            return { ...token, balance: "0" }
          }
        }),
      )
      
      console.log(`[Swap] Loaded ${tokensWithBalances.length} tokens with balances`)

      setAllTokens(tokensWithBalances)

      // Update fromToken balance - find matching token and update with balance
      const pepuToken = tokensWithBalances.find((t) => t.isNative)
      const matchingToken = tokensWithBalances.find(
        (t) => t.address.toLowerCase() === fromToken.address.toLowerCase()
      )
      
      // Always update fromToken with the latest balance from loaded tokens
      if (matchingToken) {
        setFromToken(matchingToken)
      } else if (pepuToken && fromToken.isNative) {
        // If fromToken is native but not found, use PEPU token
        setFromToken(pepuToken)
      }

      // Filter tokens with balance > 0 for "from" selector
      // PEPU native should ALWAYS be included (even if balance is 0) so user can see it
      const tokensWithBalance = tokensWithBalances.filter(
        (token) => {
          const balance = Number.parseFloat(token.balance || "0")
          // Always include native PEPU, or tokens with balance > 0
          return token.isNative || balance > 0
        },
      )

      // Sort: PEPU native first always, then others by balance
      const sortedFromTokens = tokensWithBalance.sort((a, b) => {
        if (a.isNative) return -1
        if (b.isNative) return 1
        const balanceA = Number.parseFloat(a.balance || "0")
        const balanceB = Number.parseFloat(b.balance || "0")
        return balanceB - balanceA // Sort by balance descending
      })
      
      console.log(`[Swap] Tokens with balance:`, sortedFromTokens.map(t => ({ symbol: t.symbol, balance: t.balance })))
      setFromTokens(sortedFromTokens)

      // For "to" selector, show all tokens (so you can swap into new ones),
      // but keep PEPU native at the top and include balances where available
      const uniqueToTokens = tokensWithBalances.filter(
        (token, index, self) =>
          index === self.findIndex((t) => t.address.toLowerCase() === token.address.toLowerCase()),
      )
      const toTokensList = uniqueToTokens.sort((a, b) => {
        if (a.isNative) return -1
        if (b.isNative) return 1
        return a.symbol.localeCompare(b.symbol)
      })
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
    // Ensure token has balance from the loaded tokens list
    const tokenWithBalance = allTokens.find(
      (t) => t.address.toLowerCase() === token.address.toLowerCase()
    ) || token
    setFromToken(tokenWithBalance)
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
    if (!amountIn) {
      setError("Please enter an amount")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      await approveToken(fromToken.address, wallets[0], null, amountIn, fromToken.decimals, chainId)
      setNeedsApproval(false)
      setSuccess("Token approved, executing swap...")
      
      // Automatically execute swap after approval
      if (amountIn && amountOut) {
        // Small delay to ensure approval is processed, then execute swap
        await new Promise(resolve => setTimeout(resolve, 1000))
        await handleSwap()
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!amountIn || !amountOut) {
      setError("Missing required fields")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      const txHash = await executeSwap(fromToken, toToken, amountIn, amountOut, wallets[0], null, 0.5, chainId)

      // Show full transaction link
      const explorerUrl = chainId === 1 
        ? `https://etherscan.io/tx/${txHash}`
        : `https://pepuscan.com/tx/${txHash}`
      setSuccess(`Swap successful! View transaction: ${explorerUrl}`)
      
      // Store transaction in history
      const txHistory = JSON.parse(localStorage.getItem("transaction_history") || "[]")
      txHistory.unshift({
        hash: txHash,
        type: "swap",
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amountIn,
        amountOut,
        chainId,
        timestamp: Date.now(),
        explorerUrl,
      })
      localStorage.setItem("transaction_history", JSON.stringify(txHistory.slice(0, 100))) // Keep last 100
      setAmountIn("")
      setAmountOut("")

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
    <div className="min-h-screen bg-black text-white pb-24 relative">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0 z-50">
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
                <div className="absolute z-[100] w-full mt-2 glass-card max-h-60 overflow-y-auto border border-white/10 rounded-lg shadow-2xl bg-black/95 backdrop-blur-xl">
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
                <div className="absolute z-[100] w-full mt-2 glass-card max-h-[500px] overflow-y-auto border border-white/10 rounded-lg shadow-2xl bg-black/95 backdrop-blur-xl">
                  {loadingTokens ? (
                    <div className="p-4 text-center text-gray-400">Loading tokens...</div>
                  ) : (
                    <div className="p-2 space-y-3">
                      {/* Custom CA input for target token */}
                      <div className="p-3 mb-1 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Paste PEPU token contract to swap to</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customToAddress}
                            onChange={(e) => {
                              setCustomToAddress(e.target.value)
                              setCustomToError("")
                            }}
                            placeholder="0x..."
                            className="input-field flex-1 text-xs"
                          />
                          <button
                            disabled={customToLoading || !customToAddress.trim()}
                            onClick={async () => {
                              try {
                                setCustomToLoading(true)
                                setCustomToError("")

                                const addr = customToAddress.trim()
                                if (!addr) {
                                  setCustomToError("Enter a contract address")
                                  return
                                }

                                const info = await getTokenInfo(addr, chainId)
                                if (!info) {
                                  setCustomToError("Could not load token info")
                                  return
                                }

                                let balance = "0"
                                try {
                                  const wa = walletAddress || getWallets()[0]?.address || ""
                                  if (wa) {
                                    balance = await getTokenBalance(addr, wa, chainId)
                                  }
                                } catch {
                                  // ignore balance error, keep 0
                                }

                                const customToken: Token = {
                                  address: addr.toLowerCase(),
                                  decimals: info.decimals,
                                  symbol: info.symbol,
                                  name: info.name,
                                  balance,
                                  isNative: false,
                                }

                                setToToken(customToken)
                                setShowToSelector(false)
                                setCustomToAddress("")
                                setCustomToError("")
                              } catch (err: any) {
                                setCustomToError(err.message || "Failed to load token")
                              } finally {
                                setCustomToLoading(false)
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-green-500 text-black text-xs font-semibold hover:bg-green-400 disabled:opacity-50 whitespace-nowrap"
                          >
                            {customToLoading ? "Loading..." : "Use"}
                          </button>
                        </div>
                        {customToError && <p className="mt-1 text-[11px] text-red-400">{customToError}</p>}
                      </div>

                      {/* Discovered tokens list */}
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
                            {typeof token.balance !== "undefined" && (
                              <div className="text-right">
                                <p className="text-[11px] text-gray-400">
                                  Bal: {Number.parseFloat(token.balance || "0").toFixed(4)}
                                </p>
                              </div>
                            )}
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
              disabled={loading || !amountIn || !amountOut || quoting}
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
