import { ethers } from "ethers"
import { getTokenBalance, getProvider } from "./rpc"
import { fetchPepuPrice } from "./coingecko"
import {
  UCHAIN_TOKEN_ADDRESS,
  UCHAIN_DECIMALS,
  PEPU_CHAIN_ID,
  MIN_UCHAIN_REQUIRED,
  TRANSFER_REWARD_USD,
  SWAP_REWARD_PERCENTAGE,
  REWARDS_PAYOUT_KEY,
} from "./config"

const REWARDS_STORAGE_KEY_PREFIX = "unchained_rewards_"

interface RewardsData {
  totalEarned: string // Total rewards earned (in UCHAIN tokens)
  lastUpdated: number // Timestamp of last update
}

/**
 * Get storage key for a specific wallet
 */
function getRewardsStorageKey(walletAddress: string): string {
  return `${REWARDS_STORAGE_KEY_PREFIX}${walletAddress.toLowerCase()}`
}

/**
 * Get current rewards balance for a specific wallet
 */
export function getRewardsBalance(walletAddress: string): string {
  if (typeof window === "undefined") return "0"
  
  const storageKey = getRewardsStorageKey(walletAddress)
  const data = localStorage.getItem(storageKey)
  if (!data) return "0"
  
  try {
    const rewards: RewardsData = JSON.parse(data)
    return rewards.totalEarned || "0"
  } catch {
    return "0"
  }
}

/**
 * Add transfer reward ($0.005 worth of UCHAIN)
 */
export async function addTransferReward(walletAddress: string): Promise<void> {
  try {
    if (!walletAddress) {
      console.error("[Rewards] No wallet address provided")
      return
    }

    console.log(`[Rewards] Recording transfer reward for wallet: ${walletAddress}`)
    
    // Get UCHAIN price in USD
    const uchainPrice = await getUchainPrice()
    if (uchainPrice <= 0) {
      console.warn("[Rewards] Could not fetch UCHAIN price, skipping reward")
      return
    }

    console.log(`[Rewards] UCHAIN price: $${uchainPrice}`)

    // Calculate reward in UCHAIN tokens
    const rewardInUchain = TRANSFER_REWARD_USD / uchainPrice
    console.log(`[Rewards] Calculated reward: ${rewardInUchain.toFixed(6)} UCHAIN`)

    // Add to rewards (per-wallet)
    const currentBalance = getRewardsBalance(walletAddress)
    const newBalance = (Number.parseFloat(currentBalance) + rewardInUchain).toFixed(18)

    const rewardsData: RewardsData = {
      totalEarned: newBalance,
      lastUpdated: Date.now(),
    }

    const storageKey = getRewardsStorageKey(walletAddress)
    localStorage.setItem(storageKey, JSON.stringify(rewardsData))
    
    console.log(`[Rewards] ✅ Added transfer reward: ${rewardInUchain.toFixed(6)} UCHAIN. New balance: ${newBalance} UCHAIN`)
  } catch (error: any) {
    console.error("[Rewards] ❌ Error adding transfer reward:", error)
    console.error("[Rewards] Error details:", error.message, error.stack)
  }
}

/**
 * Add swap reward (0.085% of swap value in UCHAIN)
 */
export async function addSwapReward(
  walletAddress: string,
  swapValueUsd: number, // USD value of the swap
): Promise<void> {
  try {
    // Get UCHAIN price in USD
    const uchainPrice = await getUchainPrice()
    if (uchainPrice <= 0) {
      console.warn("Could not fetch UCHAIN price, skipping reward")
      return
    }

    // Calculate reward (0.085% of swap value)
    const rewardUsd = (swapValueUsd * SWAP_REWARD_PERCENTAGE) / 100
    const rewardInUchain = rewardUsd / uchainPrice

    // Add to rewards (per-wallet)
    const currentBalance = getRewardsBalance(walletAddress)
    const newBalance = (Number.parseFloat(currentBalance) + rewardInUchain).toFixed(18)

    const rewardsData: RewardsData = {
      totalEarned: newBalance,
      lastUpdated: Date.now(),
    }

    const storageKey = getRewardsStorageKey(walletAddress)
    localStorage.setItem(storageKey, JSON.stringify(rewardsData))
    
    console.log(`[Rewards] Added swap reward: ${rewardInUchain.toFixed(6)} UCHAIN to wallet ${walletAddress.slice(0, 6)}...`)
  } catch (error) {
    console.error("Error adding swap reward:", error)
  }
}

/**
 * Check if user has enough UCHAIN tokens to access rewards
 */
export async function checkRewardsEligibility(walletAddress: string): Promise<{
  eligible: boolean
  balance: string
  required: number
}> {
  try {
    const balance = await getTokenBalance(UCHAIN_TOKEN_ADDRESS, walletAddress, PEPU_CHAIN_ID)
    const balanceNum = Number.parseFloat(balance)
    const required = MIN_UCHAIN_REQUIRED

    return {
      eligible: balanceNum >= required,
      balance,
      required,
    }
  } catch (error) {
    console.error("Error checking rewards eligibility:", error)
    return {
      eligible: false,
      balance: "0",
      required: MIN_UCHAIN_REQUIRED,
    }
  }
}

/**
 * Reset rewards after claiming (per-wallet)
 */
export function resetRewards(walletAddress: string): void {
  const storageKey = getRewardsStorageKey(walletAddress)
  const rewardsData: RewardsData = {
    totalEarned: "0",
    lastUpdated: Date.now(),
  }
  localStorage.setItem(storageKey, JSON.stringify(rewardsData))
}

/**
 * Get UCHAIN token price in USD
 * For now, we'll use PEPU price as a proxy or fetch from CoinGecko
 */
async function getUchainPrice(): Promise<number> {
  try {
    // Try to get UCHAIN price from CoinGecko by contract address
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${UCHAIN_TOKEN_ADDRESS}&vs_currencies=usd`,
    )

    if (response.ok) {
      const data = await response.json()
      const contractKey = UCHAIN_TOKEN_ADDRESS.toLowerCase()
      if (data[contractKey] && data[contractKey].usd) {
        return data[contractKey].usd
      }
    }

    // Fallback to PEPU price if UCHAIN price not available
    return await fetchPepuPrice()
  } catch (error) {
    console.error("Error fetching UCHAIN price:", error)
    // Fallback to PEPU price
    return await fetchPepuPrice()
  }
}

/**
 * Send UCHAIN rewards to user wallet
 * Uses payout private key from environment variable
 */
export async function claimRewards(userAddress: string): Promise<string> {
  try {
    const rewardsBalance = getRewardsBalance(userAddress)
    if (Number.parseFloat(rewardsBalance) <= 0) {
      throw new Error("No rewards to claim")
    }

    // Get payout private key from config
    if (!REWARDS_PAYOUT_KEY) {
      throw new Error("Rewards payout key not configured. Please set NEXT_PUBLIC_REWARDS_PAYOUT_KEY environment variable.")
    }

    const provider = getProvider(PEPU_CHAIN_ID)
    const payoutWallet = new ethers.Wallet(REWARDS_PAYOUT_KEY, provider)

    // ERC20 ABI for transfer
    const erc20Abi = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address) view returns (uint256)",
    ]

    const uchainContract = new ethers.Contract(UCHAIN_TOKEN_ADDRESS, erc20Abi, payoutWallet)

    // Check payout wallet balance
    const payoutBalance = await uchainContract.balanceOf(payoutWallet.address)
    const rewardAmountWei = ethers.parseUnits(rewardsBalance, UCHAIN_DECIMALS)

    if (payoutBalance < rewardAmountWei) {
      throw new Error("Insufficient UCHAIN balance in payout wallet")
    }

    // Send rewards
    const tx = await uchainContract.transfer(userAddress, rewardAmountWei, { gasLimit: 100000 })
    const receipt = await tx.wait()

    if (!receipt) {
      throw new Error("Rewards claim transaction failed")
    }

    // Reset rewards after successful claim (per-wallet)
    resetRewards(userAddress)

    return receipt.hash
  } catch (error: any) {
    throw new Error(`Failed to claim rewards: ${error.message}`)
  }
}

