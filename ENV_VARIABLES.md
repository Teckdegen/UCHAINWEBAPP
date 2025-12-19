# Environment Variables Documentation

This document lists all environment variables required for the Unchained Web Wallet application.

---

## Required Environment Variables

### 1. `NEXT_PUBLIC_FEE_WALLET`

**Description:** The wallet address that receives all transaction and swap fees collected by the wallet.

**Required:** Yes  
**Type:** String (Ethereum address)  
**Format:** `0x` followed by 40 hexadecimal characters  
**Example:** `NEXT_PUBLIC_FEE_WALLET=0x1234567890123456789012345678901234567890`

**Usage:**
- Used in `lib/fees.ts` to send transaction fees
- Used in `lib/transactions.ts` for PEPU chain transactions
- Used in `lib/swap.ts` for swap fee collection

**Where to Set:**
- **Local Development:** Add to `.env.local` file
- **Vercel:** Project Settings → Environment Variables
- **Other Platforms:** Use your platform's environment variable settings

**Security:** This is a public address, safe to expose in `NEXT_PUBLIC_*` variables.

---

### 2. `NEXT_PUBLIC_REWARDS_PAYOUT_KEY`

**Description:** The private key of the admin wallet that sends UCHAIN token rewards to users.

**Required:** Yes (for rewards system to work)  
**Type:** String (Private key)  
**Format:** `0x` followed by 64 hexadecimal characters  
**Example:** `NEXT_PUBLIC_REWARDS_PAYOUT_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**Usage:**
- Used in `lib/rewards.ts` to send UCHAIN rewards to users
- The wallet must hold UCHAIN tokens for rewards to be claimable

**Where to Set:**
- **Local Development:** Add to `.env.local` file
- **Vercel:** Project Settings → Environment Variables
- **Other Platforms:** Use your platform's environment variable settings

**Security Warning:** 
- ⚠️ This private key is exposed to the browser (client-side)
- ⚠️ Use a dedicated wallet ONLY for rewards payouts
- ⚠️ Never use your main wallet's private key
- ⚠️ Keep only UCHAIN tokens in this wallet
- ⚠️ Monitor this wallet regularly

---

## Optional Environment Variables

### 3. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Description:** WalletConnect project ID for enabling WalletConnect features in the wallet.

**Required:** No (only if using WalletConnect)  
**Type:** String  
**Format:** UUID or project identifier  
**Example:** `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456ghi789`

**Usage:**
- Used in `sdk/` for WalletConnect integration
- Get your project ID from: https://cloud.walletconnect.com/

**Where to Set:**
- **Local Development:** Add to `.env.local` file
- **Vercel:** Project Settings → Environment Variables

---

### 4. `ADMIN_PRIVATE_KEY`

**Description:** Private key for admin scripts (e.g., domain registration scripts).

**Required:** No (only for admin scripts)  
**Type:** String (Private key)  
**Format:** `0x` followed by 64 hexadecimal characters  
**Example:** `ADMIN_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**Usage:**
- Used in `scripts/register-domains-admin.js` for bulk domain registration
- **NOT used by the main application** - only by Node.js scripts

**Where to Set:**
- **Local Development:** Set in your shell environment or `.env.local`
- **Server/CI:** Set in your deployment environment

**Security Warning:**
- ⚠️ This is a server-side variable (not `NEXT_PUBLIC_*`)
- ⚠️ Never commit this to git
- ⚠️ Use a dedicated admin wallet

---

## Setting Up Environment Variables

### Local Development

1. Create a `.env.local` file in the project root:
   ```bash
   touch .env.local
   ```

2. Add your environment variables:
   ```bash
   NEXT_PUBLIC_FEE_WALLET=0xYourFeeWalletAddress
   NEXT_PUBLIC_REWARDS_PAYOUT_KEY=0xYourRewardsPrivateKey
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

**Note:** `.env.local` is git-ignored and will not be committed to the repository.

---

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key:** `NEXT_PUBLIC_FEE_WALLET`
   - **Value:** Your fee wallet address
   - **Environment:** Production, Preview, Development (select all)
4. Repeat for all required variables
5. Redeploy your application

---

### Production (Other Platforms)

Follow your platform's documentation for setting environment variables:

- **Netlify:** Site Settings → Environment Variables
- **Railway:** Project Settings → Variables
- **Heroku:** `heroku config:set KEY=value`
- **Docker:** Use `-e` flag or `.env` file

---

## Environment Variable Reference

| Variable | Required | Type | Client-Side | Description |
|----------|----------|------|-------------|-------------|
| `NEXT_PUBLIC_FEE_WALLET` | ✅ Yes | Address | ✅ Yes | Fee collection wallet address |
| `NEXT_PUBLIC_REWARDS_PAYOUT_KEY` | ✅ Yes | Private Key | ✅ Yes | Rewards payout wallet private key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ❌ No | String | ✅ Yes | WalletConnect project ID |
| `ADMIN_PRIVATE_KEY` | ❌ No | Private Key | ❌ No | Admin script private key (server-side only) |

---

## Security Best Practices

### 1. Private Keys
- ⚠️ **Never commit private keys to git**
- ⚠️ **Use dedicated wallets** for each purpose (fees, rewards, admin)
- ⚠️ **Monitor wallet balances** regularly
- ⚠️ **Use hardware wallets** for high-value operations
- ⚠️ **Rotate keys** if compromised

### 2. Environment Variables
- ✅ Use `.env.local` for local development (git-ignored)
- ✅ Use platform environment variable settings for production
- ✅ Never hardcode sensitive values in code
- ✅ Use different values for development and production

### 3. Client-Side Variables (`NEXT_PUBLIC_*`)
- ⚠️ All `NEXT_PUBLIC_*` variables are exposed to the browser
- ⚠️ Anyone can view these in the browser's developer tools
- ⚠️ Only use `NEXT_PUBLIC_*` for values that are safe to expose
- ⚠️ Never put main wallet private keys in `NEXT_PUBLIC_*` variables

---

## Troubleshooting

### "Fee wallet address not configured"
- **Cause:** `NEXT_PUBLIC_FEE_WALLET` is not set or is invalid
- **Fix:** Set `NEXT_PUBLIC_FEE_WALLET` to a valid Ethereum address
- **Check:** Verify the address starts with `0x` and is 42 characters long

### "Rewards payout key not configured"
- **Cause:** `NEXT_PUBLIC_REWARDS_PAYOUT_KEY` is not set
- **Fix:** Set `NEXT_PUBLIC_REWARDS_PAYOUT_KEY` to a valid private key
- **Check:** Verify the key starts with `0x` and is 66 characters long

### Variables not loading in production
- **Cause:** Variables not set in hosting platform
- **Fix:** Add variables in your platform's environment variable settings
- **Check:** Restart/redeploy your application after adding variables

### Variables not loading locally
- **Cause:** `.env.local` file missing or incorrect format
- **Fix:** Create `.env.local` in project root with correct format
- **Check:** Restart development server after creating file

---

## Example `.env.local` File

```bash
# ============================================
# UNCHAINED WEB WALLET - ENVIRONMENT VARIABLES
# ============================================

# Fee Wallet (Required)
NEXT_PUBLIC_FEE_WALLET=0x1234567890123456789012345678901234567890

# Rewards Payout Key (Required)
NEXT_PUBLIC_REWARDS_PAYOUT_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# WalletConnect Project ID (Optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Admin Private Key (Optional - for scripts only)
ADMIN_PRIVATE_KEY=0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
```

---

## Additional Resources

- **Fee Mechanism:** See `fee.md` for detailed fee documentation
- **Rewards System:** See `lib/rewards.ts` for rewards implementation
- **Configuration:** See `lib/config.ts` for all configuration values

---

**Last Updated:** 2024  
**Version:** 1.0

