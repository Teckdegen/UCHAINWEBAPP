"use client"

import { Code, Book, Globe, Wallet, CheckCircle, AlertCircle, Zap, Settings } from "lucide-react"

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
            Install the Unchained SDK:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>npm install unchainedwallet</code>
          </pre>
          <p className="text-xs text-gray-400 mt-2">
            The SDK includes wagmi, viem, and WalletConnect connectors. No additional packages needed!
          </p>
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

        {/* Vanilla JavaScript */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4 text-green-500" />
            Vanilla JavaScript (No React)
          </h2>
          <p className="text-xs text-gray-300">
            Use the SDK without React for vanilla JavaScript or other frameworks:
          </p>
          <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
            <code>{`import { createWalletManager } from "unchainedwallet"

const walletManager = createWalletManager({
  projectId: "your-walletconnect-project-id",
  chains: [mainnet, polygon],
  walletConnectRPCs: [
    { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  ],
})

// Connect
const address = await walletManager.connect()

// Get account
const account = walletManager.getAccount()

// Send transaction
const txHash = await walletManager.sendTransaction(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "0x16345785D8A0000", // 0.1 ETH in hex
)

// Listen to events
walletManager.on("connect", (data) => {
  console.log("Connected:", data.account)
})

walletManager.on("disconnect", () => {
  console.log("Disconnected")
})`}</code>
          </pre>
        </section>

        {/* API Reference */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Book className="w-4 h-4 text-green-500" />
            API Reference
          </h2>
          
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">createUnchainedConfig(options?)</h3>
              <p className="text-gray-300 mb-2">Creates a wagmi config optimized for Unchained Wallet detection.</p>
              <div className="bg-black/50 rounded p-3 space-y-1">
                <p className="text-gray-400"><span className="text-green-400">projectId</span>: string (optional) - WalletConnect Project ID</p>
                <p className="text-gray-400"><span className="text-green-400">chains</span>: Chain[] (optional) - Array of chains to support (default: [mainnet])</p>
                <p className="text-gray-400"><span className="text-green-400">rpcUrls</span>: Record&lt;number, string&gt; (optional) - Custom RPC URLs for chains</p>
                <p className="text-gray-400"><span className="text-green-400">walletConnectRPCs</span>: WalletConnectRPC[] (optional) - Custom RPC configs for WalletConnect</p>
                <p className="text-gray-400"><span className="text-green-400">enableMetaMask</span>: boolean (optional, default: true) - Enable MetaMask connector</p>
                <p className="text-gray-400"><span className="text-green-400">enableCoinbase</span>: boolean (optional, default: true) - Enable Coinbase Wallet connector</p>
                <p className="text-gray-400"><span className="text-green-400">enableWalletConnect</span>: boolean (optional, default: true if projectId provided) - Enable WalletConnect</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-green-400 mb-2">WalletSelector Component</h3>
              <p className="text-gray-300 mb-2">React component for wallet selection UI or simple connect button.</p>
              <div className="bg-black/50 rounded p-3 space-y-1">
                <p className="text-gray-400"><span className="text-green-400">showUI</span>: boolean (optional, default: true) - Show wallet selection UI</p>
                <p className="text-gray-400"><span className="text-green-400">onlyUnchained</span>: boolean (optional) - Show only Unchained Wallet</p>
                <p className="text-gray-400"><span className="text-green-400">disableMetaMask</span>: boolean (optional) - Disable MetaMask option</p>
                <p className="text-gray-400"><span className="text-green-400">disableCoinbase</span>: boolean (optional) - Disable Coinbase Wallet option</p>
                <p className="text-gray-400"><span className="text-green-400">disableWalletConnect</span>: boolean (optional) - Disable WalletConnect option</p>
                <p className="text-gray-400"><span className="text-green-400">walletConnectRPCs</span>: WalletConnectRPC[] (optional) - Custom RPCs for WalletConnect</p>
                <p className="text-gray-400"><span className="text-green-400">onConnect</span>: (address: string, walletType: string) =&gt; void (optional) - Callback on connect</p>
                <p className="text-gray-400"><span className="text-green-400">onDisconnect</span>: () =&gt; void (optional) - Callback on disconnect</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-green-400 mb-2">useConnectWallet()</h3>
              <p className="text-gray-300 mb-2">React hook for direct wallet connection without UI.</p>
              <div className="bg-black/50 rounded p-3 space-y-1">
                <p className="text-gray-400">Returns: <span className="text-green-400">{`{ connect, disconnect, isConnected, address, isConnecting, error, detectedWallet, isUnchained }`}</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-green-400 mb-2">Utility Functions</h3>
              <div className="bg-black/50 rounded p-3 space-y-1">
                <p className="text-gray-400"><span className="text-green-400">isUnchainedInstalled()</span>: boolean - Check if Unchained Wallet is installed</p>
                <p className="text-gray-400"><span className="text-green-400">isMetaMaskInstalled()</span>: boolean - Check if MetaMask is installed</p>
                <p className="text-gray-400"><span className="text-green-400">isCoinbaseWalletInstalled()</span>: boolean - Check if Coinbase Wallet is installed</p>
                <p className="text-gray-400"><span className="text-green-400">getDetectedWallet()</span>: object - Get detected wallet information</p>
                <p className="text-gray-400"><span className="text-green-400">connectWallet()</span>: Promise&lt;string&gt; - Connect to wallet directly</p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Best Practices
          </h2>
          <ul className="text-gray-300 space-y-2 ml-4 list-disc">
            <li>
              <span className="font-semibold">Always provide RPC URLs for WalletConnect:</span> WalletConnect requires RPC URLs for each chain. 
              Use services like Alchemy, Infura, or QuickNode to get reliable RPC endpoints.
            </li>
            <li>
              <span className="font-semibold">Handle connection errors gracefully:</span> Users may reject connection requests or have no wallet installed.
            </li>
            <li>
              <span className="font-semibold">Use the simple button for better UX:</span> Set <code>showUI={false}</code> for a cleaner, 
              one-click connection experience that auto-connects to Unchained if available.
            </li>
            <li>
              <span className="font-semibold">Test with multiple wallets:</span> Ensure your dApp works with Unchained, MetaMask, and Coinbase Wallet.
            </li>
            <li>
              <span className="font-semibold">Use standard wagmi hooks:</span> Once connected, use <code>useSendTransaction</code>, 
              <code>useBalance</code>, and other wagmi hooks for a consistent experience.
            </li>
          </ul>
        </section>

        {/* Common Issues */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Troubleshooting
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-yellow-400 mb-1">WalletConnect not working</p>
              <p className="text-gray-300">
                Make sure you've provided RPC URLs in <code>walletConnectRPCs</code> for all chains you want to support. 
                WalletConnect requires RPC URLs to function properly.
              </p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Unchained Wallet not detected</p>
              <p className="text-gray-300">
                Ensure <code>window.ethereum.isUnchained === true</code>. The SDK automatically prioritizes Unchained when this flag is present.
              </p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Transaction fails</p>
              <p className="text-gray-300">
                Use standard wagmi hooks like <code>useSendTransaction</code> after connecting. The SDK handles connection, 
                but transactions use normal wagmi/viem patterns.
              </p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">TypeScript errors</p>
              <p className="text-gray-300">
                Make sure you have <code>wagmi</code>, <code>viem</code>, and <code>@wagmi/connectors</code> installed as peer dependencies.
              </p>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-500" />
            Complete Examples
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Example 1: Full dApp with Send Transaction</h3>
              <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
                <code>{`import { createUnchainedConfig, WalletSelector } from "unchainedwallet"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAccount, useSendTransaction, useBalance } from "wagmi"
import { parseEther } from "viem"
import { mainnet } from "wagmi/chains"

const config = createUnchainedConfig({
  projectId: "your-project-id",
  chains: [mainnet],
  walletConnectRPCs: [
    { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  ],
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletSelector showUI={false} />
        <SendTransaction />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function SendTransaction() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { sendTransaction, isPending } = useSendTransaction()

  if (!isConnected) return null

  return (
    <div>
      <p>Balance: {balance?.formatted} ETH</p>
      <button 
        onClick={() => sendTransaction({
          to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          value: parseEther("0.1"),
        })}
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Send 0.1 ETH"}
      </button>
    </div>
  )
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Example 2: Custom UI with Hook</h3>
              <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
                <code>{`import { useConnectWallet } from "unchainedwallet"
import { useAccount, useBalance } from "wagmi"

function CustomWalletButton() {
  const { connect, disconnect, isConnected, address, isUnchained } = useConnectWallet()
  const { data: balance } = useBalance({ address })

  if (isConnected) {
    return (
      <div className="wallet-info">
        <p>Connected to {isUnchained ? "Unchained" : "Wallet"}</p>
        <p>Address: {address}</p>
        <p>Balance: {balance?.formatted} {balance?.symbol}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <button onClick={connect} className="connect-btn">
      {isUnchained ? "Connect Unchained Wallet" : "Connect Wallet"}
    </button>
  )
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Example 3: ERC20 Token Transfer</h3>
              <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
                <code>{`import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const USDC_ABI = [{
  name: "transfer",
  type: "function",
  stateMutability: "nonpayable",
  inputs: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" }
  ],
  outputs: [{ name: "", type: "bool" }]
}]

function SendUSDC() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const sendUSDC = () => {
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        parseUnits("100", 6) // 100 USDC (6 decimals)
      ]
    })
  }

  return (
    <div>
      <button onClick={sendUSDC} disabled={isPending || isConfirming}>
        {isPending ? "Confirming..." : isConfirming ? "Sending..." : "Send 100 USDC"}
      </button>
      {isSuccess && <p>Transaction successful!</p>}
    </div>
  )
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Example 4: Multi-Chain Support</h3>
              <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
                <code>{`import { createUnchainedConfig, WalletSelector } from "unchainedwallet"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { mainnet, polygon, arbitrum, optimism } from "wagmi/chains"
import { useAccount, useSwitchChain } from "wagmi"

const config = createUnchainedConfig({
  projectId: "your-project-id",
  chains: [mainnet, polygon, arbitrum, optimism],
  walletConnectRPCs: [
    { chainId: 1, rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
    { chainId: 137, rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY" },
    { chainId: 42161, rpcUrl: "https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY" },
    { chainId: 10, rpcUrl: "https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY" },
  ],
})

function ChainSwitcher() {
  const { chain } = useAccount()
  const { chains, switchChain } = useSwitchChain()

  return (
    <select 
      value={chain?.id} 
      onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
    >
      {chains.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Example 5: Only Unchained Wallet</h3>
              <pre className="text-[11px] bg-black/70 rounded p-3 border border-white/10 overflow-x-auto">
                <code>{`import { WalletSelector } from "unchainedwallet"

// Only show Unchained Wallet option
<WalletSelector 
  onlyUnchained={true}
  showUI={false} // Simple button
/>

// Or disable other wallets
<WalletSelector 
  disableMetaMask={true}
  disableCoinbase={true}
  disableWalletConnect={true}
/>`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Resources
          </h2>
          <ul className="text-gray-300 space-y-1">
            <li>
              <a href="https://wagmi.sh" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                wagmi Documentation
              </a> - Complete wagmi API reference
            </li>
            <li>
              <a href="https://viem.sh" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                viem Documentation
              </a> - Ethereum TypeScript interface
            </li>
            <li>
              <a href="https://docs.walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                WalletConnect Docs
              </a> - WalletConnect integration guide
            </li>
            <li>
              <a href="https://www.npmjs.com/package/unchainedwallet" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                NPM Package
              </a> - View on npmjs.com
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}


