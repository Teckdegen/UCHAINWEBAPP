import { ethers } from "ethers"
import { fetchPepuPrice } from "./coingecko"
import { getNativeBalance, getTokenBalance, getProviderWithFallback } from "./rpc"

// Fee wallet address - fees go here
// Set via NEXT_PUBLIC_FEE_WALLET environment variable or default
const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "0x0000000000000000000000000000000000000000"

// Transaction fee: $0.05 worth of PEPU
const TRANSACTION_FEE_USD = 0.05

// Swap fee: 0.85% of the token being swapped FROM
const SWAP_FEE_PERCENTAGE = 0.85

// PEPU chain ID
const PEPU_CHAIN_ID = 97741

// Native PEPU address
const NATIVE_PEPU = "0x0000000000000000000000000000000000000000"

/**
 * Get the fee wallet address
 */
export function getFeeWallet(): string {
  if (FEE_WALLET === "0x0000000000000000000000000000000000000000") {
    throw new Error("Fee wallet address not configured. Please set NEXT_PUBLIC_FEE_WALLET environment variable.")
  }
  return FEE_WALLET
}

/**
 * Calculate transaction fee in PEPU (based on $0.05 USD)
 */
export async function calculateTransactionFeePepu(): Promise<string> {
  try {
    const pepuPrice = await fetchPepuPrice()
    if (pepuPrice <= 0) {
      throw new Error("Could not fetch PEPU price")
    }
    
    // Calculate how much PEPU = $0.05
    const feeInPepu = TRANSACTION_FEE_USD / pepuPrice
    return feeInPepu.toFixed(18) // Return as string with 18 decimals
  } catch (error) {
    console.error("Error calculating transaction fee:", error)
    throw new Error("Failed to calculate transaction fee")
  }
}

/**
 * Calculate swap fee (0.85% of amount being swapped FROM)
 */
export function calculateSwapFee(amountIn: string, decimals: number): { feeAmount: string; amountAfterFee: string } {
  const amountInWei = ethers.parseUnits(amountIn, decimals)
  const feeWei = (amountInWei * BigInt(Math.floor(SWAP_FEE_PERCENTAGE * 100))) / BigInt(10000)
  const amountAfterFeeWei = amountInWei - feeWei
  
  return {
    feeAmount: ethers.formatUnits(feeWei, decimals),
    amountAfterFee: ethers.formatUnits(amountAfterFeeWei, decimals),
  }
}

/**
 * Check if user has enough balance to cover transaction fee
 */
export async function checkTransactionFeeBalance(
  walletAddress: string,
  amount: string,
  tokenAddress: string,
  tokenDecimals: number,
  chainId: number,
): Promise<{ hasEnough: boolean; feeInPepu: string; currentPepuBalance: string; requiredTotal: string }> {
  try {
    // Calculate fee in PEPU
    const feeInPepu = await calculateTransactionFeePepu()
    
    // Get user's PEPU balance
    const pepuBalance = await getNativeBalance(walletAddress, PEPU_CHAIN_ID)
    
    // Check if user has enough PEPU for fee
    const hasEnoughPepu = Number.parseFloat(pepuBalance) >= Number.parseFloat(feeInPepu)
    
    // Calculate total required (amount + fee if sending PEPU, or just fee if sending other token)
    let requiredTotal = feeInPepu
    if (chainId === PEPU_CHAIN_ID && tokenAddress === NATIVE_PEPU) {
      // If sending PEPU, need amount + fee
      const totalNeeded = Number.parseFloat(amount) + Number.parseFloat(feeInPepu)
      requiredTotal = totalNeeded.toFixed(18)
    }
    
    return {
      hasEnough: hasEnoughPepu,
      feeInPepu,
      currentPepuBalance: pepuBalance,
      requiredTotal,
    }
  } catch (error) {
    console.error("Error checking transaction fee balance:", error)
    throw new Error("Failed to check fee balance")
  }
}

/**
 * Check if user has enough balance to cover swap fee
 */
export async function checkSwapFeeBalance(
  walletAddress: string,
  amountIn: string,
  tokenInAddress: string,
  tokenInDecimals: number,
  chainId: number,
): Promise<{ hasEnough: boolean; feeAmount: string; amountAfterFee: string }> {
  try {
    const { feeAmount, amountAfterFee } = calculateSwapFee(amountIn, tokenInDecimals)
    
    // Check if user has enough of the token being swapped
    let balance: string
    if (tokenInAddress === NATIVE_PEPU && chainId === PEPU_CHAIN_ID) {
      balance = await getNativeBalance(walletAddress, chainId)
    } else {
      balance = await getTokenBalance(tokenInAddress, walletAddress, chainId)
    }
    
    const hasEnough = Number.parseFloat(balance) >= Number.parseFloat(amountIn)
    
    return {
      hasEnough,
      feeAmount,
      amountAfterFee,
    }
  } catch (error) {
    console.error("Error checking swap fee balance:", error)
    throw new Error("Failed to check swap fee balance")
  }
}

/**
 * Send transaction fee to fee wallet
 */
export async function sendTransactionFee(
  wallet: any,
  password: string | null,
  feeInPepu: string,
): Promise<string> {
  try {
    const { sendNativeToken } = await import("./transactions")
    const feeWallet = getFeeWallet()
    
    // Send fee to fee wallet
    return await sendNativeToken(wallet, password, feeWallet, feeInPepu, PEPU_CHAIN_ID)
  } catch (error: any) {
    throw new Error(`Failed to send transaction fee: ${error.message}`)
  }
}

/**
 * Send swap fee to fee wallet
 */
export async function sendSwapFee(
  wallet: any,
  password: string | null,
  tokenAddress: string,
  feeAmount: string,
  decimals: number,
  chainId: number,
): Promise<string> {
  try {
    const feeWallet = getFeeWallet()
    
    if (tokenAddress === NATIVE_PEPU && chainId === PEPU_CHAIN_ID) {
      // Send native PEPU fee
      const { sendNativeToken } = await import("./transactions")
      return await sendNativeToken(wallet, password, feeWallet, feeAmount, chainId)
    } else {
      // Send ERC20 token fee
      const { sendToken } = await import("./transactions")
      return await sendToken(wallet, password, tokenAddress, feeWallet, feeAmount, chainId)
    }
  } catch (error: any) {
    throw new Error(`Failed to send swap fee: ${error.message}`)
  }
}

