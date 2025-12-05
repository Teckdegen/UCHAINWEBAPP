/**
 * Configuration file for Unchained Wallet
 * Update these values to change fees, rewards, and other settings
 */

// ============================================
// TRANSACTION FEES
// ============================================
export const TRANSACTION_FEE_USD = 0.05 // $0.05 worth of PEPU per transaction

// ============================================
// SWAP FEES
// ============================================
export const SWAP_FEE_PERCENTAGE = 0.85 // 0.85% of the token being swapped FROM

// ============================================
// REWARDS SYSTEM
// ============================================
// Minimum UCHAIN tokens required to access rewards
export const MIN_UCHAIN_REQUIRED = 10 // 1 million UCHAIN tokens

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
// FEE WALLET (Set via environment variable)
// ============================================
export const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "0x0000000000000000000000000000000000000000"

// ============================================
// REWARDS PAYOUT KEY (Set via environment variable)
// ============================================
export const REWARDS_PAYOUT_KEY = process.env.NEXT_PUBLIC_REWARDS_PAYOUT_KEY || ""

