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

/**
 * Check if a token is native PEPU (native gas token on PEPU chain)
 * PEPU is the native token, not an ERC20, so we check by chain ID
 */
function isNativePepu(chainId: number, tokenAddress: string): boolean {
  // On PEPU chain, native token is identified by zero address or by being the native gas token
  return chainId === PEPU_CHAIN_ID && (
    tokenAddress === "0x0000000000000000000000000000000000000000" ||
    tokenAddress === ethers.ZeroAddress
  )
}

/**
 * Get the fee wallet address
 */
export function getFeeWallet(): string {
  if (FEE_WALLET === "0x0000000000000000000000000000000000000000" || !FEE_WALLET) {
    console.error("⚠️ Fee wallet address not configured. Please set NEXT_PUBLIC_FEE_WALLET environment variable.")
    throw new Error("Fee wallet address not configured. Please set NEXT_PUBLIC_FEE_WALLET environment variable in Vercel settings.")
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
    if (isNativePepu(chainId, tokenAddress)) {
      // If sending native PEPU, need amount + fee
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
    if (isNativePepu(chainId, tokenInAddress)) {
      // Native PEPU balance
      balance = await getNativeBalance(walletAddress, chainId)
    } else {
      // ERC20 token balance
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
 * This sends the fee directly without transaction fee checks
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
    const { getPrivateKey, getSessionPassword } = await import("./wallet")
    const { getProviderWithFallback } = await import("./rpc")
    const { ethers } = await import("ethers")
    
    // Use session password if password not provided
    const sessionPassword = password || getSessionPassword()
    if (!sessionPassword) {
      throw new Error("Wallet is locked. Please unlock your wallet first.")
    }

    const privateKey = getPrivateKey(wallet, sessionPassword)
    const provider = await getProviderWithFallback(chainId)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    if (isNativePepu(chainId, tokenAddress)) {
      // Send native PEPU fee directly (no transaction fee check needed)
      const amountWei = ethers.parseEther(feeAmount)
      const balance = await provider.getBalance(wallet.address)
      
      if (balance < amountWei) {
        throw new Error(`Insufficient PEPU balance for swap fee. Need ${feeAmount} PEPU.`)
      }

      const tx = await walletInstance.sendTransaction({
        to: feeWallet,
        value: amountWei,
      })

      const receipt = await tx.wait()
      if (!receipt) throw new Error("Swap fee transaction failed")
      return receipt.hash
    } else {
      // Send ERC20 token fee directly (no transaction fee check needed)
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
      ]

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, walletInstance)
      const amountWei = ethers.parseUnits(feeAmount, decimals)

      const balance = await tokenContract.balanceOf(wallet.address)
      if (balance < amountWei) {
        throw new Error(`Insufficient token balance for swap fee. Need ${feeAmount} tokens.`)
      }

      const tx = await tokenContract.transfer(feeWallet, amountWei)
      const receipt = await tx.wait()
      if (!receipt) throw new Error("Swap fee transaction failed")
      return receipt.hash
    }
  } catch (error: any) {
    throw new Error(`Failed to send swap fee: ${error.message}`)
  }
}

