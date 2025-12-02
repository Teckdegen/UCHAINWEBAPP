/**
 * Example usage of Unchained SDK
 * 
 * This is a complete example showing how to integrate Unchained Wallet
 * into a Next.js/React dApp using wagmi and viem.
 */

'use client'

import { createUnchainedConfig, WalletSelector } from './index'
import { mainnet } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, useSendTransaction, useBalance } from 'wagmi'
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
  const { data: balance } = useBalance({ address })
  const { sendTransaction, isPending: isSending } = useSendTransaction()

  const handleSend = async () => {
    if (!address) return
    
    await sendTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Example address
      value: parseEther('0.001'),
    })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>My dApp</h1>
      
      {/* Wallet Selector UI - Shows available wallets */}
      <div style={{ marginBottom: '2rem' }}>
        <WalletSelector 
          // onlyUnchained={true} // Uncomment to only show Unchained
          // disableMetaMask={true} // Uncomment to hide MetaMask
          // disableCoinbase={true} // Uncomment to hide Coinbase
          walletConnectProjectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
          onConnect={(address, walletType) => {
            console.log(`Connected to ${walletType}: ${address}`)
          }}
          onDisconnect={() => {
            console.log('Disconnected')
          }}
        />
      </div>

      {/* Transaction UI (only shown when connected) */}
      {isConnected && address && (
        <div style={{ 
          padding: '1.5rem', 
          background: '#1a1a1a', 
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h2 style={{ marginTop: 0 }}>Wallet Info</h2>
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Balance:</strong> {balance ? formatEther(balance.value) : '0'} ETH</p>
          </div>

          <button 
            onClick={handleSend}
            disabled={isSending}
            style={{
              padding: '0.75rem 1.5rem',
              background: isSending ? '#333' : '#4a9eff',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: isSending ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {isSending ? 'Sending...' : 'Send 0.001 ETH'}
          </button>
        </div>
      )}
    </div>
  )
}

