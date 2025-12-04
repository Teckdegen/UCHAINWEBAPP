"use client"

import { Code, Book, Wallet } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Code className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Unchained dApp Integration</h1>
            <p className="text-xs text-gray-400">Single, simple way to connect only to Unchained Wallet</p>
          </div>
        </header>

        {/* Overview */}
        <section className="glass-card p-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
            <Book className="w-3 h-3" />
            Unchained SDK · wagmi · viem
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            This page shows a **single, recommended way** to connect a dApp **only to Unchained Wallet** using the{" "}
            <span className="font-semibold text-green-400">Unchained SDK</span>. There are no MetaMask or Coinbase
            examples here – your connect button will always route to Unchained.
          </p>
        </section>

        {/* Installation */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            Installation
          </h2>
          <p className="text-xs text-gray-300">
            Install the Unchained SDK:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>npm install unchainedwallet</code>
          </pre>
          <p className="text-xs text-gray-400 mt-2">The SDK wraps wagmi + viem and is focused on Unchained only.</p>
        </section>

        {/* Single Connection Example (Only Unchained) */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            Quick Start · Connect Only to Unchained
          </h2>
          <p className="text-xs text-gray-300">
            Drop this into your React app to get a **single “Connect Unchained” button**. It uses wagmi under the hood
            and never shows other wallets.
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { createUnchainedConfig, WalletSelector } from "unchainedwallet"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { mainnet } from "wagmi/chains"

// 1. Create a wagmi config that prefers ONLY Unchained Wallet
const config = createUnchainedConfig({
  chains: [mainnet],
  // Optional: mark that you only want Unchained as the wallet
  onlyUnchained: true,
})

const queryClient = new QueryClient()

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* 2. Simple button – always connects to Unchained Wallet */}
        <WalletSelector onlyUnchained showUI={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}`}</code>
          </pre>
          <p className="text-xs text-gray-300">
            After this, you can use normal wagmi + viem hooks (`useAccount`, `useSendTransaction`, etc.) the same way
            you would with any EVM wallet – but all connections go through Unchained.
          </p>
        </section>
      </div>
    </div>
  )
}


