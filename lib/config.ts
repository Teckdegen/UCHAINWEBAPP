/**
 * Configuration file for PEPU VAULT WALLET
 * Update these values to change fees, rewards, and other settings
 */

// ============================================
// TRANSACTION FEES
// ============================================
export const TRANSACTION_FEE_USD = 0.05 // $0.05 worth of PEPU per transaction

// ============================================
// SWAP FEES
// ============================================
export const SWAP_FEE_PERCENTAGE = 0.8 // 0.8% of the token being received (output token)

// ============================================
// REWARDS SYSTEM
// ============================================
// Minimum UCHAIN tokens required to access rewards
export const MIN_UCHAIN_REQUIRED = 1000000 // 1 million UCHAIN tokens

// Cashback per transaction (in USD worth of UCHAIN)
export const TRANSFER_REWARD_USD = 0.005 // $0.005 worth of UCHAIN per transfer

// Cashback per swap (percentage of swap value)
export const SWAP_REWARD_PERCENTAGE = 0.085 // 0.085% of swap value in UCHAIN

// ============================================
// TOKEN ADDRESSES
// ============================================
export const UCHAIN_TOKEN_ADDRESS = "0x008e4509280c812648409cf4e40a11289c0910aa"
export const UCHAIN_DECIMALS = 18

// ============================================
// CHAIN CONFIGURATION
// ============================================
export const PEPU_CHAIN_ID = 97741
export const ETH_CHAIN_ID = 1

// ============================================
// FEE WALLET (From Environment Variable)
// ============================================
// Set NEXT_PUBLIC_FEE_WALLET in your .env.local or hosting platform
// In Next.js, NEXT_PUBLIC_* variables are available at build time
export const FEE_WALLET = 
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FEE_WALLET) ||
  "0x0000000000000000000000000000000000000000" // Fallback to zero address if not set

// ============================================
// REWARDS PAYOUT KEY (From Environment Variable)
// ============================================
// Set NEXT_PUBLIC_REWARDS_PAYOUT_KEY in your .env.local or hosting platform
// WARNING: This is exposed to the browser. Use a dedicated rewards wallet.
// In Next.js, NEXT_PUBLIC_* variables are available at build time
export const REWARDS_PAYOUT_KEY = 
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_REWARDS_PAYOUT_KEY) ||
  "" // Empty string if not set

// ============================================
// BRIDGE CONFIGURATION (Hardcoded)
// ============================================
// L2 Bridge Contract (Pepe Unchained V2)
export const L2_BRIDGE_CONTRACT = "0x9F2091C509141c112F94fF879FF6150f9034A4aa"

// L1 Bridge Contract (Ethereum Mainnet)
export const L1_BRIDGE_CONTRACT = "0x6D925164B21d24F820d01DA0B8E8f93f16f02317"

// PEPU Token Address on Ethereum Mainnet
export const PEPU_TOKEN_ADDRESS_ETH = "0x93aA0ccD1e5628d3A841C4DbdF602D9eb04085d6"

// Maximum Bridge Pool Size
export const MAX_BRIDGE_POOL = 35009000 // 35,009,000 tokens

// Bridge Decimals
export const BRIDGE_DECIMALS = 18

