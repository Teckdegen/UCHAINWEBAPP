"use client"

import { Code, Book, Wallet } from "lucide-react"
import { RainbowKitDemo } from "@/components/RainbowKitDemo"

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

        {/* Wallet Connect Features */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            Wallet Connect Features
          </h2>
          <p className="text-xs text-gray-300 mb-4">
            Unchained Wallet supports all standard WalletConnect features, similar to MetaMask:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-400">Connection Features</h3>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>Session Proposals (dApp connection requests)</li>
                <li>Session Management (approve/reject connections)</li>
                <li>Multi-chain support (Ethereum Mainnet)</li>
                <li>Account switching</li>
                <li>Chain switching</li>
                <li>Session persistence</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-400">Transaction & Signing</h3>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>eth_sendTransaction</li>
                <li>eth_signTransaction</li>
                <li>eth_sign (legacy message signing)</li>
                <li>personal_sign (EIP-191)</li>
                <li>eth_signTypedData (EIP-712)</li>
                <li>eth_signTypedData_v4</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-400">Event Handling</h3>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>chainChanged events</li>
                <li>accountsChanged events</li>
                <li>Session disconnect events</li>
                <li>Session update events</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-400">Advanced Features</h3>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>WalletConnect URI pairing</li>
                <li>Deep linking support</li>
                <li>Session restoration</li>
                <li>Request approval/rejection</li>
                <li>Multi-session support</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-300">
              ✅ <strong>Full Compatibility:</strong> Unchained Wallet supports all standard WalletConnect methods that MetaMask supports, 
              making it a drop-in replacement for dApp integrations.
            </p>
          </div>
        </section>

        {/* RainbowKit Example (Injected Unchained Wallet) */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-500" />
            RainbowKit · Use Unchained Extension
          </h2>
          <p className="text-xs text-gray-300">
            If you are already using <code>@rainbow-me/rainbowkit</code>, you can configure it to show the Unchained Wallet extension. 
            The extension exposes a standard injected <code>window.ethereum</code> with <code>isUnchained: true</code>.
          </p>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
            <p className="text-xs text-yellow-300">
              💡 <strong>Note:</strong> Make sure users have the Unchained Wallet browser extension installed. 
              RainbowKit will automatically detect it as an injected wallet.
            </p>
          </div>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Your own RPC URL for mainnet (required)
const RPC_URL = 'https://your-ethereum-rpc.example.com';

// 2. Configure RainbowKit to use only the injected (Unchained) wallet
const connectors = connectorsForWallets([
  {
    groupName: 'Unchained',
    wallets: [
      injectedWallet({
        chains: [mainnet],
        shimDisconnect: true,
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

const queryClient = new QueryClient();

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={[mainnet]}>
          {/* RainbowKit will detect the Unchained extension as "Unchained Wallet" */}
          <ConnectButton />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}`}</code>
          </pre>
          <p className="text-xs text-gray-300">
            With this setup, the RainbowKit <code>ConnectButton</code> will show "Unchained Wallet" in the wallet selection modal 
            when the extension is installed. Users can connect and use all standard WalletConnect features.
          </p>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              🔍 <strong>How it works:</strong> RainbowKit scans for injected wallets via <code>window.ethereum</code>. 
              When the Unchained extension is installed, it injects <code>window.ethereum</code> with <code>isUnchained: true</code>, 
              which RainbowKit will detect and display in the connect modal.
            </p>
          </div>
          
          {/* Live Demo */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-green-400 mb-3">🎯 Live Demo</h3>
            <p className="text-xs text-gray-300 mb-4">
              Try connecting with RainbowKit below. The Unchained Wallet extension will appear as "Unchained Wallet" 
              with the custom logo when installed.
            </p>
            <RainbowKitDemo />
          </div>
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


