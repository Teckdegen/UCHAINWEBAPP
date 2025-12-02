/**
 * Unchained Wallet SDK
 * 
 * A simple SDK for dApps to connect to Unchained Wallet using wagmi and viem.
 * Automatically detects Unchained wallet via window.ethereum.isUnchained
 */

import { injected } from '@wagmi/connectors/injected'
import { walletConnect } from '@wagmi/connectors/walletConnect'
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

/**
 * Check if Unchained wallet is installed
 */
export function isUnchainedInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.ethereum as any)?.isUnchained
}

/**
 * Get the Unchained provider
 */
export function getUnchainedProvider() {
  if (typeof window === 'undefined') return null
  const ethereum = window.ethereum as any
  if (ethereum?.isUnchained) {
    return ethereum
  }
  return null
}

/**
 * Create a wagmi config optimized for Unchained Wallet
 * 
 * @param projectId - WalletConnect Project ID (optional, for WalletConnect support)
 * @param chains - Array of chains to support (defaults to mainnet)
 * @param rpcUrls - Custom RPC URLs for chains (optional)
 */
export function createUnchainedConfig(options?: {
  projectId?: string
  chains?: any[]
  rpcUrls?: Record<number, string>
}) {
  const chains = options?.chains || [mainnet]
  const projectId = options?.projectId
  const rpcUrls = options?.rpcUrls || {}

  const connectors: any[] = []

  // Injected connector (detects Unchained automatically via window.ethereum.isUnchained)
  connectors.push(
    injected({
      shimDisconnect: true,
    })
  )

  // WalletConnect connector (optional, if projectId provided)
  if (projectId) {
    connectors.push(
      walletConnect({
        projectId,
        metadata: {
          name: 'Unchained Wallet',
          description: 'Connect with Unchained Wallet',
          url: typeof window !== 'undefined' ? window.location.origin : '',
          icons: [],
        },
        showQrModal: true,
      })
    )
  }

  return createConfig({
    chains,
    connectors,
    transports: Object.fromEntries(
      chains.map((chain) => [
        chain.id,
        http(rpcUrls[chain.id] || undefined),
      ])
    ),
  })
}

/**
 * Simple hook wrapper for common wagmi operations
 * Use this if you want a simpler API than raw wagmi hooks
 */
export function useUnchainedWallet() {
  if (typeof window === 'undefined') {
    return {
      isInstalled: false,
      isConnected: false,
      address: null,
      chainId: null,
      connect: async () => {},
      disconnect: async () => {},
    }
  }

  // This would be used in a React component with wagmi hooks
  // For now, return a simple interface
  const provider = getUnchainedProvider()
  const isInstalled = !!provider

  return {
    isInstalled,
    isConnected: false, // Would use useAccount from wagmi
    address: null, // Would use useAccount from wagmi
    chainId: null, // Would use useChainId from wagmi
    connect: async () => {
      if (provider) {
        return await provider.request({ method: 'eth_requestAccounts' })
      }
      throw new Error('Unchained wallet not installed')
    },
    disconnect: async () => {
      // Disconnect logic
    },
  }
}

// Export types
export type { Config } from 'wagmi'

