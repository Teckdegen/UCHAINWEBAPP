"use client"

import { useEffect, useState } from "react"
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, WagmiProvider, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a query client
const queryClient = new QueryClient()

// RPC URL for mainnet (using a public RPC)
const RPC_URL = 'https://eth.llamarpc.com'

// Configure RainbowKit to use only the injected (Unchained) wallet
// RainbowKit will automatically detect window.ethereum when isUnchained is true
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
])

// Create wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(RPC_URL),
  },
  connectors,
})

export function RainbowKitDemo() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Ensure window.ethereum has Unchained metadata for RainbowKit
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum
      
      // Add custom metadata that RainbowKit can use to identify Unchained Wallet
      if (ethereum.isUnchained) {
        // Set wallet name property that some connectors check
        if (!ethereum.walletName) {
          Object.defineProperty(ethereum, 'walletName', {
            value: 'Unchained Wallet',
            writable: false,
            configurable: true,
          })
        }
        
        // Set icon URL
        if (!ethereum.iconUrl) {
          Object.defineProperty(ethereum, 'iconUrl', {
            value: 'https://pbs.twimg.com/profile_images/1990713242805506049/IL1CQ-9l_400x400.jpg',
            writable: false,
            configurable: true,
          })
        }
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
        <p className="text-xs text-gray-400">Loading RainbowKit...</p>
      </div>
    )
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={[mainnet]}
          appInfo={{
            appName: 'Unchained Wallet Demo',
            learnMoreUrl: 'https://unchained-wallet.com',
          }}
          modalSize="compact"
        >
          <div className="space-y-4">
            <div className="p-4 bg-black/50 rounded-lg border border-white/10">
              <p className="text-xs text-gray-300 mb-3">
                Click the button below to connect with RainbowKit. If you have the Unchained Wallet extension installed, 
                it will appear as "Unchained Wallet" in the wallet selection modal.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                💡 <strong>Tip:</strong> The Unchained Wallet extension injects <code>window.ethereum</code> with 
                <code>isUnchained: true</code>. RainbowKit will automatically detect and display it as "Unchained Wallet".
              </p>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

