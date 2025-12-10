# Contract Deployment Guide

This guide explains how to deploy the UnchainedDomains smart contract using Hardhat.

## Prerequisites

1. **Node.js** and **npm** installed
2. **Private Key** with ETH/USDC for gas fees
3. **USDC Token Address** on the target network

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Deployment Settings

All configuration is now hardcoded in the files. Update these files directly:

**For Hardhat deployment (`hardhat.config.js`):**
- Set `PRIVATE_KEY` variable with your deployer private key
- RPC URLs are already configured (can be modified if needed)

**For contract deployment (`scripts/deploy.js`):**
- Set `usdcAddress` variable with your USDC contract address on PEPU chain

### 3. Compile Contracts

```bash
npm run compile
```

## Deployment

### Deploy to Local Network (Hardhat)

```bash
# Start local Hardhat node in one terminal
npx hardhat node

# Deploy in another terminal
npm run deploy:local
```

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

### Deploy to Ethereum Mainnet

```bash
npm run deploy:mainnet
```

### Deploy to PEPU Chain

```bash
npm run deploy:pepu
```

## Post-Deployment

### 1. Interact with Contract

Test the deployed contract:

```bash
npm run interact
```

### 3. Check Deployment Info

Deployment information is saved in `deployments/<network>-<chainId>.json`:

```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "contractAddress": "0x...",
  "usdcAddress": "0x...",
  "deployer": "0x...",
  "deploymentTime": "2024-01-01T00:00:00.000Z",
  "transactionHash": "0x..."
}
```

## Contract Functions

### Admin Functions (Owner Only)

- `payout(address to, uint256 amount)` - Withdraw USDC from contract
- `adminRegister(name, tld, walletAddress, duration)` - Register domain for any address
- `setRegistrationFee(chars, fee)` - Update pricing
- `setUsdcAddress(address)` - Change USDC token address
- `addTld(tld)` / `removeTld(tld)` - Manage TLDs
- `pause()` / `unpause()` - Pause contract

### User Functions

- `registerDomain(name, tld, duration)` - Register a domain
- `renewDomain(name, tld, duration)` - Renew domain
- `setDomainWallet(name, tld, newWallet)` - Update wallet address

### View Functions

- `resolveName(name, tld)` - Get wallet address for domain
- `isDomainAvailable(name, tld)` - Check availability
- `getDomainInfo(name, tld)` - Get full domain details
- `getContractBalance()` - Get USDC balance in contract

## Example Usage

### Register a Domain

```javascript
const contract = await ethers.getContractAt("UnchainedDomains", contractAddress);
const tx = await contract.registerDomain("example", ".pepu", 1); // 1 year
await tx.wait();
```

### Withdraw Funds (Admin)

```javascript
const contract = await ethers.getContractAt("UnchainedDomains", contractAddress);
const amount = ethers.parseUnits("1000", 6); // 1000 USDC
const tx = await contract.payout(adminWallet, amount);
await tx.wait();
```

### Check Domain Availability

```javascript
const isAvailable = await contract.isDomainAvailable("example", ".pepu");
console.log("Available:", isAvailable);
```

## Network-Specific USDC Addresses

- **Ethereum Mainnet**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Sepolia Testnet**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **PEPU Chain**: Check with your network provider

## Troubleshooting

### "Insufficient funds"
- Ensure your deployer account has enough ETH for gas fees

### "USDC_ADDRESS is not set"
- Make sure `usdcAddress` variable is set in `scripts/deploy.js`

### "Nonce too high"
- Reset your account nonce or wait for pending transactions

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` file to git
- Never share your private key
- Test on testnets before mainnet deployment
- Verify contract ownership after deployment
- Keep deployment info secure

## Support

For issues or questions, check the contract code in `contracts/UnchainedDomains.sol` or the deployment scripts in `scripts/`.

