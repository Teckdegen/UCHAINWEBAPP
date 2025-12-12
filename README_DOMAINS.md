# Unchained Domains - Domain Name Service (DNS) Contract Documentation

## Overview

Unchained Domains is a decentralized domain name service built on the PEPU Chain (Pepe Unchained V2). It allows users to register human-readable `.pepu` domain names that map to wallet addresses, making it easier to send and receive cryptocurrency without remembering long hexadecimal addresses.

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

## Contract ABI Reference

```solidity
// View Functions
function resolveName(string calldata name, string calldata tld) external view returns (address walletAddress)
function getDomainByWallet(address wallet) external view returns (string memory name, string memory tld)
function isDomainAvailable(string calldata name, string calldata tld) external view returns (bool)
function getDomainInfo(string calldata name, string calldata tld) external view returns (address walletAddress, address owner, uint256 registrationTimestamp, uint256 expiryTimestamp, string memory tldInfo)
function getDomainStatus(string calldata name, string calldata tld) external view returns (bool exists, bool expired, uint256 remainingDays, uint256 fee)
function getRegistrationFee(string calldata name, uint256 duration) external view returns (uint256)
function validateDomainName(string calldata name) external pure returns (bool)

// State-Changing Functions
function registerDomain(string calldata name, string calldata tld, uint256 duration) external
```

## Support & Resources

- **Contract Address**: `0x59b040636186afC0851e5891A7b94C3Ca7680128`
- **Block Explorer**: [Pepuscan](https://pepuscan.com/address/0x59b040636186afC0851e5891A7b94C3Ca7680128)
- **USDC Token**: `0x20fB684Bfc1aBAaD3AceC5712f2Aa30bd494dF74`
- **Chain**: PEPU Chain (97741)

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

