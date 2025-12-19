"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { getWallets, getWalletState, updateActivity, getCurrentWallet, clearAllWallets, confirmWalletReset } from "@/lib/wallet"
import { getSwapQuote, approveToken, executeSwap, checkAllowance } from "@/lib/swap"
import { getNativeBalance, getTokenBalance, getProviderWithFallback, getTokenInfo } from "@/lib/rpc"
import { isTokenBlacklisted } from "@/lib/blacklist"
import { calculateSwapFee, checkSwapFeeBalance } from "@/lib/fees"
import { TrendingUp, Loader, ArrowRightLeft, ChevronDown, ExternalLink, RotateCcw } from "lucide-react"
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
  const [password, setPassword] = useState("")
  const [chainId, setChainId] = useState(97741)
  const [loading, setLoading] = useState(false)
  const [collectingFees, setCollectingFees] = useState(false)
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
  const [swapFee, setSwapFee] = useState<string>("0")
  const [amountAfterFee, setAmountAfterFee] = useState<string>("")
  const [feeWarning, setFeeWarning] = useState("")
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
    
    // Load PEPU balance immediately
    const loadPepuBalance = async () => {
      try {
        const active = getCurrentWallet() || wallets[0]
        const balance = await getNativeBalance(active.address, chainId)
        console.log(`[Swap] Initial PEPU balance:`, balance)
        setFromToken((prev) => ({ ...prev, balance }))
        setWalletAddress(active.address)
      } catch (error) {
        console.error("[Swap] Error loading initial PEPU balance:", error)
      }
    }
    
    loadPepuBalance()
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

        // Filter out blacklisted tokens
        const filteredTokenAddresses = tokenAddresses.filter(
          (addr) => !isTokenBlacklisted(addr, chainId)
        )

        // Fetch token info for RPC-discovered tokens
        for (const tokenAddress of filteredTokenAddresses) {
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
      } else if (pepuToken) {
        // Always ensure PEPU token is set if it's native
        if (fromToken.isNative) {
          setFromToken(pepuToken)
        }
      }
      
      // If fromToken is PEPU native but doesn't have balance, update it
      if (fromToken.isNative && (!fromToken.balance || fromToken.balance === "0") && pepuToken) {
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
        setSwapFee("0")
        setAmountAfterFee("")
        setFeeWarning("")
        return
      }

      // Calculate swap fee (0.85% of amountIn)
      const { feeAmount, amountAfterFee: afterFee } = calculateSwapFee(amountIn, fromToken.decimals)
      setSwapFee(feeAmount)
      setAmountAfterFee(afterFee)

      // Check if user has enough balance
      try {
        const wallets = getWallets()
        if (wallets.length > 0) {
          const active = getCurrentWallet() || wallets[0]
          const feeCheck = await checkSwapFeeBalance(
            active.address,
            amountIn,
            fromToken.address,
            fromToken.decimals,
            chainId,
          )

          if (!feeCheck.hasEnough) {
            setFeeWarning(`Insufficient balance. Need ${amountIn} ${fromToken.symbol} to cover swap amount and fee.`)
          } else {
            setFeeWarning("")
          }
        }
      } catch (error: any) {
        console.error("Error checking swap fee balance:", error)
      }

      setQuoting(true)
      setError("")
      try {
        // Use amount after fee for the quote
        const quote = await getSwapQuote(fromToken, toToken, afterFee, chainId)
        setAmountOut(quote)

        // Check if approval is needed (only for ERC20 tokens, not native)
        // Approval should be for the full amountIn (before fee deduction)
        if (fromToken.address !== "0x0000000000000000000000000000000000000000") {
          const wallets = getWallets()
          if (wallets.length > 0) {
            const allowanceCheck = await checkAllowance(
              fromToken.address,
              wallets[0].address,
              "0x150c3F0f16C3D9EB34351d7af9c961FeDc97A0fb", // SWAP_ROUTER_ADDRESS
              amountIn, // Full amount needed for approval
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

    if (!password) {
      setError("Please enter your password to approve")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      await approveToken(fromToken.address, wallets[0], password, amountIn, fromToken.decimals, chainId)
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
      setError("Please enter an amount to swap")
      return
    }

    if (!password) {
      setError("Please enter your password to swap")
      return
    }

    // Check if user has enough balance
    const balance = Number.parseFloat(fromToken.balance || "0")
    const amount = Number.parseFloat(amountIn)
    if (balance < amount) {
      setError(`Insufficient balance. You have ${balance.toFixed(6)} ${fromToken.symbol}, but need ${amount.toFixed(6)}`)
      return
    }

    setLoading(true)
    setCollectingFees(true)
    setError("")
    setSuccess("")
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      // First, send the swap fee
      const { sendSwapFee } = await import("@/lib/fees")
      const { getSessionPassword } = await import("@/lib/wallet")
      const sessionPassword = password || getSessionPassword()
      
      if (!sessionPassword) {
        throw new Error("Wallet is locked. Please unlock your wallet first.")
      }

      // Calculate swap fee (0.85% of amountIn)
      const { feeAmount } = calculateSwapFee(amountIn, fromToken.decimals)

      // Send fee to fee wallet FIRST
      const feeTxHash = await sendSwapFee(
        wallets[0],
        sessionPassword,
        fromToken.address,
        feeAmount,
        fromToken.decimals,
        chainId,
      )

      // Wait for fee transaction to be confirmed
      const { getProviderWithFallback } = await import("@/lib/rpc")
      const provider = await getProviderWithFallback(chainId)
      await provider.waitForTransaction(feeTxHash)

      // Now proceed with the swap
      setCollectingFees(false)
      
      // amountOut was already calculated based on amountAfterFee in the quote
      // So we need to use amountAfterFee for the swap execution
      const { amountAfterFee } = calculateSwapFee(amountIn, fromToken.decimals)
      
      const txHash = await executeSwap(fromToken, toToken, amountAfterFee, amountOut, wallets[0], password, 0.5, chainId)

      // Record swap reward (only for PEPU chain)
      if (chainId === 97741) {
        try {
          const { addSwapReward } = await import("@/lib/rewards")
          // Calculate swap value in USD
          const { fetchPepuPrice } = await import("@/lib/coingecko")
          let tokenPrice = 0
          
          if (fromToken.isNative) {
            // Native PEPU
            tokenPrice = await fetchPepuPrice()
          } else {
            // For ERC20 tokens, try to get price from GeckoTerminal or use PEPU as proxy
            try {
              const { fetchGeckoTerminalTokenDetails } = await import("@/lib/gecko")
              const tokenDetails = await fetchGeckoTerminalTokenDetails(fromToken.address, chainId)
              tokenPrice = tokenDetails?.price || 0
            } catch {
              // Fallback to PEPU price as proxy
              tokenPrice = await fetchPepuPrice()
            }
          }
          
          const swapValueUsd = Number.parseFloat(amountIn) * tokenPrice
          if (swapValueUsd > 0) {
            await addSwapReward(wallets[0].address, swapValueUsd)
          }
        } catch (rewardError: any) {
          console.error("Failed to record swap reward:", rewardError)
          // Don't fail the swap if reward recording fails
        }
      }

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
      setCollectingFees(false)
    }
  }

  const fromTokenBalance = fromToken.balance || "0"
  const maxAmount = Number.parseFloat(fromTokenBalance)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pb-24 relative">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="glass-card rounded-3xl p-6 mb-4 border border-white/10 sticky top-4 z-50 backdrop-blur-xl bg-black/80 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center border border-green-500/30 shadow-lg shadow-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">Swap</h1>
              <p className="text-xs text-gray-400 mt-0.5">Trade tokens instantly</p>
            </div>
          </div>
        </div>

        {/* Main Swap Card */}
        <div className="p-4">
          <div className="glass-card p-6 space-y-4 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
          {/* From Token */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm text-gray-400 font-medium">You Pay</label>
              <p className="text-xs text-gray-500">
                Balance: <span className="text-green-400 font-semibold">{Number.parseFloat(fromTokenBalance).toFixed(6)}</span>
              </p>
            </div>
            <div className="relative" ref={fromSelectorRef}>
              <button
                onClick={() => setShowFromSelector(!showFromSelector)}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:bg-white/10"
              >
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center border border-green-500/30">
                    <span className="text-sm font-bold text-green-400">{fromToken.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="text-left">
                  <p className="font-bold text-lg">{fromToken.symbol}</p>
                  <p className="text-xs text-gray-400">{fromToken.name}</p>
                </div>
              </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFromSelector ? "rotate-180" : ""}`} />
              </button>

              {showFromSelector && (
                <div className="absolute z-[100] w-full mt-2 glass-card max-h-60 overflow-y-auto border border-white/10 rounded-2xl shadow-2xl bg-black/95 backdrop-blur-xl">
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

            <div className="mt-4">
              <div className="relative">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder-gray-600 focus:outline-none pr-20"
                  step="0.0001"
                />
                <button
                  onClick={() => setAmountIn(fromTokenBalance)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-semibold text-xs transition-all border border-green-500/30 hover:border-green-500/50"
                >
                  MAX
                </button>
              </div>
              {amountIn && Number.parseFloat(amountIn) > 0 && (
                <p className="text-xs text-yellow-400 mt-3 font-medium">
                  After fee: {Number.parseFloat(amountAfterFee).toFixed(6)} {fromToken.symbol}
                </p>
              )}
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={() => {
                const temp = fromToken
                setFromToken(toToken)
                setToToken(temp)
                setAmountIn("")
                setAmountOut("")
              }}
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300 rounded-2xl border-2 border-white/10 hover:border-green-500/50 hover:scale-110 shadow-lg"
            >
              <ArrowRightLeft className="w-6 h-6 text-green-400" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm text-gray-400 font-medium">You Receive</label>
              {toToken.balance && (
                <p className="text-xs text-gray-500">
                  Balance: <span className="text-green-400 font-semibold">{Number.parseFloat(toToken.balance || "0").toFixed(6)}</span>
                </p>
              )}
            </div>
            <div className="relative" ref={toSelectorRef}>
              <button
                onClick={() => setShowToSelector(!showToSelector)}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:bg-white/10"
              >
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center border border-green-500/30">
                    <span className="text-sm font-bold text-green-400">{toToken.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="text-left">
                  <p className="font-bold text-lg">{toToken.symbol}</p>
                  <p className="text-xs text-gray-400">{toToken.name}</p>
                </div>
              </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showToSelector ? "rotate-180" : ""}`} />
              </button>

              {showToSelector && (
                <div className="absolute z-[100] w-full mt-2 glass-card max-h-[500px] overflow-y-auto border border-white/10 rounded-2xl shadow-2xl bg-black/95 backdrop-blur-xl">
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

            <div className="mt-4">
            <input
              type="number"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              placeholder="0.0"
              disabled
                className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder-gray-600 focus:outline-none opacity-70"
              />
              {quoting && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader className="w-4 h-4 animate-spin text-green-400" />
                  <p className="text-xs text-gray-400">Getting quote...</p>
                </div>
              )}
            </div>
          </div>

          {/* Swap Fee Info */}
          {amountIn && Number.parseFloat(amountIn) > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Swap Fee (0.85%):</span>
                <span className="text-sm font-bold text-yellow-400">
                  {Number.parseFloat(swapFee).toFixed(6)} {fromToken.symbol}
                </span>
              </div>
              {feeWarning && (
                <p className="text-xs text-red-400 mt-2">{feeWarning}</p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-3 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to swap"
              className="input-field w-full"
            />
            <button
              type="button"
              onClick={() => {
                if (confirmWalletReset()) {
                  clearAllWallets()
                  router.push("/setup")
                }
              }}
              className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Forgot Password? Reset Wallet
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/50">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/50">
              <p className="text-green-400 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Buttons */}
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={loading}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-black hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              <span className="text-lg">Approve Token</span>
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={loading || !amountIn || !amountOut || !password || quoting}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-black hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              <span className="text-lg">
                {collectingFees 
                  ? "Collecting fees..." 
                  : loading 
                  ? "Swapping..." 
                  : "Swap"}
              </span>
            </button>
          )}
          </div>
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
