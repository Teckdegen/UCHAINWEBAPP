# Unchained Domains - Domain Name Service (DNS) Contract Documentation

## Overview

Unchained Domains is a decentralized domain name service built on the PEPU Chain (Pepe Unchained V2). It allows users to register human-readable `.pepu` domain names that map to wallet addresses, making it easier to send and receive cryptocurrency without remembering long hexadecimal addresses.

This documentation is designed to help you build a **standalone domain registration website** that interacts with the Unchained Domains smart contract on PEPU Chain.

## Contract Information

- **Contract Address**: `0x59b040636186afC0851e5891A7b94C3Ca7680128`
- **Chain**: PEPU Chain (Chain ID: 97741)
- **Payment Token**: USDC (`0x20fB684Bfc1aBAaD3AceC5712f2Aa30bd494dF74`)
- **USDC Decimals**: 6
- **TLD (Top-Level Domain)**: `.pepu`

## Core Features

### 1. Domain Registration
Register a `.pepu` domain name for your wallet address.

**Key Details:**
- Domain names must be 1-63 characters
- Allowed characters: lowercase letters (a-z), numbers (0-9), and hyphens (-)
- Registration duration: 1-60 years (or 1-21,900 days)
- Payment required in USDC before registration
- Automatic USDC approval handling
- One domain per wallet address

**Registration Process:**
1. Check domain availability
2. Calculate registration fee based on domain name and duration
3. Verify USDC balance
4. Approve USDC spending (if needed)
5. Register domain with specified duration

### 2. Domain Resolution (Forward Lookup)
Resolve a `.pepu` domain name to its associated wallet address.

**Use Cases:**
- Send tokens to a domain name instead of a wallet address
- Verify domain ownership
- Display wallet address from domain name

**Example:**
- Input: `teck.pepu` or `teck`
- Output: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### 3. Reverse Lookup
Get the domain name associated with a wallet address.

**Use Cases:**
- Display domain name for a wallet address
- Verify if a wallet has a registered domain
- Show user-friendly names in wallet lists

**Example:**
- Input: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- Output: `teck.pepu` or `null` if no domain exists

### 4. Domain Availability Check
Check if a domain name is available for registration.

**Returns:**
- `true` if domain is available
- `false` if domain is already registered

### 5. Domain Information Retrieval
Get comprehensive information about a registered domain.

**Returns:**
- `walletAddress`: The wallet address the domain resolves to
- `owner`: The address that owns/registered the domain
- `registrationTimestamp`: Unix timestamp of registration date
- `expiryTimestamp`: Unix timestamp of expiration date
- `tld`: Top-level domain information

### 6. Domain Status Check
Get the current status of a domain name.

**Returns:**
- `exists`: Whether the domain is registered
- `expired`: Whether the domain has expired
- `remainingDays`: Number of days until expiration (0 if expired)
- `fee`: Base registration fee in USDC

### 7. Domain Name Validation
Validate if a domain name meets the contract's requirements.

**Validation Rules:**
- 1-63 characters in length
- Only lowercase letters, numbers, and hyphens
- Cannot start or end with a hyphen
- Must follow DNS naming conventions

### 8. Registration Fee Calculation
Calculate the registration fee for a domain name.

**Fee Structure:**
- Fee is calculated based on domain name length and popularity
- Base fee per year varies by domain
- Supports both years (1-60) and days (1-21,900) calculations
- Fees are denominated in USDC (6 decimals)

## Smart Contract Functions

### Public View Functions

#### `resolveName(string name, string tld) → address`
Resolves a domain name to a wallet address.

**Parameters:**
- `name`: Domain name without TLD (e.g., "teck")
- `tld`: Top-level domain (e.g., ".pepu")

**Returns:**
- Wallet address or zero address if domain doesn't exist/expired

#### `getDomainByWallet(address wallet) → (string name, string tld)`
Gets the domain name for a wallet address (reverse lookup).

**Parameters:**
- `wallet`: Wallet address to lookup

**Returns:**
- Domain name and TLD, or empty strings if not found

#### `isDomainAvailable(string name, string tld) → bool`
Checks if a domain is available for registration.

**Parameters:**
- `name`: Domain name without TLD
- `tld`: Top-level domain

**Returns:**
- `true` if available, `false` if taken

#### `getDomainInfo(string name, string tld) → (address, address, uint256, uint256, string)`
Gets full domain information.

**Returns:**
- `walletAddress`: Resolved wallet address
- `owner`: Domain owner address
- `registrationTimestamp`: Registration timestamp
- `expiryTimestamp`: Expiration timestamp
- `tldInfo`: TLD information

#### `getDomainStatus(string name, string tld) → (bool, bool, uint256, uint256)`
Gets domain status information.

**Returns:**
- `exists`: Whether domain exists
- `expired`: Whether domain is expired
- `remainingDays`: Days until expiration
- `fee`: Base registration fee

#### `getRegistrationFee(string name, uint256 duration) → uint256`
Calculates registration fee for a domain.

**Parameters:**
- `name`: Domain name without TLD
- `duration`: Registration duration in years

**Returns:**
- Fee amount in USDC (6 decimals)

#### `validateDomainName(string name) → bool`
Validates a domain name format.

**Returns:**
- `true` if valid, `false` otherwise

### Public State-Changing Functions

#### `registerDomain(string name, string tld, uint256 duration)`
Registers a new domain or renews an existing one.

**Parameters:**
- `name`: Domain name without TLD
- `tld`: Top-level domain (".pepu")
- `duration`: Registration duration in years (1-60)

**Requirements:**
- Domain must be available (or expired)
- Sufficient USDC balance
- USDC approval for contract spending
- Valid domain name format

**Process:**
1. Validates domain name
2. Checks availability
3. Calculates fee
4. Transfers USDC from user to contract
5. Registers domain for specified duration
6. Maps domain to wallet address

## UI Features to Build

### 1. Domain Search & Registration Page
**Location**: `/domains` (already exists, can be enhanced)

**Features:**
- ✅ Domain search input with real-time validation
- ✅ Availability check with visual indicators
- ✅ Registration form with duration selector (years/days)
- ✅ Fee calculator with live updates
- ✅ USDC balance display
- ✅ Password-protected registration
- ✅ Transaction status and explorer links
- ✅ User's existing domain display

**Enhancements to Consider:**
- Domain suggestions based on wallet address
- Bulk domain search
- Domain renewal interface
- Domain transfer functionality (if supported)
- Domain expiration reminders
- Domain marketplace (if supported)

### 2. Domain Resolution in Send Page
**Location**: `/send`

**Current Implementation:**
- ✅ Accepts `.pepu` domain names as recipient
- ✅ Auto-resolves domain to address
- ✅ Shows resolved address confirmation
- ✅ Error handling for invalid/expired domains

**Enhancements:**
- Domain autocomplete suggestions
- Recent domain history
- Favorite domains list
- Domain verification badge

### 3. Domain Display in Dashboard
**Location**: `/dashboard`

**Current Implementation:**
- ✅ Shows user's domain name if registered
- ✅ Displays domain instead of wallet name
- ✅ Reverse lookup for wallet addresses

**Enhancements:**
- Domain expiration countdown
- Quick renewal button
- Domain management panel
- Domain statistics (registration date, etc.)

### 4. Domain Profile/Management Page
**New Page**: `/domains/manage` or `/domains/[domain]`

**Features to Build:**
- Domain information display
  - Registration date
  - Expiration date
  - Days remaining
  - Owner address
  - Resolved wallet address
- Domain renewal interface
  - Select renewal duration
  - Calculate renewal fee
  - Process renewal transaction
- Domain statistics
  - Registration history
  - Renewal history
  - Transaction count (if tracked)
- Domain settings
  - Update resolved wallet address (if supported)
  - Transfer domain ownership (if supported)
  - Set domain metadata (if supported)

### 5. Domain Explorer/Registry
**New Page**: `/domains/explorer` or `/domains/browse`

**Features to Build:**
- Browse all registered domains
- Search domains by name
- Filter by registration date
- Sort by popularity/activity
- Domain statistics dashboard
  - Total domains registered
  - Recently registered domains
  - Expiring soon domains
  - Most popular domains

### 6. Domain Integration in Other Pages
**Locations**: Multiple pages

**Features:**
- **Transactions Page** (`/transactions`):
  - Show domain names for addresses
  - Resolve sender/recipient domains
  - Domain transaction history

- **Receive Page** (`/receive`):
  - Display user's domain name
  - QR code with domain option
  - Share domain instead of address

- **Connect Page** (`/connect`):
  - Show domain name for connected wallets
  - Domain verification badge

- **Settings Page** (`/settings`):
  - Domain management section
  - Domain preferences
  - Auto-resolve domains toggle

## Technical Implementation Details

### Domain Name Format
- **Pattern**: `^[a-z0-9-]{1,63}$`
- **Case**: Always lowercase (automatically normalized)
- **TLD**: `.pepu` (hardcoded)
- **Examples**:
  - Valid: `teck`, `my-wallet`, `user123`, `alpha-beta`
  - Invalid: `MyWallet` (uppercase), `_invalid`, `domain.name` (dots not allowed in name)

### Fee Calculation
- Fees are calculated per domain name
- Base fee varies by domain (likely based on length/popularity)
- Formula: `fee = baseFee * duration`
- For days: `fee = (baseFee * days) / 365`
- Fees are in USDC with 6 decimals
- Minimum registration: 1 year
- Maximum registration: 60 years (21,900 days)

### Registration Duration
- **Years Mode**: 1-60 years
- **Days Mode**: 1-21,900 days (max 60 years)
- Contract accepts whole years only
- Days are converted to years (rounded up) for contract calls
- Example: 400 days = 2 years (rounded up from 1.095 years)

### USDC Approval Flow
1. Check current USDC allowance
2. If allowance < required fee:
   - Approve `fee * 2` (to avoid multiple approvals)
   - Wait for approval transaction confirmation
3. Proceed with domain registration

### Error Handling
Common errors and solutions:
- **Insufficient USDC**: User needs to add USDC to wallet
- **Domain not available**: Domain already registered and not expired
- **Invalid domain name**: Name doesn't meet validation rules
- **Wallet locked**: User needs to unlock wallet with password
- **Transaction failed**: Network issue or contract revert

## Usage Examples

### Example 1: Register a Domain
```typescript
import { registerDomain, getDomainRegistrationFee } from "@/lib/domains"
import { getCurrentWallet } from "@/lib/wallet"

const wallet = getCurrentWallet()
const domainName = "mywallet"
const years = 5
const password = "user-password"

// Check fee first
const fee = await getDomainRegistrationFee(domainName, years, ".pepu")
console.log(`Registration fee: ${fee} USDC`)

// Register domain
const txHash = await registerDomain(wallet, password, domainName, years, ".pepu")
console.log(`Domain registered! TX: ${txHash}`)
```

### Example 2: Resolve Domain to Address
```typescript
import { resolvePepuDomain } from "@/lib/domains"

const domainName = "teck"
const address = await resolvePepuDomain(domainName, ".pepu")

if (address) {
  console.log(`${domainName}.pepu resolves to ${address}`)
} else {
  console.log("Domain not found or expired")
}
```

### Example 3: Get Domain for Wallet
```typescript
import { getDomainByWallet } from "@/lib/domains"

const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
const domain = await getDomainByWallet(walletAddress)

if (domain) {
  console.log(`Wallet ${walletAddress} has domain: ${domain}`)
} else {
  console.log("No domain registered for this wallet")
}
```

### Example 4: Check Domain Availability
```typescript
import { checkDomainAvailability, getDomainStatus } from "@/lib/domains"

const domainName = "newdomain"
const isAvailable = await checkDomainAvailability(domainName, ".pepu")

if (isAvailable) {
  const status = await getDomainStatus(domainName, ".pepu")
  console.log(`Domain available! Base fee: ${status.fee} USDC/year`)
} else {
  console.log("Domain already registered")
}
```

### Example 5: Get Full Domain Information
```typescript
import { getDomainInfo } from "@/lib/domains"

const domainName = "teck"
const info = await getDomainInfo(domainName, ".pepu")

if (info) {
  console.log(`Domain: ${domainName}.pepu`)
  console.log(`Wallet: ${info.walletAddress}`)
  console.log(`Owner: ${info.owner}`)
  console.log(`Registered: ${new Date(info.registrationTimestamp * 1000)}`)
  console.log(`Expires: ${new Date(info.expiryTimestamp * 1000)}`)
  console.log(`Days remaining: ${Math.floor((info.expiryTimestamp - Date.now()/1000) / 86400)}`)
}
```

## Integration with Wallet Features

### Send Page Integration
The send page already supports domain resolution:
- User can enter `teck.pepu` or `teck` as recipient
- Domain is automatically resolved to wallet address
- Shows resolved address for confirmation
- Validates domain exists and is not expired

### Dashboard Integration
The dashboard shows:
- User's registered domain name
- Domain name in wallet selector
- Domain name in address display

### Future Integration Opportunities
- **QR Codes**: Generate QR codes with domain names
- **Address Book**: Save domains as contacts
- **Notifications**: Alert users when domain is expiring
- **Analytics**: Track domain usage and popularity
- **Social Features**: Link domains to social profiles
- **Subdomains**: Support for subdomain registration (if contract supports)

## Security Considerations

1. **Domain Validation**: Always validate domain names before processing
2. **Expiration Checks**: Verify domain hasn't expired before resolving
3. **USDC Approval**: Use sufficient approval amounts to avoid multiple transactions
4. **Error Handling**: Gracefully handle contract reverts and network errors
5. **User Confirmation**: Always show resolved address before sending transactions
6. **Domain Ownership**: Verify user owns domain before allowing management operations

## Network & RPC

- **Chain ID**: 97741
- **Chain Name**: Pepe Unchained V2 (PEPU)
- **RPC Endpoint**: `https://rpc-pepu-v2-mainnet-0.t.conduit.xyz`
- **Block Explorer**: Pepuscan (`https://pepuscan.com`)

## Contract ABI

### UnchainedDomains Contract ABI

Complete JSON ABI for the UnchainedDomains contract:

```json
[
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" }
    ],
    "name": "resolveName",
    "outputs": [
      { "internalType": "address", "name": "walletAddress", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "wallet", "type": "address" }
    ],
    "name": "getDomainByWallet",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" }
    ],
    "name": "isDomainAvailable",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "registerDomain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "getRegistrationFee",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" }
    ],
    "name": "getDomainInfo",
    "outputs": [
      { "internalType": "address", "name": "walletAddress", "type": "address" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "registrationTimestamp", "type": "uint256" },
      { "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" },
      { "internalType": "string", "name": "tldInfo", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "tld", "type": "string" }
    ],
    "name": "getDomainStatus",
    "outputs": [
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "bool", "name": "expired", "type": "bool" },
      { "internalType": "uint256", "name": "remainingDays", "type": "uint256" },
      { "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "validateDomainName",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
]
```

### USDC Token ABI

Complete JSON ABI for USDC token (required for payments):

```json
[
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```

## UI/UX Design System

### Design Philosophy

The domain registration site should have a **dark, modern aesthetic** with a focus on clarity and user experience. The design emphasizes the green accent color against a black background to create a premium, tech-forward feel.

### Color Palette

```css
/* Primary Colors */
--bg-primary: #000000;        /* Pure black background */
--bg-secondary: #0a0a0a;      /* Slightly lighter black for cards */
--bg-tertiary: #111111;       /* Card borders/hover states */

/* Accent Colors */
--green-primary: #00ff00;     /* Main green (#00FF00) */
--green-secondary: #00cc00;  /* Darker green for hover */
--green-light: #33ff33;       /* Lighter green for highlights */
--green-glow: rgba(0, 255, 0, 0.3); /* Green glow effects */

/* Text Colors */
--text-primary: #ffffff;      /* White for main text */
--text-secondary: #cccccc;    /* Light gray for secondary text */
--text-tertiary: #888888;     /* Gray for muted text */
--text-green: #00ff00;        /* Green for accent text */

/* Status Colors */
--success: #00ff00;           /* Success states */
--error: #ff3333;             /* Error states */
--warning: #ffaa00;           /* Warning states */
--info: #00aaff;              /* Info states */

/* Border Colors */
--border-primary: rgba(255, 255, 255, 0.1);  /* Subtle white borders */
--border-green: rgba(0, 255, 0, 0.3);        /* Green borders */
```

### Typography

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* For addresses */

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Component Styles

#### Buttons

```css
/* Primary Button (Green) */
.btn-primary {
  background: #00ff00;
  color: #000000;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #00cc00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
}

.btn-primary:disabled {
  background: #333333;
  color: #666666;
  cursor: not-allowed;
}

/* Secondary Button (Outline) */
.btn-secondary {
  background: transparent;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(0, 255, 0, 0.1);
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
}
```

#### Input Fields

```css
.input-field {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #00ff00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

.input-field::placeholder {
  color: #666666;
}
```

#### Cards

```css
.card {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
}

.card:hover {
  border-color: rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
}

.card-green {
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.3);
}
```

### User Flow & Page Structure

#### Landing Page (`/`)

**Design:**
- Full-screen black background
- Centered search bar (large, prominent)
- Minimal design with green accents
- Connect wallet button in top right

**Layout:**
```
┌─────────────────────────────────────┐
│  [Connect Wallet]          [Menu]   │
│                                     │
│                                     │
│         ┌─────────────────┐         │
│         │                 │         │
│         │   Search Bar    │         │
│         │   (Large)       │         │
│         │                 │         │
│         └─────────────────┘         │
│                                     │
│         [Search / Check]            │
│                                     │
│    "Get your .pepu domain name"    │
│                                     │
└─────────────────────────────────────┘
```

**Functionality:**
1. User enters domain name in search bar
2. On Enter or click "Search", check availability
3. Show availability status (green checkmark if available, red X if taken)
4. **If available** → Navigate to `/register/[domain]` for payment
5. **If wallet is connected** → Check if connected wallet has a registered domain
   - **If user has domain** → Automatically redirect to `/domain/[user-domain]` showing their domain info
   - **If user has no domain** → Show search results normally
6. **If domain is taken** → Show "Already registered" with option to view domain info

**Wallet Connection Flow:**
```typescript
// On wallet connect, check for user's domain
async function handleWalletConnect(address: string) {
  const userDomain = await getDomainByWallet(address)
  
  if (userDomain) {
    // User has a domain - redirect to their domain page
    router.push(`/domain/${userDomain.replace('.pepu', '')}`)
  } else {
    // User has no domain - stay on landing page for search
    // Show "Connect Wallet" button changes to "Connected"
  }
}
```

### Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    LANDING PAGE (/)                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │         [Large Search Bar]                       │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  User Actions:                                          │
│  1. Enter domain name → Search                          │
│  2. Click "Connect Wallet"                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─→ [Search Domain]
                          │   │
                          │   ├─→ Available? 
                          │   │   │
                          │   │   ├─→ YES → /register/[domain]
                          │   │   │
                          │   │   └─→ NO → Show "Taken" message
                          │   │
                          └─→ [Connect Wallet]
                              │
                              ├─→ Check: Does wallet have domain?
                              │   │
                              ├─→ YES → /domain/[user-domain]
                              │   │   (Show all domain info)
                              │   │
                              └─→ NO → Stay on landing page
                                  (Ready to search/register)

┌─────────────────────────────────────────────────────────┐
│              REGISTRATION PAGE (/register/[domain])      │
│                                                          │
│  • Domain name display                                  │
│  • Duration selector (years/days)                      │
│  • Fee calculator                                       │
│  • USDC balance check                                   │
│  • [Register] button                                    │
│                                                          │
│  Flow:                                                  │
│  1. User selects duration                              │
│  2. Fee calculated automatically                       │
│  3. Check USDC balance                                 │
│  4. If insufficient → Show error                        │
│  5. If sufficient → [Register] enabled                  │
│  6. On click → Approve USDC (if needed)                 │
│  7. Register domain transaction                         │
│  8. On success → Redirect to /domain/[domain]          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              DOMAIN INFO PAGE (/domain/[domain])        │
│                                                          │
│  • Domain name (large, green)                           │
│  • Status (Active/Expired)                              │
│  • Wallet address (resolved)                            │
│  • Owner address                                         │
│  • Registration date                                     │
│  • Expiration date                                       │
│  • Days remaining                                        │
│  • [Renew Domain] button (if expiring soon)            │
│  • [View on Explorer] link                              │
│                                                          │
│  Features:                                              │
│  • Copy addresses to clipboard                          │
│  • Share domain link                                     │
│  • Renew domain (if owner)                              │
└─────────────────────────────────────────────────────────┘
```

### Key User Experience Rules

1. **Landing Page Priority:**
   - Search bar is the hero element (large, centered)
   - Minimal distractions
   - Connect wallet is secondary (top right corner)

2. **Wallet Connection Behavior:**
   - When wallet connects, immediately check for existing domain
   - If domain exists → Auto-redirect to domain info page
   - If no domain → Stay on landing page, show "Connected" status
   - User can still search for other domains

3. **Search Flow:**
   - Real-time validation as user types
   - Show availability immediately after search
   - Clear visual feedback (green = available, red = taken)
   - One-click navigation to registration if available

4. **Registration Flow:**
   - Show all costs upfront
   - Clear USDC balance display
   - Prevent registration if insufficient funds
   - Show transaction progress
   - Auto-redirect to domain page on success

5. **Domain Info Page:**
   - All information visible at a glance
   - Clear expiration countdown
   - Easy renewal option
   - Explorer links for verification

**Code Example:**
```tsx
// Landing page component structure
<div className="min-h-screen bg-black flex items-center justify-center">
  <div className="w-full max-w-2xl px-4">
    {/* Search Bar */}
    <div className="relative">
      <input
        type="text"
        placeholder="Search for a domain name..."
        className="input-field text-2xl py-6 pl-6 pr-32"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch()
          }
        }}
      />
      <button className="btn-primary absolute right-2 top-2 bottom-2 px-8">
        Search
      </button>
    </div>
    
    {/* Availability Status */}
    {availabilityStatus && (
      <div className={`mt-4 p-4 rounded-lg ${
        availabilityStatus.available 
          ? 'bg-green-500/10 border border-green-500/30' 
          : 'bg-red-500/10 border border-red-500/30'
      }`}>
        {availabilityStatus.available ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle /> {domainName}.pepu is available!
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle /> {domainName}.pepu is already taken
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

#### Registration Page (`/register/[domain]`)

**Design:**
- Black background
- Green accent for available domain
- Clear fee breakdown
- Duration selector (years/days)
- USDC balance display
- Connect wallet prompt if not connected

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Back to Search                  │
│                                     │
│  Domain: example.pepu              │
│  Status: ✅ Available              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Registration Duration        │   │
│  │ [Days] [Years]              │   │
│  │ [Input: 365]                │   │
│  │ Quick: [30d] [90d] [1y] [5y]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Fee Breakdown                │   │
│  │ Base Fee: 10.00 USDC/year    │   │
│  │ Duration: 1 year             │   │
│  │ Total: 10.00 USDC            │   │
│  │                              │   │
│  │ Your Balance: 50.00 USDC    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Connect Wallet] or [Register]    │
└─────────────────────────────────────┘
```

#### Domain Info Page (`/domain/[domain]`)

**Design:**
- Black background with green highlights
- Domain name prominently displayed
- All domain information in cards
- Renewal option if expiring soon
- Transaction history link

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  example.pepu                │   │
│  │  ✅ Active                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Domain Information           │   │
│  │                              │   │
│  │ Wallet Address:              │   │
│  │ 0x742d35Cc...f0bEb          │   │
│  │                              │   │
│  │ Owner:                        │   │
│  │ 0x742d35Cc...f0bEb          │   │
│  │                              │   │
│  │ Registered: Jan 1, 2025      │   │
│  │ Expires: Jan 1, 2026        │   │
│  │ Days Remaining: 365          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Renew Domain] [View on Explorer] │
└─────────────────────────────────────┘
```

### Responsive Design

- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column layout where appropriate
- **Desktop**: Full-width with max-width container (1200px)

### Animations & Transitions

```css
/* Smooth transitions */
* {
  transition: all 0.2s ease;
}

/* Green glow animation */
@keyframes greenGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.6); }
}

.glow-green {
  animation: greenGlow 2s ease-in-out infinite;
}

/* Loading spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  border: 2px solid rgba(0, 255, 0, 0.3);
  border-top-color: #00ff00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Accessibility

- High contrast (black/white/green)
- Keyboard navigation support
- Screen reader friendly
- Focus indicators with green outline
- Minimum touch target size: 44x44px

### Design System Prompts for AI/Developers

**When building components, follow these guidelines:**

1. **Background**: Always use pure black (`#000000`) or near-black (`#0a0a0a`) for backgrounds
2. **Text**: White (`#ffffff`) for primary text, light gray (`#cccccc`) for secondary
3. **Accents**: Use green (`#00ff00`) for:
   - Primary buttons
   - Success states
   - Active/selected states
   - Links and interactive elements
   - Borders on focus/hover
4. **Cards**: Dark background (`#0a0a0a`) with subtle white borders (`rgba(255,255,255,0.1)`)
5. **Hover States**: Add green glow/border on interactive elements
6. **Spacing**: Generous padding (24px+ for cards, 12px+ for buttons)
7. **Border Radius**: 8px for inputs/buttons, 12px for cards
8. **Typography**: Use Inter or similar sans-serif, monospace for addresses

**Component Examples:**

```tsx
// Search Bar Component
<div className="relative">
  <input
    className="w-full bg-[#0a0a0a] border border-white/10 text-white px-6 py-4 rounded-lg text-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    placeholder="Search domain..."
  />
  <button className="absolute right-2 top-2 bottom-2 bg-green-500 text-black px-8 rounded-lg font-semibold hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/50">
    Search
  </button>
</div>

// Status Card
<div className="bg-[#0a0a0a] border border-green-500/30 rounded-xl p-6">
  <div className="flex items-center gap-3 text-green-400">
    <CheckCircle className="w-6 h-6" />
    <span className="text-xl font-semibold">Domain Available</span>
  </div>
</div>

// Info Card
<div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 space-y-4">
  <h3 className="text-white text-lg font-semibold">Domain Information</h3>
  <div className="space-y-2 text-gray-300">
    <div>
      <span className="text-gray-500">Wallet:</span>
      <span className="ml-2 font-mono text-green-400">0x742d...</span>
    </div>
  </div>
</div>
```

## Building a Standalone Domain Registration Site

### Quick Start Guide

#### 1. Setup Project

```bash
# Create a new Next.js/React project
npx create-next-app@latest domain-registration-site --typescript --tailwind

# Install required dependencies
npm install ethers viem wagmi @tanstack/react-query
# or
npm install web3
```

#### 2. Configure Network

Add PEPU Chain to your wallet connection:

```typescript
// chains.ts or config.ts
export const PEPU_CHAIN = {
  id: 97741,
  name: 'Pepe Unchained V2',
  network: 'pepu',
  nativeCurrency: {
    decimals: 18,
    name: 'PEPU',
    symbol: 'PEPU',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'],
    },
    public: {
      http: ['https://rpc-pepu-v2-mainnet-0.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Pepuscan',
      url: 'https://pepuscan.com',
    },
  },
}
```

#### 3. Contract Configuration

```typescript
// constants.ts
export const CONTRACT_ADDRESS = "0x59b040636186afC0851e5891A7b94C3Ca7680128"
export const USDC_ADDRESS = "0x20fB684Bfc1aBAaD3AceC5712f2Aa30bd494dF74"
export const PEPU_CHAIN_ID = 97741
export const TLD = ".pepu"
export const USDC_DECIMALS = 6
export const RPC_URL = "https://rpc-pepu-v2-mainnet-0.t.conduit.xyz"
```

#### 4. Wallet Connection

**Using ethers.js:**

```typescript
import { ethers } from 'ethers'

// Connect to wallet (MetaMask, WalletConnect, etc.)
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const address = await signer.getAddress()

// Get network
const network = await provider.getNetwork()
if (network.chainId !== BigInt(97741)) {
  // Switch to PEPU chain
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x17DCD' }], // 97741 in hex
  })
}
```

**Using wagmi (Recommended):**

```typescript
import { configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, publicClient } = configureChains(
  [PEPU_CHAIN],
  [publicProvider()]
)

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
      },
    }),
  ],
  publicClient,
})
```

#### 5. Contract Interaction Example

```typescript
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from './constants'
import DOMAIN_ABI from './abis/DomainABI.json'
import USDC_ABI from './abis/USDCABI.json'

// Initialize contracts
const domainContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  DOMAIN_ABI,
  signer
)

const usdcContract = new ethers.Contract(
  USDC_ADDRESS,
  USDC_ABI,
  signer
)

// Check domain availability
async function checkAvailability(domainName: string) {
  const normalized = domainName.toLowerCase().trim()
  return await domainContract.isDomainAvailable(normalized, ".pepu")
}

// Get registration fee
async function getFee(domainName: string, years: number) {
  const normalized = domainName.toLowerCase().trim()
  const feeWei = await domainContract.getRegistrationFee(normalized, years)
  return ethers.formatUnits(feeWei, USDC_DECIMALS)
}

// Register domain
async function registerDomain(domainName: string, years: number) {
  const normalized = domainName.toLowerCase().trim()
  
  // 1. Get fee
  const feeWei = await domainContract.getRegistrationFee(normalized, years)
  
  // 2. Check USDC balance
  const balance = await usdcContract.balanceOf(address)
  if (balance < feeWei) {
    throw new Error('Insufficient USDC balance')
  }
  
  // 3. Check and approve USDC
  const allowance = await usdcContract.allowance(address, CONTRACT_ADDRESS)
  if (allowance < feeWei) {
    const approveTx = await usdcContract.approve(
      CONTRACT_ADDRESS,
      feeWei * BigInt(2) // Approve extra to avoid multiple approvals
    )
    await approveTx.wait()
  }
  
  // 4. Register domain
  const tx = await domainContract.registerDomain(normalized, ".pepu", years)
  const receipt = await tx.wait()
  
  return receipt.hash
}
```

#### 6. Essential UI Components

**Domain Search Component:**
- Input field with real-time validation
- Availability check button
- Visual indicators (available/taken/expired)
- Domain status display

**Registration Form:**
- Duration selector (years/days)
- Fee calculator
- USDC balance display
- Connect wallet button
- Register button with transaction status

**Domain Info Display:**
- Domain name
- Resolved wallet address
- Owner address
- Registration date
- Expiration date
- Days remaining

#### 7. Required Pages

1. **Homepage** (`/`)
   - Hero section
   - Domain search
   - How it works
   - Features

2. **Search/Register** (`/register`)
   - Domain search
   - Availability check
   - Registration form
   - Fee calculator

3. **Domain Lookup** (`/lookup`)
   - Search by domain name
   - Search by wallet address
   - Domain information display

4. **My Domains** (`/my-domains`)
   - List user's registered domains
   - Domain management
   - Renewal interface

#### 8. Error Handling

```typescript
try {
  await registerDomain(domainName, years)
} catch (error: any) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient USDC
  } else if (error.message.includes('domain not available')) {
    // Handle domain taken
  } else if (error.code === 'ACTION_REJECTED') {
    // User rejected transaction
  } else {
    // Generic error
  }
}
```

### Recommended Tech Stack

- **Framework**: Next.js, React, or Vue.js
- **Web3 Library**: ethers.js, viem, or web3.js
- **Wallet Connection**: wagmi, Web3Modal, or ConnectKit
- **Styling**: Tailwind CSS, Chakra UI, or Material-UI
- **State Management**: React Query, Zustand, or Redux
- **Type Safety**: TypeScript

### Security Best Practices

1. **Always validate domain names** before sending to contract
2. **Show resolved address** before finalizing transactions
3. **Handle transaction rejections** gracefully
4. **Verify chain ID** before allowing transactions
5. **Check USDC balance** before showing registration button
6. **Use proper error messages** for user feedback
7. **Implement transaction status tracking**
8. **Add loading states** for all async operations

## Support & Resources

- **Contract Address**: `0x59b040636186afC0851e5891A7b94C3Ca7680128`
- **Block Explorer**: [Pepuscan](https://pepuscan.com/address/0x59b040636186afC0851e5891A7b94C3Ca7680128)
- **USDC Token**: `0x20fB684Bfc1aBAaD3AceC5712f2Aa30bd494dF74`
- **Chain**: PEPU Chain (97741)
- **RPC Endpoint**: `https://rpc-pepu-v2-mainnet-0.t.conduit.xyz`
- **Explorer**: [Pepuscan](https://pepuscan.com)

## Future Enhancements

Potential features to consider:
- Domain renewal interface
- Domain transfer functionality
- Subdomain support
- Domain metadata (avatars, descriptions)
- Domain marketplace
- Domain expiration notifications
- Bulk domain operations
- Domain analytics dashboard
- Integration with other DeFi protocols
- Multi-chain domain support

---

**Last Updated**: January 2025
**Version**: 1.0.0

