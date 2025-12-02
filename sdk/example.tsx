/**
 * Example usage of Unchained SDK
 * 
 * This is a complete example showing how to integrate Unchained Wallet
 * into a Next.js/React dApp using wagmi and viem.
 */

'use client'

import { createUnchainedConfig, isUnchainedInstalled } from './index'
import { mainnet } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, useConnect, useDisconnect, useSendTransaction, useBalance } from 'wagmi'
import { injected } from '@wagmi/connectors/injected'
import { parseEther, formatEther } from 'viem'

// 1. Create wagmi config
const wagmiConfig = createUnchainedConfig({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, // Optional
  chains: [mainnet],
})

// 2. Setup React Query
const queryClient = new QueryClient()

// 3. Main App Component
export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DAppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// 4. Your dApp Component
function DAppContent() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { sendTransaction, isPending: isSending } = useSendTransaction()

  // Check if Unchained is installed
  const hasUnchained = isUnchainedInstalled()

  const handleConnect = () => {
    // Find Unchained connector (injected connector will auto-detect)
    const unchainedConnector = connectors.find(
      (c) => c.id === 'injected' || (window.ethereum as any)?.isUnchained
    )
    
    if (unchainedConnector) {
      connect({ connector: unchainedConnector })
    } else {
      // Fallback to first available connector
      connect({ connector: injected() })
    }
  }

  const handleSend = async () => {
    if (!address) return
    
    await sendTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Example address
      value: parseEther('0.001'),
    })
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Connect to Unchained Wallet</h1>
        {hasUnchained ? (
          <p>✅ Unchained Wallet detected!</p>
        ) : (
          <p>⚠️ Unchained Wallet not detected. Install it to continue.</p>
        )}
        <button 
          onClick={handleConnect}
          disabled={isPending}
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Unchained Wallet Connected</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Balance:</strong> {balance ? formatEther(balance.value) : '0'} ETH</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={handleSend}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send 0.001 ETH'}
        </button>
        
        <button onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    </div>
  )
}

