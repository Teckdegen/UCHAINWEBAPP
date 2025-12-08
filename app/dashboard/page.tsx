"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getWallets,
  getWalletState,
  updateActivity,
  getCurrentWallet,
  getCurrentWalletId,
  setCurrentWalletId,
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
  addWallet,
  createWallet,
  unlockWallet,
} from "@/lib/wallet"
import { getSavedEthCustomTokens, addEthCustomToken } from "@/lib/customTokens"
import { getNativeBalance, getProviderWithFallback } from "@/lib/rpc"
import { isTokenBlacklisted } from "@/lib/blacklist"
import { fetchPepuPrice, fetchEthPrice } from "@/lib/coingecko"
import { fetchGeckoTerminalData } from "@/lib/gecko"
import { getAllEthTokenBalances } from "@/lib/ethTokens"
import { UCHAIN_TOKEN_ADDRESS } from "@/lib/config"
import { Send, ArrowDownLeft, Zap, TrendingUp, Menu, Globe, ImageIcon, Coins, Clock, Gift } from "lucide-react"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"
import { ethers } from "ethers"

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

export default function DashboardPage() {
  const router = useRouter()
  const [portfolioValue, setPortfolioValue] = useState("0.00")
  const [pepuPrice, setPepuPrice] = useState<number>(0)
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [balances, setBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [cachedBalances, setCachedBalances] = useState<any[]>([])
  const [cachedPortfolioValue, setCachedPortfolioValue] = useState("0.00")
  const [chainId, setChainId] = useState(() => {
    // Initialize from localStorage or default to PEPU
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selected_chain")
      return saved ? Number(saved) : 97741
    }
    return 97741
  })
  const [wallets, setWallets] = useState<any[]>([])
  const [currentWalletId, setCurrentWalletIdState] = useState<string | null>(null)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [addWalletMode, setAddWalletMode] = useState<"menu" | "from-seed" | "import-seed" | "import-key">("menu")
  const [newWalletName, setNewWalletName] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addSeedPhrase, setAddSeedPhrase] = useState("")
  const [addPrivateKey, setAddPrivateKey] = useState("")
  const [addWalletError, setAddWalletError] = useState("")
  const [addWalletLoading, setAddWalletLoading] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [showAddToken, setShowAddToken] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [customTokenError, setCustomTokenError] = useState("")
  const [customTokenInfo, setCustomTokenInfo] = useState<{
    address: string
    symbol: string
    name: string
    decimals: number
  } | null>(null)

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // No password required for viewing dashboard
    updateActivity()
    setWallets(wallets)
    setCurrentWalletIdState(getCurrentWalletId())
    
    const wallet = getCurrentWallet() || wallets[0]
    
    // Try to load from cache first if available
    const cacheKey = `balance_cache_${wallet.address}_${chainId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const cachedData = JSON.parse(cached)
        setBalances(cachedData.balances || [])
        setPortfolioValue(cachedData.portfolioValue || "0.00")
        setCachedBalances(cachedData.balances || [])
        setCachedPortfolioValue(cachedData.portfolioValue || "0.00")
      } catch (error) {
        console.error("Error loading cached balances:", error)
      }
    }
    
    // Only show loading if we don't have cached data (initial load)
    // If we have cache, show it immediately and fetch in background
    const hasCachedData = !!cached
    setIsInitialLoad(!hasCachedData)
    setLoading(!hasCachedData)
    
    fetchBalances()
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [router, chainId])

  // Save chainId to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_chain", chainId.toString())
    }
  }, [chainId])

  const fetchBalances = async () => {
    // Only show loading on initial load
    if (isInitialLoad) {
      setLoading(true)
    }
    
    try {
      const wallets = getWallets()
      if (wallets.length === 0) {
        setLoading(false)
        setIsInitialLoad(false)
        return
      }

      const wallet = getCurrentWallet() || wallets[0]
      const allBalances: any[] = []

      // Get native balance
      const balance = await getNativeBalance(wallet.address, chainId)
      const nativeSymbol = chainId === 1 ? "ETH" : "PEPU"

      let nativePrice = 0
      let nativeUsdValue = "0.00"

      if (chainId === 1) {
        // Ethereum - fetch from CoinGecko
        const price = await fetchEthPrice()
        setEthPrice(price)
        nativePrice = price
        nativeUsdValue = (Number.parseFloat(balance) * price).toFixed(2)
      } else if (chainId === 97741) {
        // PEPU - fetch from CoinGecko
        const price = await fetchPepuPrice()
        setPepuPrice(price)
        nativePrice = price
        nativeUsdValue = (Number.parseFloat(balance) * price).toFixed(2)
      }

      allBalances.push({
          symbol: nativeSymbol,
          name: chainId === 1 ? "Ethereum" : "Pepe Unchained",
          balance,
        usdValue: nativeUsdValue,
        isNative: true,
        isBonded: nativePrice > 0, // Native token is bonded if price > 0
      })

      // Get ERC-20 tokens
      if (chainId === 97741 || chainId === 1) {
        try {
          if (chainId === 1) {
            // For ETH: Use the new dual-method approach (RPC + Etherscan)
            try {
              console.log("[Dashboard] Fetching ETH tokens for:", wallet.address)
              const ethTokens = await getAllEthTokenBalances(wallet.address)
              console.log("[Dashboard] Found ETH tokens:", ethTokens.length)
              
              // Filter out blacklisted tokens
              const filteredTokens = ethTokens.filter(
                (token) => !isTokenBlacklisted(token.address, chainId)
              )
              console.log("[Dashboard] After blacklist filter:", filteredTokens.length)

              // Convert to dashboard format
              for (const token of filteredTokens) {
                const balanceFormatted = token.balanceFormatted
                const balanceNum = Number.parseFloat(balanceFormatted)
                
                if (balanceNum > 0) {
                  allBalances.push({
                    symbol: token.symbol,
                    name: token.name,
                    balance: balanceFormatted,
                    address: token.address,
                    decimals: token.decimals,
                    usdValue: token.usdValue || "0.00",
                    isNative: false,
                    isBonded: token.priceUsd !== undefined && token.priceUsd > 0,
                  })
                  console.log("[Dashboard] Added token:", token.symbol, balanceFormatted)
                }
              }
              console.log("[Dashboard] Total ETH tokens added to balances:", allBalances.filter(b => !b.isNative).length)
            } catch (ethTokenError) {
              console.error("[Dashboard] Error fetching ETH tokens:", ethTokenError)
              // Continue even if ETH token fetching fails
            }
          } else {
            // For PEPU: Use existing logic with contract calls and GeckoTerminal
            const provider = await getProviderWithFallback(chainId)
            const network = "pepe-unchained"

            const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            let currentBlock = 0
            try {
              currentBlock = await provider.getBlockNumber()
            } catch (error) {
              console.error("Error getting block number:", error)
            }

            const lookback = 10000
            const fromBlock = Math.max(0, currentBlock - lookback)

            let tokenAddresses: string[] = []

            // Try to get token addresses from transfer logs
            try {
              const addressTopic = ethers.zeroPadValue(wallet.address, 32)

              const [logsFrom, logsTo] = await Promise.all([
                provider.getLogs({
                  fromBlock,
                  toBlock: "latest",
                  topics: [transferTopic, addressTopic],
                }).catch(() => []),
                provider.getLogs({
                  fromBlock,
                  toBlock: "latest",
                  topics: [transferTopic, null, addressTopic],
                }).catch(() => []),
              ])

              const allLogs = [...logsFrom, ...logsTo]
              tokenAddresses = [...new Set(allLogs.map((log) => log.address.toLowerCase()))]
            } catch (error) {
              console.error("Error fetching transfer logs:", error)
            }

            // Filter out blacklisted tokens
            const filteredTokenAddresses = tokenAddresses.filter(
              (addr) => !isTokenBlacklisted(addr, chainId)
            )

            // Fetch token details for PEPU
            const tokenPromises = filteredTokenAddresses.map(async (tokenAddress) => {
              try {
                const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
                const [balance, dec, sym, nm] = await Promise.all([
                  contract.balanceOf(wallet.address).catch(() => ethers.parseUnits("0", 18)),
                  contract.decimals().catch(() => 18),
                  contract.symbol().catch(() => "???"),
                  contract.name().catch(() => "Unknown Token"),
                ])

                const balanceFormatted = ethers.formatUnits(balance, dec)
                const hasBalance = Number.parseFloat(balanceFormatted) > 0

                if (!hasBalance) return null

                let priceUsd = 0
                let isBonded = false

                // Fetch price from CoinGecko for PEPU/UCHAIN token (check if it's UCHAIN which is PEPU on PEPU chain)
                if (tokenAddress.toLowerCase() === UCHAIN_TOKEN_ADDRESS.toLowerCase()) {
                  try {
                    priceUsd = await fetchPepuPrice()
                    isBonded = priceUsd > 0
                  } catch (error) {
                    console.error(`Error fetching PEPU price from CoinGecko:`, error)
                  }
                } else {
                  // For other tokens, try GeckoTerminal
                  try {
                    const geckoData = await fetchGeckoTerminalData(tokenAddress, "pepe-unchained")
                    priceUsd = geckoData?.price_usd ? parseFloat(geckoData.price_usd) : 0
                    isBonded = geckoData && geckoData.price_usd !== null && geckoData.price_usd !== undefined
                  } catch (error) {
                    console.error(`Error fetching price for ${tokenAddress}:`, error)
                  }
                }
                const usdValue = isBonded && hasBalance
                  ? (Number.parseFloat(balanceFormatted) * priceUsd).toFixed(2)
                  : "0.00"

                return {
                  address: tokenAddress,
                  symbol: sym,
                  name: nm,
                  balance: balanceFormatted,
                  decimals: dec,
                  usdValue,
                  isNative: false,
                  isBonded,
                  priceUsd: isBonded ? priceUsd : null,
                }
              } catch (error) {
                console.error(`Error fetching token ${tokenAddress}:`, error)
                return null
              }
            })

            const tokenResults = await Promise.all(tokenPromises)
            const validTokens = tokenResults.filter((token) => token !== null)
            allBalances.push(...validTokens)
          }
        } catch (error) {
          console.error("Error scanning for tokens:", error)
          // Don't throw - still show native balance even if token scanning fails
        }
      }

      // Calculate total portfolio value
      // Only include bonded tokens (tokens with valid USD price)
      const totalValue = allBalances.reduce((sum, token) => {
        if (token.isNative) {
          // Native token (ETH or PEPU) - add if price > 0
          return sum + (nativePrice > 0 ? Number.parseFloat(token.usdValue) : 0)
        } else {
          // ERC20 tokens - only add if bonded
          return sum + (token.isBonded ? Number.parseFloat(token.usdValue) : 0)
        }
      }, 0)

      const portfolioValueStr = totalValue.toFixed(2)
      
      // Update state
      setBalances(allBalances)
      setPortfolioValue(portfolioValueStr)
      
      // Update cache
      setCachedBalances(allBalances)
      setCachedPortfolioValue(portfolioValueStr)
      
      // Save to localStorage
      const cacheKey = `balance_cache_${wallet.address}_${chainId}`
      localStorage.setItem(cacheKey, JSON.stringify({
        balances: allBalances,
        portfolioValue: portfolioValueStr,
        timestamp: Date.now(),
      }))
      
    } catch (error) {
      console.error("Error fetching balances:", error)
      
      // On error, use cached data if available (only if not initial load)
      if (!isInitialLoad && cachedBalances.length > 0) {
        console.log("[Dashboard] Using cached balances due to fetch error")
        setBalances(cachedBalances)
        setPortfolioValue(cachedPortfolioValue)
      } else if (isInitialLoad) {
        // On initial load error, show empty state
        setBalances([])
        setPortfolioValue("0.00")
      }
      // If not initial load and no cache, keep previous state (don't clear)
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 relative">
      {/* Header */}
      <div className="glass-card rounded-none p-6 border-b border-white/10 relative z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Unchained</h1>
            <p className="text-sm text-gray-400">Web Wallet</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Wallet selector */}
            {wallets.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu((prev) => !prev)}
                  className="glass-card px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-400">
                      {wallets.find((w) => w.id === currentWalletId)?.name?.[0] ||
                        wallets[0].name?.[0] ||
                        "W"}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">Active Wallet</p>
                    <p className="text-sm font-semibold">
                      {wallets.find((w) => w.id === currentWalletId)?.name || wallets[0].name || "My Wallet"}
                    </p>
                  </div>
                </button>
                {/* Simple dropdown list, toggled by button */}
                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-card border border-white/10 max-h-64 overflow-y-auto z-[200]">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => {
                          setCurrentWalletId(wallet.id)
                          setCurrentWalletIdState(wallet.id)
                          setShowWalletMenu(false)
                          fetchBalances()
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex flex-col ${
                          wallet.id === currentWalletId ? "bg-green-500/10" : ""
                        }`}
                      >
                        <span className="font-semibold">{wallet.name || "Wallet"}</span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowAddWallet(true)
                        setAddWalletMode("menu")
                        setAddWalletError("")
                        setShowWalletMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-green-500/10 border-t border-white/10"
                    >
                      + Add Wallet
          </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="glass-card p-8 mb-8">
          <p className="text-gray-400 text-sm mb-2">Portfolio Value</p>
          <h2 className="text-5xl font-bold gradient-text mb-2">${portfolioValue}</h2>
          {chainId === 97741 && pepuPrice > 0 && (
            <p className="text-sm text-gray-400 mb-4">
              PEPU Price: ${pepuPrice.toFixed(8)}
            </p>
          )}
          {chainId === 1 && ethPrice > 0 && (
            <p className="text-sm text-gray-400 mb-4">
              ETH Price: ${ethPrice.toFixed(2)}
            </p>
          )}

          {/* Active wallet display inside portfolio */}
          {wallets.length > 0 && (
            <div className="mb-4 text-xs text-gray-400">
              <span className="mr-1">Wallet:</span>
              <span className="font-mono text-green-400">
                {(wallets.find((w) => w.id === currentWalletId) || wallets[0]).address.slice(0, 6)}...
                {(wallets.find((w) => w.id === currentWalletId) || wallets[0]).address.slice(-4)}
              </span>
            </div>
          )}

          {/* Chain Selector (ETH / PEPU) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChainId(1)
                  setBalances([])
                  setPortfolioValue("0.00")
                  setLoading(true)
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  chainId === 1 ? "bg-green-500 text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                Ethereum
              </button>
              <button
                onClick={() => {
                  setChainId(97741)
                  setBalances([])
                  setPortfolioValue("0.00")
                  setLoading(true)
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  chainId === 97741 ? "bg-green-500 text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                PEPU
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {chainId === 1 ? (
            // Ethereum: Send + Receive + Add Custom Token (+)
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/send" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Send className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">Send</p>
                </Link>

                <Link href="/receive" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">Receive</p>
                </Link>
              </div>

              {/* ETH Add Custom Token "+" button under Send/Receive */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowAddToken(true)
                    setCustomTokenAddress("")
                    setCustomTokenError("")
                  }}
                  className="w-10 h-10 rounded-full bg-green-500 text-black flex items-center justify-center text-xl font-bold hover:bg-green-400 transition-colors"
                  aria-label="Add custom token"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            // PEPU: Bridge + Swap + Tokens + Transactions
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/bridge" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Unchained Bridge</p>
              </Link>

              <Link href="/swap" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Unchained Swap</p>
              </Link>

              <Link href="/tokens" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Tokens</p>
              </Link>

              <Link href="/transactions" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Transactions</p>
              </Link>

              <Link href="/rewards" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Rewards</p>
              </Link>
            </div>
            )}
        </div>

        {/* Token List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400">Your Tokens</h3>
            {balances.map((token) => (
              <div key={token.symbol} className="glass-card p-4 flex items-center justify-between hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">{token.symbol[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{token.name}</p>
                    <p className="text-xs text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{Number.parseFloat(token.balance).toFixed(4)}</p>
                  {!token.isNative && !token.isBonded ? (
                    <p className="text-xs text-gray-500">Not Bonded</p>
                  ) : (
                  <p className="text-xs text-green-400">${token.usdValue}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Token Modal (Dashboard, ETH) */}
      {showAddToken && chainId === 1 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Custom ETH Token</h2>
              <button
                onClick={() => {
                  setShowAddToken(false)
                  setCustomTokenAddress("")
                  setCustomTokenError("")
                  setCustomTokenInfo(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Token Contract Address</label>
              <input
                type="text"
                value={customTokenAddress}
                onChange={(e) => {
                  setCustomTokenAddress(e.target.value)
                  setCustomTokenError("")
                  setCustomTokenInfo(null)
                }}
                placeholder="0x..."
                className="input-field"
              />
            </div>

            {customTokenError && <p className="text-xs text-red-400">{customTokenError}</p>}

            {customTokenInfo && (
              <div className="glass-card p-3 border border-white/10 text-xs space-y-1">
                <p className="text-gray-300">
                  <span className="font-semibold">Symbol:</span> {customTokenInfo.symbol}
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Name:</span> {customTokenInfo.name}
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Decimals:</span> {customTokenInfo.decimals}
                </p>
                <p className="text-[11px] text-gray-500">
                  Confirm this matches the token details on your explorer before saving.
                </p>
              </div>
            )}

            <button
              onClick={async () => {
                try {
                  setCustomTokenError("")
                  if (!customTokenAddress.trim()) {
                    setCustomTokenError("Enter a token contract address")
                    return
                  }

                  const normalized = customTokenAddress.trim()

                  // Step 1: lookup token details via public RPC
                  if (!customTokenInfo) {
                    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
                    const contract = new ethers.Contract(normalized, ERC20_ABI, provider)
                    const [symbol, name, decimals] = await Promise.all([
                      contract.symbol().catch(() => "???"),
                      contract.name().catch(() => "Unknown Token"),
                      contract.decimals(),
                    ])
                    setCustomTokenInfo({
                      address: normalized,
                      symbol,
                      name,
                      decimals: Number(decimals),
                    })
                    return
                  }

                  // Step 2: user confirms, so save token
                  addEthCustomToken(customTokenInfo.address)
                  setShowAddToken(false)
                  setCustomTokenAddress("")
                  setCustomTokenInfo(null)
                  await fetchBalances()
                } catch (err: any) {
                  setCustomTokenError(err.message || "Failed to add token")
                }
              }}
              className="w-full px-4 py-3 rounded-lg bg-green-500 text-black hover:bg-green-600 font-semibold transition-all text-sm"
            >
              {customTokenInfo ? "Confirm & Save Token" : "Lookup Token"}
            </button>

            <p className="text-[11px] text-gray-500">
              This token will be remembered locally and included in your ETH portfolio, tokens list and send list using
              only public RPC.
            </p>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Add Wallet</h2>
              <button
                onClick={() => {
                  setShowAddWallet(false)
                  setAddWalletMode("menu")
                  setAddWalletError("")
                  setAddPassword("")
                  setAddSeedPhrase("")
                  setAddPrivateKey("")
                  setNewWalletName("")
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {addWalletMode === "menu" && (
              <div className="space-y-3">
                <button
                  onClick={() => setAddWalletMode("from-seed")}
                  className="w-full px-4 py-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-semibold transition-all text-sm"
                >
                  Create New Wallet (New Seed)
                </button>
                <button
                  onClick={() => setAddWalletMode("import-seed")}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20 font-semibold transition-all text-sm"
                >
                  Import Seed Phrase
                </button>
                <button
                  onClick={() => setAddWalletMode("import-key")}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20 font-semibold transition-all text-sm"
                >
                  Import Private Key
                </button>
                <p className="text-xs text-gray-400">
                  All wallets share the same 4-digit passcode. You&apos;ll be asked for it to add new wallets.
                </p>
              </div>
            )}

            {addWalletMode === "from-seed" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Wallet Name (Optional)</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="My New Wallet"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Existing 4-Digit PIN</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    maxLength={4}
                    placeholder="Enter your existing 4-digit PIN"
                    className="input-field"
                  />
                </div>
                {addWalletError && <p className="text-xs text-red-400">{addWalletError}</p>}
                <button
                  disabled={addWalletLoading}
                  onClick={async () => {
                    try {
                      setAddWalletError("")
                      if (!addPassword || addPassword.length !== 4) {
                        setAddWalletError("Please enter your 4-digit PIN")
                        return
                      }
                      setAddWalletLoading(true)
                      const newWallet = await createWallet(addPassword, newWalletName || undefined, chainId)
                      addWallet(newWallet)
                      // Auto-unlock so signing doesn't require /unlock
                      unlockWallet(addPassword)
                      setWallets(getWallets())
                      setCurrentWalletId(newWallet.id)
                      setCurrentWalletIdState(newWallet.id)
                      setShowAddWallet(false)
                      setAddWalletMode("menu")
                      setAddPassword("")
                      setNewWalletName("")
                      fetchBalances()
                    } catch (err: any) {
                      setAddWalletError(err.message || "Failed to create wallet")
                    } finally {
                      setAddWalletLoading(false)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-green-500 text-black hover:bg-green-600 font-semibold transition-all disabled:opacity-50 text-sm"
                >
                  {addWalletLoading ? "Creating..." : "Create Wallet"}
                </button>
              </div>
            )}

            {addWalletMode === "import-seed" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Wallet Name (Optional)</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="My Imported Wallet"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Seed Phrase</label>
                  <textarea
                    value={addSeedPhrase}
                    onChange={(e) => setAddSeedPhrase(e.target.value)}
                    placeholder="Enter your 12 or 24 word seed phrase"
                    className="input-field min-h-[90px]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Existing 4-Digit PIN</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    maxLength={4}
                    placeholder="Enter your existing 4-digit PIN"
                    className="input-field"
                  />
                </div>
                {addWalletError && <p className="text-xs text-red-400">{addWalletError}</p>}
                <button
                  disabled={addWalletLoading}
                  onClick={async () => {
                    try {
                      setAddWalletError("")
                      if (!addSeedPhrase || !addPassword || addPassword.length !== 4) {
                        setAddWalletError("Enter seed phrase and your 4-digit PIN")
                        return
                      }
                      setAddWalletLoading(true)
                      const newWallet = await importWalletFromMnemonic(
                        addSeedPhrase.trim(),
                        addPassword,
                        newWalletName || "Imported Wallet",
                        chainId,
                      )
                      addWallet(newWallet)
                      // Auto-unlock so signing doesn't require /unlock
                      unlockWallet(addPassword)
                      setWallets(getWallets())
                      setCurrentWalletId(newWallet.id)
                      setCurrentWalletIdState(newWallet.id)
                      setShowAddWallet(false)
                      setAddWalletMode("menu")
                      setAddPassword("")
                      setAddSeedPhrase("")
                      setNewWalletName("")
                      fetchBalances()
                    } catch (err: any) {
                      setAddWalletError(err.message || "Failed to import seed phrase")
                    } finally {
                      setAddWalletLoading(false)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-green-500 text-black hover:bg-green-600 font-semibold transition-all disabled:opacity-50 text-sm"
                >
                  {addWalletLoading ? "Importing..." : "Import Seed Phrase"}
                </button>
              </div>
            )}

            {addWalletMode === "import-key" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Wallet Name (Optional)</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="My Imported Wallet"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Private Key</label>
                  <textarea
                    value={addPrivateKey}
                    onChange={(e) => setAddPrivateKey(e.target.value)}
                    placeholder="Enter your private key"
                    className="input-field min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Existing 4-Digit PIN</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    maxLength={4}
                    placeholder="Enter your existing 4-digit PIN"
                    className="input-field"
                  />
                </div>
                {addWalletError && <p className="text-xs text-red-400">{addWalletError}</p>}
                <button
                  disabled={addWalletLoading}
                  onClick={async () => {
                    try {
                      setAddWalletError("")
                      if (!addPrivateKey || !addPassword || addPassword.length !== 4) {
                        setAddWalletError("Enter private key and your 4-digit PIN")
                        return
                      }
                      setAddWalletLoading(true)
                      const newWallet = await importWalletFromPrivateKey(
                        addPrivateKey.trim(),
                        addPassword,
                        newWalletName || "Imported Wallet",
                        chainId,
                      )
                      addWallet(newWallet)
                      // Auto-unlock so signing doesn't require /unlock
                      unlockWallet(addPassword)
                      setWallets(getWallets())
                      setCurrentWalletId(newWallet.id)
                      setCurrentWalletIdState(newWallet.id)
                      setShowAddWallet(false)
                      setAddWalletMode("menu")
                      setAddPassword("")
                      setAddPrivateKey("")
                      setNewWalletName("")
                      fetchBalances()
                    } catch (err: any) {
                      setAddWalletError(err.message || "Failed to import private key")
                    } finally {
                      setAddWalletLoading(false)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-green-500 text-black hover:bg-green-600 font-semibold transition-all disabled:opacity-50 text-sm"
                >
                  {addWalletLoading ? "Importing..." : "Import Private Key"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav active="dashboard" />
    </div>
  )
}
