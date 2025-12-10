# UNCHAINEDWEBAPP

Unchained Web Wallet - A non-custodial, multi-chain cryptocurrency wallet built with Next.js, React, and TypeScript.

## Features

### Wallet Management
- Create new wallets with 12-word mnemonics
- Import wallets via seed phrase or private key
- Non-custodial: All keys encrypted with AES-256
- Password-protected access (4-digit PIN)
- Auto-lock after 30 seconds of inactivity

### Multi-Chain Support
- **Ethereum Mainnet** (Chain ID: 1)
- **Pepe Unchained V2** (Chain ID: 97741)

### Core Features
- **Send**: Transfer native tokens or ERC-20 tokens
- **Receive**: Display wallet address with QR code
- **Unchained Swap**: Full Uniswap V3 integration on PEPU chain
- **Unchained Bridge**: SuperBridge L2→L1 bridging
- **Unchained Browser**: Built-in browser for dApp access
- **Portfolio**: Real-time balance tracking with CoinGecko and GeckoTerminal integration

### Security
- Client-side encryption using CryptoJS
- Private keys never transmitted
- No backend required
- localStorage for persistent wallet data

## Getting Started

### Installation

```bash
npm install
```

### Configuration

All configuration values are hardcoded in `lib/config.ts`:
- Bridge contract addresses
- Fee wallet addresses
- Token addresses
- Chain configurations

No environment variables are required.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## License

MIT
