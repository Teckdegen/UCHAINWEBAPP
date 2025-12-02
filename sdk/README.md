# Unchained Wallet SDK

A simple SDK for dApps to connect to Unchained Wallet using wagmi and viem.

## Installation

```bash
npm install wagmi viem @tanstack/react-query @wagmi/connectors
# or
pnpm add wagmi viem @tanstack/react-query @wagmi/connectors
```

## Quick Start

### 1. Setup wagmi config

```typescript
import { createUnchainedConfig } from '@unchained/sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

// Create wagmi config
const wagmiConfig = createUnchainedConfig({
  projectId: 'your-walletconnect-project-id', // Optional, for WalletConnect support
  chains: [mainnet], // Add your chains
})

// Setup React Query
const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 2. Use in your components

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from '@wagmi/connectors/injected'

function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
    >
      Connect Unchained Wallet
    </button>
  )
}
```

## Features

- ✅ **Auto-detection**: Automatically detects Unchained wallet via `window.ethereum.isUnchained`
- ✅ **wagmi integration**: Full wagmi support with hooks
- ✅ **viem integration**: Uses viem for all RPC calls
- ✅ **WalletConnect support**: Optional WalletConnect connector
- ✅ **TypeScript**: Full TypeScript support

## API Reference

### `isUnchainedInstalled()`

Check if Unchained wallet is installed.

```typescript
import { isUnchainedInstalled } from '@unchained/sdk'

if (isUnchainedInstalled()) {
  console.log('Unchained wallet is available!')
}
```

### `getUnchainedProvider()`

Get the Unchained provider instance.

```typescript
import { getUnchainedProvider } from '@unchained/sdk'

const provider = getUnchainedProvider()
if (provider) {
  const accounts = await provider.request({ method: 'eth_requestAccounts' })
}
```

### `createUnchainedConfig(options)`

Create a wagmi config optimized for Unchained.

**Options:**
- `projectId` (string, optional): WalletConnect Project ID
- `chains` (Chain[], optional): Array of chains (defaults to mainnet)
- `rpcUrls` (Record<number, string>, optional): Custom RPC URLs

## Example: Full dApp Integration

```typescript
import { createUnchainedConfig } from '@unchained/sdk'
import { mainnet, sepolia } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, useConnect, useDisconnect, useSendTransaction } from 'wagmi'
import { injected } from '@wagmi/connectors/injected'

// 1. Create config
const wagmiConfig = createUnchainedConfig({
  projectId: 'your-project-id',
  chains: [mainnet, sepolia],
})

const queryClient = new QueryClient()

// 2. Setup providers
function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// 3. Use in components
function DApp() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { sendTransaction } = useSendTransaction()

  const handleSend = async () => {
    await sendTransaction({
      to: '0x...',
      value: parseEther('0.1'),
    })
  }

  if (!isConnected) {
    return (
      <button onClick={() => connect({ connector: injected() })}>
        Connect Wallet
      </button>
    )
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={handleSend}>Send Transaction</button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
```

## Detection

The SDK automatically detects Unchained wallet by checking for `window.ethereum.isUnchained === true`.

If Unchained is installed, it will be prioritized in the connector list.

## WalletConnect Support

To enable WalletConnect support (for mobile dApps), provide a Project ID:

```typescript
const config = createUnchainedConfig({
  projectId: 'your-walletconnect-project-id',
})
```

Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com).

## License

MIT

