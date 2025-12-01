"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity, getCurrentWallet } from "@/lib/wallet"
import { getNativeBalance, getProviderWithFallback } from "@/lib/rpc"
import { Coins, Loader } from "lucide-react"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"
import TokenDetailsModal from "@/components/TokenDetailsModal"
import { ethers } from "ethers"

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]
const ETH_FORCE_TOKENS = [
  // USDC
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  // Custom token provided by user
  "0x93aA0ccD1e5628d3A841C4DbdF602D9eb04085d6",
]

export default function TokensPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chainId, setChainId] = useState(1)
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }

    updateActivity()
    fetchAllTokens()
  }, [router, chainId])

  const fetchAllTokens = async () => {
    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) {
        setLoading(false)
        return
      }

      const wallet = getCurrentWallet() || wallets[0]
      const allTokens: any[] = []

      // Get native balance
      const nativeBalance = await getNativeBalance(wallet.address, chainId)
      const nativeSymbol = chainId === 1 ? "ETH" : "PEPU"
      allTokens.push({
        address: "0x0000000000000000000000000000000000000000",
        name: nativeSymbol,
        symbol: nativeSymbol,
        decimals: 18,
        balance: nativeBalance,
        isNative: true,
      })

      const provider = await getProviderWithFallback(chainId)

      // Get Transfer event logs
      const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      const currentBlock = await provider.getBlockNumber()
      const lookback = chainId === 1 ? 50000 : 5000
      const fromBlock = Math.max(0, currentBlock - lookback) // Scan recent blocks

      try {
        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        const addressTopic = ethers.zeroPadValue(wallet.address, 32)

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

        const logs = [...logsFrom, ...logsTo]

        // Extract unique token addresses
        let tokenAddresses = [...new Set(logs.map((log) => log.address))]

        // Always include important ETH tokens so balances show even without recent transfers
        if (chainId === 1) {
          for (const token of ETH_FORCE_TOKENS) {
            if (!tokenAddresses.includes(token)) {
              tokenAddresses.push(token)
            }
          }
        }

        for (const tokenAddress of tokenAddresses) {
          try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
            const [balance, decimals, symbol, name] = await Promise.all([
              contract.balanceOf(wallet.address),
              contract.decimals(),
              contract.symbol().catch(() => "???"),
              contract.name().catch(() => "Unknown Token"),
            ])

            const balanceFormatted = ethers.formatUnits(balance, decimals)

            if (Number.parseFloat(balanceFormatted) > 0) {
              allTokens.push({
                address: tokenAddress,
                name,
                symbol,
                decimals: Number(decimals),
                balance: balanceFormatted,
                isNative: false,
              })
            }
          } catch (error) {
            console.error(`Error fetching token ${tokenAddress}:`, error)
          }
        }
      } catch (error) {
        console.error("Error scanning for tokens:", error)
      }

      setTokens(allTokens)
    } catch (error) {
      console.error("Error fetching tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tokens</h1>
              <p className="text-sm text-gray-400">Your token portfolio</p>
            </div>
          </div>
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            ✕
          </Link>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <p className="text-sm text-gray-400 mb-3">Network</p>
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
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-gray-400">Loading tokens...</p>
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Coins className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
            <p className="text-gray-400">You don't have any tokens on this network yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.address}
                className="glass-card p-4 flex items-center justify-between transition-all w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="font-bold text-green-500">{token.symbol[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{token.name}</p>
                    <p className="text-xs text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{Number.parseFloat(token.balance).toFixed(4)}</p>
                  <p className="text-xs text-gray-400">{token.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="tokens" />

      {/* Token Details Modal - Only for PEPU chain */}
      {selectedToken && chainId === 97741 && (
        <TokenDetailsModal
          tokenAddress={selectedToken.address}
          tokenSymbol={selectedToken.symbol}
          tokenName={selectedToken.name}
          tokenDecimals={selectedToken.decimals}
          isOpen={showTokenModal}
          onClose={() => {
            setShowTokenModal(false)
            setSelectedToken(null)
          }}
          chainId={chainId}
        />
      )}
    </div>
  )
}
