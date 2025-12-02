"use client"

import { Code, Book, Globe, Wallet } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Unchained Integration Guide</h1>
              <p className="text-xs text-gray-400">Use wagmi + viem + WalletConnect like a normal EVM dApp</p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
          >
            Back to Wallet
          </a>
        </header>

        {/* Overview */}
        <section className="glass-card p-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
            <Book className="w-3 h-3" />
            Unchained SDK · wagmi · viem · WalletConnect
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Use the <span className="font-semibold text-green-400">Unchained SDK</span> to easily integrate Unchained Wallet, MetaMask, and Coinbase Wallet into your dApp. 
            The SDK automatically detects Unchained Wallet and provides a simple API built on top of{" "}
            <span className="font-semibold">wagmi</span>, <span className="font-semibold">viem</span>, and{" "}
            <span className="font-semibold">WalletConnect</span>. Choose between a ready-made UI component or build your own with the provided hooks.
          </p>
        </section>

        {/* Installation */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            Installation
          </h2>
          <p className="text-xs text-gray-300">
            Install the required packages:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>pnpm add wagmi viem @tanstack/react-query wagmi/connectors</code>
          </pre>
          <p className="text-xs text-gray-300">
            Or use the Unchained SDK (includes everything):
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>pnpm add unchainedwallet</code>
          </pre>
        </section>

        {/* Quick Start with SDK */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            Quick Start · Unchained SDK
          </h2>
          <p className="text-xs text-gray-300">
            Option 1: Simple Connect Button (No UI - Auto-connects to Unchained)
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { createUnchainedConfig, WalletSelector } from "unchainedwallet"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { mainnet, polygon } from "wagmi/chains"

// Create config with RPCs for WalletConnect chains
const wagmiConfig = createUnchainedConfig({
  projectId: "your-walletconnect-project-id",
  chains: [mainnet, polygon],
  walletConnectRPCs: [
    { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
    { chainId: 137, rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  ],
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* Simple button - auto-connects to Unchained if available */}
        <WalletSelector showUI={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}`}</code>
          </pre>
          <p className="text-xs text-gray-300 mt-4">
            Option 2: With Wallet Selection UI (Shows all available wallets)
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`// Same config as above, but with UI enabled
<WalletSelector 
  showUI={true} // Default - shows wallet selection
  walletConnectRPCs={[
    { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
    { chainId: 137, rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  ]}
/>`}</code>
          </pre>
        </section>

        {/* Using Transactions */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            Using Transactions (Normal wagmi/viem)
          </h2>
          <p className="text-xs text-gray-300">
            Once connected, use standard wagmi hooks for transactions:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { useSendTransaction, useBalance } from "wagmi"
import { parseEther } from "viem"

function SendTransaction() {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const { sendTransaction, isPending } = useSendTransaction()

  const handleSend = async () => {
    await sendTransaction({
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      value: parseEther("0.1"),
    })
  }

  return (
    <div>
      <p>Balance: {balance?.formatted} ETH</p>
      <button onClick={handleSend} disabled={isPending}>
        {isPending ? "Sending..." : "Send 0.1 ETH"}
      </button>
    </div>
  )
}`}</code>
          </pre>
        </section>

        {/* Custom Hook */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            Custom Hook (No UI)
          </h2>
          <p className="text-xs text-gray-300">
            Use the <code>useConnectWallet</code> hook for custom implementations:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { useConnectWallet } from "unchainedwallet"

function ConnectButton() {
  const { connect, disconnect, isConnected, address, isUnchained } = useConnectWallet()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <button onClick={connect}>
      {isUnchained ? "Connect Unchained" : "Connect Wallet"}
    </button>
  )
}`}</code>
          </pre>
        </section>

        {/* Detection & Features */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Detection & Features
          </h2>
          <p className="text-gray-300">
            The SDK automatically detects wallets via <code>window.ethereum</code> flags:
          </p>
          <ul className="text-gray-400 space-y-1 ml-4 list-disc">
            <li><code>window.ethereum.isUnchained === true</code> → Unchained Wallet (prioritized)</li>
            <li><code>window.ethereum.isMetaMask === true</code> → MetaMask</li>
            <li><code>window.ethereum.isCoinbaseWallet === true</code> → Coinbase Wallet</li>
          </ul>
          <p className="text-gray-300 mt-3">
            <span className="font-semibold">Important:</span> When using WalletConnect, you must provide RPC URLs for each chain you want to support. 
            Pick your chains and provide their RPC URLs in the <code>walletConnectRPCs</code> array.
          </p>
        </section>

        {/* WalletConnect RPCs */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            WalletConnect RPC Configuration
          </h2>
          <p className="text-gray-300">
            RPC URLs are <span className="font-semibold text-yellow-400">required</span> for WalletConnect chains. 
            Specify which chains you want to support and provide their RPC URLs:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`walletConnectRPCs={[
  { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  { chainId: 137, rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  { chainId: 42161, rpcUrl: "https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  // Add more chains as needed
]}`}</code>
          </pre>
        </section>
      </div>
    </div>
  )
}


