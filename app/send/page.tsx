"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity } from "@/lib/wallet"
import { sendNativeToken, sendToken } from "@/lib/transactions"
import { getNativeBalance, getTokenBalance, getProviderWithFallback } from "@/lib/rpc"
import { ArrowUp, Loader, ChevronDown } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import { ethers } from "ethers"

interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  isNative: boolean
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

export default function SendPage() {
  const router = useRouter()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [password, setPassword] = useState("")
  const [chainId, setChainId] = useState(1)
  const [balance, setBalance] = useState("0")
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const tokenSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }
    updateActivity()
    loadTokens()
  }, [router, chainId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenSelectorRef.current && !tokenSelectorRef.current.contains(event.target as Node)) {
        setShowTokenSelector(false)
      }
    }

    if (showTokenSelector) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showTokenSelector])

  const loadTokens = async () => {
    setLoadingTokens(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) return

      const wallet = wallets[0]
      const allTokens: Token[] = []

      // Get native balance
      const nativeBalance = await getNativeBalance(wallet.address, chainId)
      const nativeSymbol = chainId === 1 ? "ETH" : "PEPU"
      const nativeToken: Token = {
        address: "0x0000000000000000000000000000000000000000",
        name: nativeSymbol,
        symbol: nativeSymbol,
        decimals: 18,
        balance: nativeBalance,
        isNative: true,
      }
      allTokens.push(nativeToken)

      // Get ERC-20 tokens
      const provider = await getProviderWithFallback(chainId)

      const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 10000)

      try {
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

        const tokenAddresses = [...new Set(logs.map((log) => log.address))]

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
      if (allTokens.length > 0 && !selectedToken) {
        setSelectedToken(allTokens[0])
        setBalance(allTokens[0].balance)
      } else if (selectedToken) {
        const updated = allTokens.find((t) => t.address === selectedToken.address)
        if (updated) {
          setSelectedToken(updated)
          setBalance(updated.balance)
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error)
    } finally {
      setLoadingTokens(false)
    }
  }

  const handleSend = async () => {
    setError("")
    setSuccess("")

    if (!recipient || !amount || !password || !selectedToken) {
      setError("Please fill in all fields")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
      setError("Insufficient balance")
      return
    }

    setLoading(true)
    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      let txHash: string
      if (selectedToken.isNative) {
        txHash = await sendNativeToken(wallets[0], password, recipient, amount, chainId)
      } else {
        txHash = await sendToken(wallets[0], password, selectedToken.address, recipient, amount, chainId)
      }

      setSuccess(`Transaction sent: ${txHash.slice(0, 10)}...`)
      setRecipient("")
      setAmount("")
      setPassword("")
      await loadTokens() // Refresh balances

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Transaction failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Send Tokens</h1>
              <p className="text-sm text-gray-400">Transfer to another wallet</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 md:p-8 space-y-6">
          {/* Chain Selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Network</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChainId(1)
                  setSelectedToken(null)
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
                  setSelectedToken(null)
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  chainId === 97741 ? "bg-green-500 text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                PEPU
              </button>
            </div>
          </div>

          {/* Token Selector */}
          <div ref={tokenSelectorRef}>
            <label className="block text-sm text-gray-400 mb-2">Token</label>
            <div className="relative">
              <button
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="input-field flex items-center justify-between cursor-pointer"
                disabled={loadingTokens}
              >
                <span>
                  {loadingTokens
                    ? "Loading tokens..."
                    : selectedToken
                      ? `${selectedToken.symbol} - ${selectedToken.name}`
                      : "Select Token"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTokenSelector ? "rotate-180" : ""}`} />
              </button>
              {showTokenSelector && !loadingTokens && (
                <div className="absolute z-50 w-full mt-2 glass-card max-h-60 overflow-y-auto border border-white/20">
                  <div className="p-2">
                    {tokens.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No tokens found</div>
                    ) : (
                      tokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => {
                            setSelectedToken(token)
                            setBalance(token.balance)
                            setShowTokenSelector(false)
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{token.symbol}</p>
                              <p className="text-xs text-gray-400">{token.name}</p>
                            </div>
                            <p className="text-sm text-green-400">{Number.parseFloat(token.balance).toFixed(4)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="input-field"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="input-field flex-1"
                step="0.0001"
              />
              <button
                onClick={() => setAmount(balance)}
                className="px-4 py-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-semibold whitespace-nowrap"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Balance: {Number.parseFloat(balance).toFixed(4)} {selectedToken?.symbol || ""}
            </p>
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

          {/* Error Message */}
          {error && (
            <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="glass-card p-4 border border-green-500/50 bg-green-500/10">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || !recipient || !amount || !password || !selectedToken}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Sending..." : `Send ${selectedToken?.symbol || ""}`}
          </button>
        </div>
      </div>

      <BottomNav active="send" />
    </div>
  )
}
