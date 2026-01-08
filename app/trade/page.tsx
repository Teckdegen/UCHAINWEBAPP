"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { getWallets, getWalletState, updateActivity, getCurrentWallet } from "@/lib/wallet"
import { getSwapQuote, approveToken, executeSwap, checkAllowance } from "@/lib/swap"
import { getNativeBalance, getTokenBalance, getProviderWithFallback, getTokenInfo } from "@/lib/rpc"
import { calculateSwapFee, sendSwapFee } from "@/lib/fees"
import { ArrowDownUp, ChevronDown, Loader, Settings, AlertCircle, CheckCircle2, X } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import TransactionNotification from "@/components/TransactionNotification"

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

// Fee percentage from the bot code
const FEE_PERCENTAGE = 0.5 // 0.5%

export default function TradePage() {
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
  const [tokensWithBalances, setTokensWithBalances] = useState<Map<string, string>>(new Map())
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [showFromSelector, setShowFromSelector] = useState(false)
  const [showToSelector, setShowToSelector] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [swapFee, setSwapFee] = useState<string>("0")
  const [amountAfterFee, setAmountAfterFee] = useState<string>("")
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState<{ message: string; txHash?: string; explorerUrl?: string } | null>(null)
  const fromSelectorRef = useRef<HTMLDivElement>(null)
  const toSelectorRef = useRef<HTMLDivElement>(null)

  // Update wallet address when current wallet changes
  useEffect(() => {
    const updateWalletAddress = () => {
      const wallets = getWallets()
      if (wallets.length === 0) {
        router.push("/setup")
        return
      }

      const active = getCurrentWallet() || wallets[0]
      if (active.address !== walletAddress) {
        setWalletAddress(active.address)
      }
    }

    updateWalletAddress()
    
    // Check for wallet changes periodically (in case user switches wallet in another tab)
    const interval = setInterval(updateWalletAddress, 2000)
    
    return () => clearInterval(interval)
  }, [walletAddress, router])

  // Load initial data and reload when wallet or chain changes
  useEffect(() => {
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    updateActivity()
    
    const loadData = async () => {
      try {
        const active = getCurrentWallet() || wallets[0]
        const currentAddress = active.address
        
        // Update wallet address state
        setWalletAddress(currentAddress)
        
        // Load native balance for from token
        const balance = await getNativeBalance(currentAddress, chainId)
        setFromToken((prev) => ({ ...prev, balance }))
      } catch (error) {
        console.error("[Trade] Error loading balance:", error)
      }
    }
    
    loadData()
    loadTokens()
  }, [chainId, router, walletAddress])

  // Load balances for all tokens (for sorting in dropdown)
  const loadAllTokenBalances = async (address: string, tokens: Token[], chain: number) => {
    if (!address || tokens.length === 0) return
    
    setLoadingBalances(true)
    const balanceMap = new Map<string, string>()
    
    try {
      // Load native balance first
      try {
        const nativeBalance = await getNativeBalance(address, chain)
        balanceMap.set(PEPU_NATIVE.address.toLowerCase(), nativeBalance)
      } catch (error) {
        console.error("[Trade] Error loading native balance:", error)
      }
      
      // Load ERC20 token balances in batches to avoid overwhelming the RPC
      const batchSize = 10
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(async (token) => {
            if (token.isNative) return
            
            try {
              const balance = await getTokenBalance(token.address, address, chain)
              if (Number.parseFloat(balance) > 0) {
                balanceMap.set(token.address.toLowerCase(), balance)
              }
            } catch (error) {
              // Silently fail for individual tokens
            }
          })
        )
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setTokensWithBalances(balanceMap)
    } catch (error) {
      console.error("[Trade] Error loading all token balances:", error)
    } finally {
      setLoadingBalances(false)
    }
  }

  const loadTokens = async () => {
    try {
      setLoadingTokens(true)
      const wallets = getWallets()
      if (wallets.length === 0) return

      // Always get the current wallet
      const active = getCurrentWallet() || wallets[0]
      const currentWalletAddress = active.address
      
      // Update wallet address if it changed
      if (currentWalletAddress !== walletAddress) {
        setWalletAddress(currentWalletAddress)
      }

      let allApiTokens: any[] = []
      let apiTokens: Token[] = []
      
      try {
        let nextPageParams: any = null
        let hasMore = true
        let pageCount = 0
        const maxPages = 50 // Increased to fetch more tokens

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
            console.warn("[Trade] API fetch error:", fetchError)
            hasMore = false
          }
        }

        apiTokens = allApiTokens
          .filter((item: any) => item.type === "ERC-20" && item.decimals)
          .map((item: any) => ({
            address: (item.address_hash || item.address || "").toLowerCase(),
            decimals: Number.parseInt(item.decimals || "18"),
            symbol: item.symbol || "TOKEN",
            name: item.name || "Unknown Token",
            isNative: false,
          }))
          .filter((token) => token.address && token.address !== "0x0000000000000000000000000000000000000000")
      } catch (apiError) {
        console.warn("[Trade] Failed to fetch tokens from API:", apiError)
      }

      // Add native PEPU and WPEPU
      const tokens: Token[] = [
        PEPU_NATIVE,
        {
          address: "0xf9cf4a16d26979b929be7176bac4e7084975fcb8",
          decimals: 18,
          symbol: "WPEPU",
          name: "Wrapped PEPU",
        },
        ...apiTokens,
      ]

      setAllTokens(tokens)
      
      // Load balances for all tokens to sort them (always use current wallet)
      if (currentWalletAddress) {
        loadAllTokenBalances(currentWalletAddress, tokens, chainId)
      }
    } catch (error) {
      console.error("[Trade] Error loading tokens:", error)
    } finally {
      setLoadingTokens(false)
    }
  }

  // Load balances when tokens or wallet changes
  useEffect(() => {
    const loadBalances = async () => {
      // Always get the current wallet to ensure we're using the right one
      const wallets = getWallets()
      if (wallets.length === 0) return
      
      const active = getCurrentWallet() || wallets[0]
      const currentWalletAddress = active.address
      
      // Update wallet address if it changed
      if (currentWalletAddress !== walletAddress) {
        setWalletAddress(currentWalletAddress)
      }

      try {
        // Load from token balance
        if (fromToken.isNative) {
          const balance = await getNativeBalance(currentWalletAddress, chainId)
          setFromToken((prev) => ({ ...prev, balance }))
        } else {
          const balance = await getTokenBalance(fromToken.address, currentWalletAddress, chainId)
          setFromToken((prev) => ({ ...prev, balance }))
        }

        // Load to token balance
        if (toToken.isNative) {
          const balance = await getNativeBalance(currentWalletAddress, chainId)
          setToToken((prev) => ({ ...prev, balance }))
        } else {
          const balance = await getTokenBalance(toToken.address, currentWalletAddress, chainId)
          setToToken((prev) => ({ ...prev, balance }))
        }
      } catch (error) {
        console.error("[Trade] Error loading balances:", error)
      }
    }

    loadBalances()
  }, [fromToken.address, toToken.address, walletAddress, chainId])

  // Fetch quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) === 0) {
        setAmountOut("")
        setSwapFee("0")
        setAmountAfterFee("")
        return
      }

      try {
        setQuoting(true)
        setError("")

        // Calculate fee (0.5% from bot code)
        const feeAmount = (Number.parseFloat(amountIn) * FEE_PERCENTAGE) / 100
        const amountAfterFeeCalc = Number.parseFloat(amountIn) - feeAmount
        
        setSwapFee(feeAmount.toFixed(6))
        setAmountAfterFee(amountAfterFeeCalc.toFixed(6))

        // Get quote using amount after fee
        const quote = await getSwapQuote(
          fromToken,
          toToken,
          amountAfterFeeCalc.toString(),
          chainId
        )

        setAmountOut(quote)
      } catch (error: any) {
        console.error("[Trade] Quote error:", error)
        setError(error.message || "Failed to get quote")
        setAmountOut("")
      } finally {
        setQuoting(false)
      }
    }

    const timeoutId = setTimeout(fetchQuote, 500)
    return () => clearTimeout(timeoutId)
  }, [amountIn, fromToken, toToken, chainId])

  // Check allowance - always use current wallet
  useEffect(() => {
    const checkTokenAllowance = async () => {
      // Always get the current wallet to ensure we're checking the right one
      const wallets = getWallets()
      if (wallets.length === 0) {
        setNeedsApproval(false)
        return
      }
      
      const active = getCurrentWallet() || wallets[0]
      const currentWalletAddress = active.address
      
      if (!fromToken.isNative && amountIn && Number.parseFloat(amountIn) > 0) {
        try {
          const allowance = await checkAllowance(
            fromToken.address,
            currentWalletAddress,
            "0x150c3F0f16C3D9EB34351d7af9c961FeDc97A0fb", // SWAP_ROUTER_ADDRESS
            amountAfterFee || amountIn,
            fromToken.decimals,
            chainId
          )
          setNeedsApproval(allowance.needsApproval)
        } catch (error) {
          console.error("[Trade] Error checking allowance:", error)
        }
      } else {
        setNeedsApproval(false)
      }
    }

    checkTokenAllowance()
  }, [fromToken, amountIn, amountAfterFee, walletAddress, chainId])

  const handleSwap = async () => {
    if (!amountIn || Number.parseFloat(amountIn) === 0) {
      setError("Please enter an amount")
      return
    }

    if (!amountOut || Number.parseFloat(amountOut) === 0) {
      setError("Please wait for quote to load")
      return
    }

    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    const active = getCurrentWallet() || wallets[0]
    const sessionPassword = getWalletState()?.sessionPassword

    if (!sessionPassword) {
      setError("Wallet is locked. Please unlock your wallet first.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Step 1: Send fee first (0.5% from bot code)
      try {
        const feeAmount = (Number.parseFloat(amountIn) * FEE_PERCENTAGE) / 100
        await sendSwapFee(
          active,
          sessionPassword,
          fromToken.address,
          feeAmount.toFixed(6),
          fromToken.decimals,
          chainId
        )
      } catch (feeError: any) {
        console.error("[Trade] Fee collection failed:", feeError)
        // Continue with swap even if fee fails
      }

      // Step 2: Approve if needed
      if (needsApproval && !fromToken.isNative) {
        try {
          await approveToken(
            fromToken.address,
            active,
            sessionPassword,
            amountAfterFee || amountIn,
            fromToken.decimals,
            chainId
          )
        } catch (approvalError: any) {
          throw new Error(`Approval failed: ${approvalError.message}`)
        }
      }

      // Step 3: Execute swap with amount after fee
      const txHash = await executeSwap(
        fromToken,
        toToken,
        amountAfterFee || amountIn,
        amountOut,
        active,
        sessionPassword,
        slippage,
        chainId
      )

      setSuccess("Swap executed successfully!")
      setShowNotification(true)
      setNotificationData({
        message: "Swap executed successfully!",
        txHash,
        explorerUrl: `https://pepuscan.com/tx/${txHash}`,
      })

      // Clear inputs
      setAmountIn("")
      setAmountOut("")
      setSwapFee("0")
      setAmountAfterFee("")

      // Reload balances using current wallet address
      const currentWalletAddress = active.address
      if (fromToken.isNative) {
        const balance = await getNativeBalance(currentWalletAddress, chainId)
        setFromToken((prev) => ({ ...prev, balance }))
      } else {
        const balance = await getTokenBalance(fromToken.address, currentWalletAddress, chainId)
        setFromToken((prev) => ({ ...prev, balance }))
      }

      if (toToken.isNative) {
        const balance = await getNativeBalance(currentWalletAddress, chainId)
        setToToken((prev) => ({ ...prev, balance }))
      } else {
        const balance = await getTokenBalance(toToken.address, currentWalletAddress, chainId)
        setToToken((prev) => ({ ...prev, balance }))
      }
      
      // Reload all token balances to update dropdown
      if (allTokens.length > 0) {
        loadAllTokenBalances(currentWalletAddress, allTokens, chainId)
      }
    } catch (error: any) {
      console.error("[Trade] Swap error:", error)
      setError(error.message || "Swap failed")
    } finally {
      setLoading(false)
    }
  }

  const switchTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setAmountIn("")
    setAmountOut("")
  }

  const setMaxAmount = async () => {
    // Always get the current wallet to ensure we're using the right balance
    const wallets = getWallets()
    if (wallets.length === 0) return
    
    const active = getCurrentWallet() || wallets[0]
    const currentWalletAddress = active.address
    
    try {
      // Get fresh balance for the current wallet
      let balance: string
      if (fromToken.isNative) {
        balance = await getNativeBalance(currentWalletAddress, chainId)
      } else {
        balance = await getTokenBalance(fromToken.address, currentWalletAddress, chainId)
      }
      
      // Update token balance and set max amount
      setFromToken((prev) => ({ ...prev, balance }))
      setAmountIn(balance)
    } catch (error) {
      console.error("[Trade] Error getting max amount:", error)
      // Fallback to stored balance if available
      if (fromToken.balance) {
        setAmountIn(fromToken.balance)
      }
    }
  }

  // Close dropdowns when clicking outside
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

  const [fromTokenSearch, setFromTokenSearch] = useState("")
  const [toTokenSearch, setToTokenSearch] = useState("")

  // Sort tokens: tokens with balance first, then by holders_count (if available from API)
  const sortTokens = (tokens: Token[]): Token[] => {
    return [...tokens].sort((a, b) => {
      const aBalance = tokensWithBalances.get(a.address.toLowerCase()) || "0"
      const bBalance = tokensWithBalances.get(b.address.toLowerCase()) || "0"
      const aHasBalance = Number.parseFloat(aBalance) > 0
      const bHasBalance = Number.parseFloat(bBalance) > 0
      
      // Tokens with balance come first
      if (aHasBalance && !bHasBalance) return -1
      if (!aHasBalance && bHasBalance) return 1
      
      // If both have balance or both don't, maintain original order (already sorted by holders_count from API)
      return 0
    })
  }

  const filteredFromTokens = sortTokens(
    fromTokenSearch
      ? allTokens.filter(
          (token) =>
            token.symbol.toLowerCase().includes(fromTokenSearch.toLowerCase()) ||
            token.name.toLowerCase().includes(fromTokenSearch.toLowerCase()) ||
            token.address.toLowerCase().includes(fromTokenSearch.toLowerCase())
        )
      : allTokens
  )

  const filteredToTokens = sortTokens(
    toTokenSearch
      ? allTokens
          .filter((token) => token.address.toLowerCase() !== fromToken.address.toLowerCase())
          .filter(
            (token) =>
              token.symbol.toLowerCase().includes(toTokenSearch.toLowerCase()) ||
              token.name.toLowerCase().includes(toTokenSearch.toLowerCase()) ||
              token.address.toLowerCase().includes(toTokenSearch.toLowerCase())
          )
      : allTokens.filter((token) => token.address.toLowerCase() !== fromToken.address.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Trade</h1>
          <button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <div className="glass-card p-4 mb-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Slippage Tolerance</h3>
              <button
                onClick={() => setShowSlippageSettings(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    slippage === value
                      ? "bg-green-500 text-black"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(Number.parseFloat(e.target.value) || 0)}
              className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
              placeholder="Custom"
              step="0.1"
              min="0"
              max="50"
            />
          </div>
        )}

        {/* Swap Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 mb-4">
          {/* From Token */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">From</span>
              {fromToken.balance && (
                <span className="text-xs text-gray-400">
                  Balance: {Number.parseFloat(fromToken.balance).toFixed(4)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1" ref={fromSelectorRef}>
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-bold outline-none"
                />
                <button
                  onClick={() => setShowFromSelector(!showFromSelector)}
                  className="absolute right-0 top-0 flex items-center gap-2 glass-card px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {fromToken.symbol}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showFromSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl border border-white/10 max-h-64 overflow-y-auto z-50">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search tokens..."
                        value={fromTokenSearch}
                        onChange={(e) => setFromTokenSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-2 text-sm"
                      />
                      {loadingBalances && filteredFromTokens.length > 0 && (
                        <div className="text-xs text-gray-400 px-2 py-1 mb-2">Loading balances...</div>
                      )}
                      {filteredFromTokens.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No tokens found</div>
                      ) : (
                        <>
                          {/* Show tokens with balance first */}
                          {filteredFromTokens.some(token => {
                            const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                            return Number.parseFloat(balance) > 0
                          }) && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-400 px-2 py-1 mb-1 font-semibold">Your Tokens</div>
                              {filteredFromTokens
                                .filter(token => {
                                  const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                                  return Number.parseFloat(balance) > 0
                                })
                                .map((token) => {
                                  const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                                  
                                  return (
                                    <button
                                      key={token.address}
                                      onClick={() => {
                                        setFromToken({ ...token, balance })
                                        setShowFromSelector(false)
                                        setFromTokenSearch("")
                                        setAmountIn("")
                                        setAmountOut("")
                                      }}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors bg-green-500/5 border border-green-500/20 mb-1"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="text-xs font-bold">{token.symbol[0]}</span>
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{token.symbol}</span>
                                          <span className="text-xs text-green-400 font-semibold">●</span>
                                        </div>
                                        <div className="text-xs text-gray-400">{token.name}</div>
                                        <div className="text-xs text-green-400 mt-0.5">
                                          Balance: {Number.parseFloat(balance).toFixed(4)}
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })}
                            </div>
                          )}
                          
                          {/* Show all other tokens */}
                          <div>
                            {filteredFromTokens.some(token => {
                              const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                              return Number.parseFloat(balance) > 0
                            }) && (
                              <div className="text-xs text-gray-400 px-2 py-1 mb-1 mt-2 font-semibold">All Tokens</div>
                            )}
                            {filteredFromTokens
                              .filter(token => {
                                const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                                return Number.parseFloat(balance) === 0
                              })
                              .map((token) => {
                                return (
                                  <button
                                    key={token.address}
                                    onClick={() => {
                                      setFromToken(token)
                                      setShowFromSelector(false)
                                      setFromTokenSearch("")
                                      setAmountIn("")
                                      setAmountOut("")
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <span className="text-xs font-bold">{token.symbol[0]}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="font-semibold">{token.symbol}</div>
                                      <div className="text-xs text-gray-400">{token.name}</div>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={setMaxAmount}
                className="px-3 py-1 text-xs font-semibold bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={switchTokens}
              className="p-2 glass-card rounded-full border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

          {/* To Token */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">To</span>
              {toToken.balance && (
                <span className="text-xs text-gray-400">
                  Balance: {Number.parseFloat(toToken.balance).toFixed(4)}
                </span>
              )}
            </div>
            <div className="relative flex-1" ref={toSelectorRef}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={amountOut || (quoting ? "..." : "")}
                  readOnly
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-bold outline-none"
                />
                <button
                  onClick={() => setShowToSelector(!showToSelector)}
                  className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {toToken.symbol}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {showToSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl border border-white/10 max-h-64 overflow-y-auto z-50">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={toTokenSearch}
                      onChange={(e) => setToTokenSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-2 text-sm"
                    />
                    {loadingBalances && filteredToTokens.length > 0 && (
                      <div className="text-xs text-gray-400 px-2 py-1 mb-2">Loading balances...</div>
                    )}
                    {filteredToTokens.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No tokens found</div>
                    ) : (
                      <>
                        {/* Show tokens with balance first */}
                        {filteredToTokens.some(token => {
                          const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                          return Number.parseFloat(balance) > 0
                        }) && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-400 px-2 py-1 mb-1 font-semibold">Your Tokens</div>
                            {filteredToTokens
                              .filter(token => {
                                const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                                return Number.parseFloat(balance) > 0
                              })
                              .map((token) => {
                                const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                                
                                return (
                                  <button
                                    key={token.address}
                                    onClick={() => {
                                      setToToken({ ...token, balance })
                                      setShowToSelector(false)
                                      setToTokenSearch("")
                                      setAmountOut("")
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors bg-green-500/5 border border-green-500/20 mb-1"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <span className="text-xs font-bold">{token.symbol[0]}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{token.symbol}</span>
                                        <span className="text-xs text-green-400 font-semibold">●</span>
                                      </div>
                                      <div className="text-xs text-gray-400">{token.name}</div>
                                      <div className="text-xs text-green-400 mt-0.5">
                                        Balance: {Number.parseFloat(balance).toFixed(4)}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        )}
                        
                        {/* Show all other tokens */}
                        <div>
                          {filteredToTokens.some(token => {
                            const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                            return Number.parseFloat(balance) > 0
                          }) && (
                            <div className="text-xs text-gray-400 px-2 py-1 mb-1 mt-2 font-semibold">All Tokens</div>
                          )}
                          {filteredToTokens
                            .filter(token => {
                              const balance = tokensWithBalances.get(token.address.toLowerCase()) || "0"
                              return Number.parseFloat(balance) === 0
                            })
                            .map((token) => {
                              return (
                                <button
                                  key={token.address}
                                  onClick={() => {
                                    setToToken(token)
                                    setShowToSelector(false)
                                    setToTokenSearch("")
                                    setAmountOut("")
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-xs font-bold">{token.symbol[0]}</span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="font-semibold">{token.symbol}</div>
                                    <div className="text-xs text-gray-400">{token.name}</div>
                                  </div>
                                </button>
                              )
                            })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fee Info */}
          {amountIn && Number.parseFloat(amountIn) > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Platform Fee ({FEE_PERCENTAGE}%)</span>
                <span>-{swapFee} {fromToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount After Fee</span>
                <span>{amountAfterFee} {fromToken.symbol}</span>
              </div>
              {amountOut && (
                <div className="flex justify-between text-green-400">
                  <span>Expected Output</span>
                  <span>~{Number.parseFloat(amountOut).toFixed(6)} {toToken.symbol}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="glass-card p-4 rounded-xl border border-red-500/50 bg-red-500/10 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="glass-card p-4 rounded-xl border border-green-500/50 bg-green-500/10 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-400">{success}</span>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={loading || !amountIn || !amountOut || Number.parseFloat(amountIn) === 0 || needsApproval === undefined}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : needsApproval ? (
            "Approve Token First"
          ) : (
            "Swap"
          )}
        </button>

        {/* Transaction Notification */}
        {showNotification && notificationData && (
          <TransactionNotification
            message={notificationData.message}
            txHash={notificationData.txHash}
            explorerUrl={notificationData.explorerUrl}
            onClose={() => {
              setShowNotification(false)
              setNotificationData(null)
            }}
          />
        )}
      </div>

      <BottomNav active="trade" />
    </div>
  )
}

