"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, updateActivity, getCurrentWallet, clearAllWallets, confirmWalletReset } from "@/lib/wallet"
import { getSavedEthCustomTokens } from "@/lib/customTokens"
import { sendNativeToken, sendToken } from "@/lib/transactions"
import { getNativeBalance, getTokenBalance, getProviderWithFallback } from "@/lib/rpc"
import { isTokenBlacklisted } from "@/lib/blacklist"
import { calculateTransactionFeePepu, checkTransactionFeeBalance } from "@/lib/fees"
import { getAllEthTokenBalances } from "@/lib/ethTokens"
import { resolvePepuDomain, isPepuDomain, parseDomainInput } from "@/lib/domains"
import { ArrowUp, Loader, ChevronDown, CheckCircle, RotateCcw } from "lucide-react"
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
  const [transactionFee, setTransactionFee] = useState<string>("0")
  const [feeWarning, setFeeWarning] = useState("")
  const [feeCalculated, setFeeCalculated] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string>("")
  const [resolvingDomain, setResolvingDomain] = useState(false)
  const [domainInput, setDomainInput] = useState("")
  const tokenSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // No password required to enter page - only when sending transactions
    updateActivity()
    loadTokens()
  }, [router, chainId])

  // Calculate transaction fee when amount or token changes (hidden from UI but required for PEPU chain)
  // Retries every 5 seconds if CoinGecko fails
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null
    let isMounted = true

    const calculateFee = async (isRetry = false) => {
      if (!amount || !selectedToken || Number.parseFloat(amount) === 0) {
        setTransactionFee("0")
        setFeeWarning("")
        setFeeCalculated(true) // Allow transactions on other chains
        return
      }

      // Only calculate fee for PEPU chain (chainId === 97741)
      if (chainId !== 97741) {
        setTransactionFee("0")
        setFeeWarning("")
        setFeeCalculated(true) // Allow transactions on other chains
        return
      }

      try {
        const wallets = getWallets()
        if (wallets.length === 0) {
          setFeeCalculated(false)
          return
        }

        const active = getCurrentWallet() || wallets[0]
        
        // Calculate fee based on token type
        let feeAmount = "0"
        if (selectedToken.isNative) {
          // Native PEPU: Calculate fee (may be $0.05 or 5% if < $1)
          feeAmount = await calculateTransactionFeePepu(amount)
        } else {
          // ERC20 token: Calculate 0.85% fee in same token
          const { calculateERC20TokenFee } = await import("@/lib/fees")
          const feeCalc = calculateERC20TokenFee(amount, selectedToken.decimals)
          feeAmount = feeCalc.feeAmount
        }
        
          // If fee calculation fails (returns 0 or throws), retry after 5 seconds
          if (!feeAmount || Number.parseFloat(feeAmount) === 0) {
            if (isMounted) {
              setFeeCalculated(false)
              setTransactionFee("0")
              setFeeWarning("") // Don't show fee calculation errors to user
              
              // Retry after 5 seconds silently
              retryTimeout = setTimeout(() => {
                if (isMounted) {
                  calculateFee(true)
                }
              }, 5000)
            }
            return
          }

        if (isMounted) {
          setTransactionFee(feeAmount)
          setFeeWarning("") // Clear retry message

          // Check if user has enough PEPU for fee (required for all tokens on PEPU chain)
          const feeCheck = await checkTransactionFeeBalance(
            active.address,
            amount,
            selectedToken.address,
            selectedToken.decimals,
            chainId,
          )

          if (!feeCheck.hasEnough) {
            setFeeWarning(
              `Insufficient balance. Required: ${Number.parseFloat(feeCheck.requiredTotal).toFixed(6)} ${selectedToken.isNative ? 'PEPU' : selectedToken.symbol}, Available: ${Number.parseFloat(feeCheck.currentBalance).toFixed(6)} ${selectedToken.isNative ? 'PEPU' : selectedToken.symbol}`,
            )
            setFeeCalculated(false) // Disable send if insufficient balance
          } else {
            setFeeWarning("")
            setFeeCalculated(true)
          }
        }
      } catch (error: any) {
        console.error("Error calculating fee:", error)
        if (isMounted) {
          setFeeWarning("") // Don't show fee calculation errors to user
          setFeeCalculated(false) // Disable send button if fee calculation fails
          setTransactionFee("0")
          
          // Retry after 5 seconds silently
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              calculateFee(true)
            }
          }, 5000)
        }
      }
    }

    calculateFee()

    // Cleanup function
    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [amount, selectedToken, chainId])

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

      const wallet = getCurrentWallet() || wallets[0]
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
      if (chainId === 1) {
        // For ETH chain, use getAllEthTokenBalances which includes price fetching
        try {
          const ethTokens = await getAllEthTokenBalances(wallet.address)
          
          // Filter out blacklisted tokens and convert to Token format
          for (const ethToken of ethTokens) {
            if (!isTokenBlacklisted(ethToken.address, chainId)) {
              allTokens.push({
                address: ethToken.address,
                name: ethToken.name,
                symbol: ethToken.symbol,
                decimals: ethToken.decimals,
                balance: ethToken.balanceFormatted,
                isNative: false,
              })
            }
          }
        } catch (error) {
          console.error("Error loading ETH tokens:", error)
        }
      } else {
        // For PEPU chain, use the existing log scanning method
        const provider = await getProviderWithFallback(chainId)

        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        const currentBlock = await provider.getBlockNumber()
        const lookback = 10000
        const fromBlock = Math.max(0, currentBlock - lookback)

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
          let tokenAddresses = [...new Set(logs.map((log) => log.address.toLowerCase()))]

          // Filter out blacklisted tokens
          const filteredTokenAddresses = tokenAddresses.filter(
            (addr) => !isTokenBlacklisted(addr, chainId)
          )

          for (const tokenAddress of filteredTokenAddresses) {
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
      }

      setTokens(allTokens)
      if (allTokens.length > 0) {
        if (!selectedToken) {
          // No token selected, select the first one
          setSelectedToken(allTokens[0])
          setBalance(allTokens[0].balance)
        } else {
          // Try to find the selected token in the new list
          const updated = allTokens.find((t) => t.address === selectedToken.address)
          if (updated) {
            setSelectedToken(updated)
            setBalance(updated.balance)
          } else {
            // Selected token doesn't exist on this chain, select the first one
            setSelectedToken(allTokens[0])
            setBalance(allTokens[0].balance)
          }
        }
      } else {
        // No tokens available, clear selection
        setSelectedToken(null)
        setBalance("0")
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

    // Resolve domain if it's a .pepu or .uchain domain
    let finalRecipient = recipient.trim()
    if (chainId === 97741 && isPepuDomain(recipient)) {
      if (resolvedAddress) {
        finalRecipient = resolvedAddress
      } else {
        // Try to resolve again (will try .pepu first, then .uchain if not found)
        const parsed = parseDomainInput(recipient)
        if (parsed) {
          // Pass undefined if tld is null (will try both .pepu and .uchain)
          const address = await resolvePepuDomain(parsed.name, parsed.tld || undefined)
          if (address) {
            finalRecipient = address
          } else {
            setError("Domain not found or expired")
            return
          }
        } else {
          setError("Invalid domain format")
          return
        }
      }
    }

    // Validate address format
    if (!ethers.isAddress(finalRecipient)) {
      setError("Invalid recipient address")
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

      const active = getCurrentWallet() || wallets[0]

      let txHash: string
      if (selectedToken.isNative) {
        txHash = await sendNativeToken(active, password, finalRecipient, amount, chainId)
      } else {
        txHash = await sendToken(active, password, selectedToken.address, finalRecipient, amount, chainId)
      }

      // Store transaction in history with full link
      const explorerUrl = chainId === 1 
        ? `https://etherscan.io/tx/${txHash}`
        : `https://pepuscan.com/tx/${txHash}`
      const txHistory = JSON.parse(localStorage.getItem("transaction_history") || "[]")
      txHistory.unshift({
        hash: txHash,
        type: "send",
        to: recipient,
        amount,
        token: selectedToken.symbol,
        chainId,
        timestamp: Date.now(),
        explorerUrl,
      })
      localStorage.setItem("transaction_history", JSON.stringify(txHistory.slice(0, 100)))

      setSuccess(`Transaction sent! View: ${explorerUrl}`)
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
                  setTokens([])
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
                  setTokens([])
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
            <label className="block text-sm text-gray-400 mb-2">
              Recipient Address {chainId === 97741 && <span className="text-green-400">or .pepu domain</span>}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={async (e) => {
                const value = e.target.value.trim()
                setRecipient(value)
                setResolvedAddress("")
                setDomainInput("")
                
                // Only resolve domains on PEPU chain
                if (chainId === 97741 && isPepuDomain(value)) {
                  setResolvingDomain(true)
                  const parsed = parseDomainInput(value)
                  if (parsed) {
                    // If tld is null, show the name without TLD (will try both .pepu and .uchain)
                    if (parsed.tld) {
                      setDomainInput(`${parsed.name}${parsed.tld}`)
                    } else {
                      setDomainInput(parsed.name) // Will try both TLDs
                    }
                    // Pass undefined if tld is null (will try both .pepu and .uchain)
                    const address = await resolvePepuDomain(parsed.name, parsed.tld || undefined)
                    if (address) {
                      setResolvedAddress(address)
                    } else {
                      setResolvedAddress("")
                    }
                  }
                  setResolvingDomain(false)
                }
              }}
              placeholder={chainId === 97741 ? "0x... or teck.pepu or name.uchain" : "0x..."}
              className="input-field"
            />
            {resolvingDomain && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <Loader className="w-3 h-3 animate-spin" />
                Resolving domain...
              </p>
            )}
            {resolvedAddress && domainInput && (
              <div className="mt-2 glass-card p-3 border border-green-500/30 bg-green-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Domain: {domainInput}</p>
                    <p className="text-sm text-green-400 font-mono break-all">{resolvedAddress}</p>
                  </div>
                </div>
              </div>
            )}
            {recipient && isPepuDomain(recipient) && !resolvedAddress && !resolvingDomain && chainId === 97741 && (
              <p className="text-xs text-red-400 mt-1">Domain not found or expired</p>
            )}
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

          {/* Error message - only show balance errors, hide fee details */}
          {feeWarning && chainId === 97741 && feeWarning.includes("Insufficient balance") && (
            <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm">{feeWarning}</p>
            </div>
          )}

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
            disabled={
              loading || 
              !recipient || 
              !amount || 
              !password || 
              !selectedToken ||
              (chainId === 97741 && !feeCalculated) // Disable if fee not calculated for PEPU chain
            }
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading 
              ? "Sending..." 
              : chainId === 97741 && !feeCalculated
              ? "Preparing..."
              : `Send ${selectedToken?.symbol || ""}`
            }
          </button>
        </div>
      </div>

      <BottomNav active="send" />
    </div>
  )
}
