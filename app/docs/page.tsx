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
            wagmi · viem · WalletConnect
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            The old REST wallet API (<code className="text-green-400">/api/wallet/*</code>) has been removed. Instead,
            dApps should use the standard EVM stack: <span className="font-semibold">wagmi hooks</span>,{" "}
            <span className="font-semibold">viem clients</span>, and{" "}
            <span className="font-semibold">WalletConnect / injected connectors</span>. This is the same pattern used by
            MetaMask, Coinbase Wallet, and other modern wallets.
          </p>
        </section>

        {/* DApp-side wagmi config */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            DApp Side · wagmi + viem + WalletConnect
          </h2>
          <p className="text-xs text-gray-300">
            In your dApp (Next.js / React), install the usual packages:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>pnpm add wagmi viem @tanstack/react-query @wagmi/connectors @walletconnect/ethereum-provider</code>
          </pre>
          <p className="text-xs text-gray-300">Create a wagmi config like this:</p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`// wagmiConfig.ts (in your DAPP)
import { createConfig, http } from "wagmi"
import { mainnet } from "wagmi/chains"
import { injected } from "@wagmi/connectors/injected"
import { walletConnect } from "@wagmi/connectors/walletConnect"

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
  },
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: "<YOUR_WALLETCONNECT_PROJECT_ID>",
      metadata: {
        name: "Your dApp",
        description: "Your dApp using Unchained / MetaMask / WalletConnect",
        url: "https://your-dapp.com",
        icons: ["https://your-dapp.com/icon.png"],
      },
      showQrModal: true,
    }),
  ],
})`}</code>
          </pre>
        </section>

        {/* Connect button example */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            Connect Button (wagmi hooks)
          </h2>
          <p className="text-xs text-gray-300">
            Use <code>useConnect</code>, <code>useAccount</code>, and <code>useDisconnect</code> for a standard connect
            button:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { useConnect, useAccount, useDisconnect } from "wagmi"

export function ConnectButton() {
  const { connectors, connect, isPending } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <button onClick={() => disconnect()}>
        Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={!connector.ready || isPending}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}`}</code>
          </pre>
        </section>

        {/* Wallet-side notes */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Wallet Side · EIP‑1193 Provider
          </h2>
          <p className="text-gray-300">
            Inside the Unchained web wallet, we expose an EIP‑1193 compatible provider on{" "}
            <code>window.ethereum</code> for pages that run on the same origin as the wallet. This lets embedded
            experiences talk to the wallet using the same JSON‑RPC methods that MetaMask and other injected wallets
            support.
          </p>
          <p className="text-gray-400">
            For external dApps on other domains, connect to Unchained via{" "}
            <span className="font-semibold">WalletConnect</span> using wagmi&apos;s{" "}
            <code>walletConnect()</code> connector. The legacy <code>/api/wallet/*</code> REST endpoints and
            cookie-based flow have been removed.
          </p>
        </section>
      </div>
    </div>
  )
}


