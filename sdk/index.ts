/**
 * Unchained Wallet SDK
 * 
 * A simple SDK for dApps to connect to Unchained Wallet, MetaMask, and Coinbase Wallet
 * using wagmi and viem. Automatically detects and prioritizes Unchained wallet.
 */

import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { createConfig, http } from 'wagmi'
import { mainnet, type Chain } from 'wagmi/chains'

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isUnchained?: boolean
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      request?: (args: { method: string; params?: any[] }) => Promise<any>
      [key: string]: any
    }
  }
}

/**
 * Check if Unchained wallet is installed
 */
export function isUnchainedInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.ethereum as any)?.isUnchained
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const ethereum = window.ethereum as any
  return !!(ethereum?.isMetaMask && !ethereum?.isUnchained) // Exclude Unchained
}

/**
 * Check if Coinbase Wallet is installed
 */
export function isCoinbaseWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const ethereum = window.ethereum as any
  return !!(ethereum?.isCoinbaseWallet && !ethereum?.isUnchained) // Exclude Unchained
}

/**
 * Get the detected wallet provider
 */
export function getWalletProvider() {
  if (typeof window === 'undefined') return null
  const ethereum = window.ethereum as any
  
  // Prioritize Unchained
  if (ethereum?.isUnchained) {
    return { provider: ethereum, type: 'unchained' as const }
  }
  
  // Fallback to MetaMask
  if (ethereum?.isMetaMask) {
    return { provider: ethereum, type: 'metamask' as const }
  }
  
  // Fallback to Coinbase Wallet
  if (ethereum?.isCoinbaseWallet) {
    return { provider: ethereum, type: 'coinbase' as const }
  }
  
  // Generic injected provider
  if (ethereum) {
    return { provider: ethereum, type: 'injected' as const }
  }
  
  return null
}

/**
 * Get the Unchained provider (legacy function for backwards compatibility)
 */
export function getUnchainedProvider() {
  const wallet = getWalletProvider()
  return wallet?.type === 'unchained' ? wallet.provider : null
}

/**
 * WalletConnect RPC configuration (like RainbowKit)
 * Users can specify custom RPC URLs and chain IDs for WalletConnect
 */
export interface WalletConnectRPC {
  chainId: number
  rpcUrl: string
  name?: string
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * Create a wagmi config optimized for Unchained Wallet, MetaMask, and Coinbase Wallet
 * 
 * Automatically detects and prioritizes wallets in this order:
 * 1. Unchained Wallet (if window.ethereum.isUnchained === true)
 * 2. MetaMask (if window.ethereum.isMetaMask === true)
 * 3. Coinbase Wallet (if window.ethereum.isCoinbaseWallet === true)
 * 4. Generic injected provider
 * 5. WalletConnect (if projectId provided)
 * 
 * @param projectId - WalletConnect Project ID (required for WalletConnect support)
 * @param chains - Array of chains to support (defaults to mainnet)
 * @param rpcUrls - Custom RPC URLs for chains (optional, overrides chain RPC)
 * @param walletConnectRPCs - Custom RPC configurations for WalletConnect (like RainbowKit)
 * @param enableMetaMask - Enable MetaMask connector (default: true)
 * @param enableCoinbase - Enable Coinbase Wallet connector (default: true)
 * @param enableWalletConnect - Enable WalletConnect connector (default: true if projectId provided)
 */
export function createUnchainedConfig(options?: {
  projectId?: string
  chains?: Chain[]
  rpcUrls?: Record<number, string>
  walletConnectRPCs?: WalletConnectRPC[]
  enableMetaMask?: boolean
  enableCoinbase?: boolean
  enableWalletConnect?: boolean
}) {
  const chains: [Chain, ...Chain[]] = (options?.chains && options.chains.length > 0 
    ? options.chains 
    : [mainnet]) as [Chain, ...Chain[]]
  const projectId = options?.projectId
  const rpcUrls = options?.rpcUrls || {}
  const walletConnectRPCs = options?.walletConnectRPCs || []
  const enableMetaMask = options?.enableMetaMask !== false
  const enableCoinbase = options?.enableCoinbase !== false
  const enableWalletConnect = options?.enableWalletConnect !== false && !!projectId

  const connectors: any[] = []

  // 1. Injected connector (detects Unchained, MetaMask, Coinbase automatically)
  // This will prioritize Unchained if window.ethereum.isUnchained === true
  connectors.push(
    injected({
      shimDisconnect: true,
    })
  )

  // 2. Coinbase Wallet connector (if enabled and not Unchained)
  if (enableCoinbase && typeof window !== 'undefined') {
    const isUnchained = isUnchainedInstalled()
    if (!isUnchained) {
      connectors.push(
        coinbaseWallet({
          appName: 'Unchained Wallet',
          appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : undefined,
        })
      )
    }
  }

  // 3. WalletConnect connector with custom RPCs (like RainbowKit)
  // RPCs are REQUIRED for WalletConnect - users must provide them
  if (enableWalletConnect && projectId) {
    // Build RPC map from walletConnectRPCs or rpcUrls
    const rpcMap: Record<number, string> = {}
    
    // Add custom WalletConnect RPCs (preferred method)
    walletConnectRPCs.forEach((rpc) => {
      rpcMap[rpc.chainId] = rpc.rpcUrl
    })
    
    // Add RPCs from rpcUrls option (fallback)
    Object.entries(rpcUrls).forEach(([chainId, url]) => {
      const chainIdNum = parseInt(chainId, 10)
      if (!rpcMap[chainIdNum] && url) {
        rpcMap[chainIdNum] = url
      }
    })
    
    // Add chain RPCs as last resort (if not already provided)
    chains.forEach((chain) => {
      if (!rpcMap[chain.id]) {
        const chainRpc = chain.rpcUrls?.default?.http?.[0] || chain.rpcUrls?.public?.http?.[0]
        if (chainRpc) {
          rpcMap[chain.id] = chainRpc
        }
      }
    })

    // Warn if no RPCs provided for WalletConnect chains
    if (Object.keys(rpcMap).length === 0) {
      console.warn(
        '[Unchained SDK] Warning: No RPC URLs provided for WalletConnect. ' +
        'Please provide walletConnectRPCs or rpcUrls in the config.'
      )
    }

    connectors.push(
      walletConnect({
        projectId,
        metadata: {
          name: 'Unchained Wallet',
          description: 'Connect with Unchained Wallet, MetaMask, or Coinbase Wallet',
          url: typeof window !== 'undefined' ? window.location.origin : '',
          icons: [],
        },
        showQrModal: true,
        // Pass RPC map to WalletConnect (required for custom chains)
        rpcMap: Object.keys(rpcMap).length > 0 ? rpcMap : undefined,
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
 * Get detected wallet information
 */
export function getDetectedWallet() {
  if (typeof window === 'undefined') {
    return {
      isInstalled: false,
      type: null,
      name: null,
    }
  }

  const wallet = getWalletProvider()
  
  if (!wallet) {
    return {
      isInstalled: false,
      type: null,
      name: null,
    }
  }

  const names: Record<string, string> = {
    unchained: 'Unchained Wallet',
    metamask: 'MetaMask',
    coinbase: 'Coinbase Wallet',
    injected: 'Injected Wallet',
  }

  return {
    isInstalled: true,
    type: wallet.type,
    name: names[wallet.type] || 'Unknown Wallet',
    provider: wallet.provider,
  }
}

/**
 * Connect to wallet directly without UI
 * Automatically connects to Unchained if available, otherwise falls back to other wallets
 * 
 * @returns Promise<string> - Connected wallet address
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection requires browser environment')
  }

  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install Unchained Wallet, MetaMask, or Coinbase Wallet.')
  }

  if (!window.ethereum.request) {
    throw new Error('Wallet provider does not support request method')
  }

  try {
    // Request connection
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (accounts && accounts[0]) {
      return accounts[0]
    }

    throw new Error('No accounts returned')
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected connection request')
    }
    throw error
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  if (typeof window === 'undefined') return
  
  // Reset connection state
  // Note: Most wallets don't have a disconnect method, so we just clear local state
  if (window.ethereum && (window.ethereum as any).removeAllListeners) {
    (window.ethereum as any).removeAllListeners()
  }
}

/**
 * Simple hook wrapper for common wagmi operations
 * Use this if you want a simpler API than raw wagmi hooks
 */
export function useUnchainedWallet() {
  if (typeof window === 'undefined') {
    return {
      isInstalled: false,
      walletType: null,
      walletName: null,
      isConnected: false,
      address: null,
      chainId: null,
      connect: async () => {},
      disconnect: async () => {},
    }
  }

  // This would be used in a React component with wagmi hooks
  // For now, return a simple interface
  const detected = getDetectedWallet()
  const provider = detected.provider

  return {
    isInstalled: detected.isInstalled,
    walletType: detected.type,
    walletName: detected.name,
    isConnected: false, // Would use useAccount from wagmi
    address: null, // Would use useAccount from wagmi
    chainId: null, // Would use useChainId from wagmi
    connect: async () => {
      if (provider) {
        return await provider.request({ method: 'eth_requestAccounts' })
      }
      throw new Error('No wallet detected')
    },
    disconnect: async () => {
      // Disconnect logic
    },
  }
}

// Export types
export type { Config } from 'wagmi'

// Export components
export { WalletSelector } from './components/WalletSelector'

// Export React hooks
export { useConnectWallet } from './hooks/useConnectWallet'

// Export vanilla JS version
export { UnchainedWalletManager, createWalletManager } from './vanilla'

