"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity } from "@/lib/wallet"
import { getNativeBalance } from "@/lib/rpc"
import { fetchPepuPrice, fetchEthPrice } from "@/lib/coingecko"
import { fetchGeckoTerminalData } from "@/lib/gecko"
import { Send, ArrowDownLeft, Zap, TrendingUp, Menu, Globe, ImageIcon } from "lucide-react"
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
  const [chainId, setChainId] = useState(97741)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }

    updateActivity()
    fetchBalances()
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [router, chainId])

  const fetchBalances = async () => {
    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) {
        setLoading(false)
        return
      }

      const wallet = wallets[0]
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
        const provider = new ethers.JsonRpcProvider(
          chainId === 1 ? "https://eth.llamarpc.com" : "https://rpc-pepu-v2-mainnet-0.t.conduit.xyz",
        )
        const network = chainId === 1 ? "ethereum" : "pepe-unchained"

        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        const currentBlock = await provider.getBlockNumber()
        const fromBlock = Math.max(0, currentBlock - 10000)

        try {
          const logs = await provider.getLogs({
            fromBlock,
            toBlock: "latest",
            topics: [transferTopic, null, null, ethers.getAddress(wallet.address)],
          })

          const tokenAddresses = [...new Set(logs.map((log) => log.address))]

          // Fetch prices for all tokens in parallel
          const tokenPromises = tokenAddresses.map(async (tokenAddress) => {
            try {
              const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
              const [tokenBalance, decimals, symbol, name] = await Promise.all([
                contract.balanceOf(wallet.address),
                contract.decimals(),
                contract.symbol().catch(() => "???"),
                contract.name().catch(() => "Unknown Token"),
              ])

              const balanceFormatted = ethers.formatUnits(tokenBalance, decimals)

              if (Number.parseFloat(balanceFormatted) > 0) {
                // Fetch price from GeckoTerminal (use appropriate network)
                const geckoData = await fetchGeckoTerminalData(tokenAddress, network as "ethereum" | "pepe-unchained")
                const isBonded = geckoData && geckoData.price_usd !== null && geckoData.price_usd !== undefined
                const priceUsd = geckoData?.price_usd ? parseFloat(geckoData.price_usd) : 0
                const usdValue = isBonded
                  ? (Number.parseFloat(balanceFormatted) * priceUsd).toFixed(2)
                  : "0.00"

                return {
                  address: tokenAddress,
                  symbol,
                  name,
                  balance: balanceFormatted,
                  usdValue,
                  isBonded,
                  priceUsd: isBonded ? priceUsd : null,
                }
              }
              return null
            } catch (error) {
              console.error(`Error fetching token ${tokenAddress}:`, error)
              return null
            }
          })

          const tokenResults = await Promise.all(tokenPromises)
          const validTokens = tokenResults.filter((token) => token !== null)
          allBalances.push(...validTokens)
        } catch (error) {
          console.error("Error scanning for tokens:", error)
        }
      }

      setBalances(allBalances)

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

      setPortfolioValue(totalValue.toFixed(2))
    } catch (error) {
      console.error("Error fetching balances:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="glass-card rounded-none p-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Unchained</h1>
            <p className="text-sm text-gray-400">Web Wallet</p>
          </div>
          <button className="glass-card p-3 hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
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

          {/* Chain Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setChainId(1)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                chainId === 1 ? "bg-green-500 text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              Ethereum
            </button>
            <button
              onClick={() => setChainId(97741)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                chainId === 97741 ? "bg-green-500 text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              PEPU
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Send - Always visible */}
            <Link href="/send" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-sm font-semibold">Send</p>
            </Link>

            {/* Receive - Always visible */}
            <Link href="/receive" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-sm font-semibold">Receive</p>
            </Link>

            {chainId === 97741 && (
              <Link href="/swap" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Unchained Swap</p>
              </Link>
            )}

            {chainId === 97741 && (
              <Link href="/bridge" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Unchained Bridge</p>
              </Link>
            )}

            {chainId === 97741 && (
              <Link href="/browser" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">Unchained Browser</p>
              </Link>
            )}

            {chainId === 97741 && (
              <Link href="/nfts" className="glass-card p-4 text-center hover:bg-white/10 transition-all">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold">NFTs</p>
              </Link>
            )}
          </div>
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

      <BottomNav active="dashboard" />
    </div>
  )
}
