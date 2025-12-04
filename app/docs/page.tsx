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

        {/* React Example (Only Unchained) */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            React · Connect Only to Unchained
          </h2>
          <p className="text-xs text-gray-300">
            Drop this into your React app to get a **single “Connect Unchained” button**. The dApp must provide its own
            RPC URL when creating the config.
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { createUnchainedConfig, WalletSelector } from "unchainedwallet"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { mainnet } from "wagmi/chains"

// 1. Your own RPC URL for mainnet (required)
const RPC_URL = "https://your-ethereum-rpc.example.com";

// 2. Create a wagmi config that prefers ONLY Unchained Wallet
const config = createUnchainedConfig({
  chains: [mainnet],
  // DApp must provide its own RPC config
  rpcUrls: {
    1: RPC_URL,
  },
  // Mark that you only want Unchained as the wallet
  onlyUnchained: true,
})

const queryClient = new QueryClient()

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* 3. Simple button – always connects to Unchained Wallet */}
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

        {/* RainbowKit Example (Injected Unchained Wallet) */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            RainbowKit · Use Unchained as the Injected Wallet
          </h2>
          <p className="text-xs text-gray-300">
            If you are already using <code>@rainbow-me/rainbowkit</code>, you can keep your existing setup and let
            RainbowKit detect the Unchained browser extension (it exposes a standard injected{" "}
            <code>window.ethereum</code> with <code>isUnchained: true</code>).
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';

// 1. Your own RPC URL for mainnet (required)
const RPC_URL = 'https://your-ethereum-rpc.example.com';

// 2. Configure RainbowKit to use only the injected (Unchained) wallet
const connectors = connectorsForWallets([
  {
    groupName: 'Unchained',
    wallets: [
      injectedWallet({
        chains: [mainnet],
        // Optional: this will show "Unchained Wallet" instead of "Browser Wallet"
        projectId: 'unchained-wallet',
      }),
    ],
  },
]);

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(RPC_URL),
  },
  connectors,
});

export function App() {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider>
        {/* RainbowKit will detect the Unchained extension as the injected wallet */}
        <ConnectButton />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}`}</code>
          </pre>
          <p className="text-xs text-gray-300">
            With this setup, the RainbowKit <code>ConnectButton</code> will use the Unchained browser extension as its
            injected wallet, so users get the same Unchained connect/sign experience.
          </p>
        </section>

        {/* Plain JavaScript Example */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            Vanilla JS · Connect with window.ethereum
          </h2>
          <p className="text-xs text-gray-300">
            If you are not using React, you can connect directly to Unchained from plain JavaScript. The extension or
            iframe injector exposes <code>window.unchained</code> and <code>window.ethereum</code> as the Unchained
            provider.
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`// Helper to get the Unchained provider (extension or iframe)
function getUnchainedProvider() {
  if (window.unchained) return window.unchained;
  if (window.ethereum && window.ethereum.isUnchained) return window.ethereum;
  return null;
}

async function connectUnchained() {
  const provider = getUnchainedProvider();
  if (!provider || !provider.request) {
    alert("Unchained Wallet not detected. Make sure the Unchained web wallet or extension is open.");
    return;
  }

  try {
    // Request accounts (this will open Unchained's /connect page if needed)
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    console.log("Connected to Unchained:", accounts[0]);
  } catch (err) {
    console.error("Unchained connect failed:", err);
  }
}

// Example: hook this up to a button
document.getElementById("connect-unchained-btn").addEventListener("click", connectUnchained);`}</code>
          </pre>
          <p className="text-xs text-gray-300">
            This is the same flow the Unchained extension and in-app browser use – the dApp just calls{" "}
            <code>request(&#123; method: "eth_requestAccounts" &#125;)</code>, and all approvals happen in the Unchained
            UI.
          </p>
        </section>
      </div>
    </div>
  )
}


