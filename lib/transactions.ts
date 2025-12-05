import { ethers } from "ethers"
import { getProvider, getProviderWithFallback } from "./rpc"
import { getPrivateKey, getSessionPassword, type Wallet } from "./wallet"
import {
  calculateTransactionFeePepu,
  checkTransactionFeeBalance,
  sendTransactionFee,
} from "./fees"

export async function sendNativeToken(
  wallet: Wallet,
  password: string | null,
  toAddress: string,
  amount: string,
  chainId: number,
): Promise<string> {
  try {
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address")
    }

    // Use session password if password not provided
    const sessionPassword = password || getSessionPassword()
    if (!sessionPassword) {
      throw new Error("Wallet is locked. Please unlock your wallet first.")
    }

    // Check if user has enough balance for fee
    const feeCheck = await checkTransactionFeeBalance(
      wallet.address,
      amount,
      "0x0000000000000000000000000000000000000000", // Native token
      18,
      chainId,
    )

    if (!feeCheck.hasEnough) {
      throw new Error(
        `Insufficient PEPU balance for transaction fee. Required: ${feeCheck.feeInPepu} PEPU, Available: ${feeCheck.currentPepuBalance} PEPU`,
      )
    }

    const privateKey = getPrivateKey(wallet, sessionPassword)
    const provider = await getProviderWithFallback(chainId)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    // Calculate fee in PEPU
    const feeInPepu = await calculateTransactionFeePepu()
    const feeInPepuWei = ethers.parseEther(feeInPepu)

    // For PEPU chain, deduct fee from amount being sent
    let amountToSend = amount
    let amountWei = ethers.parseEther(amount)
    
    if (chainId === 97741) {
      // Deduct fee from amount
      const amountAfterFee = Number.parseFloat(amount) - Number.parseFloat(feeInPepu)
      if (amountAfterFee <= 0) {
        throw new Error(`Amount too small. Need at least ${feeInPepu} PEPU to cover fee.`)
      }
      amountToSend = amountAfterFee.toFixed(18)
      amountWei = ethers.parseEther(amountToSend)
    }

    const balance = await provider.getBalance(wallet.address)

    // Check balance (amount + fee if PEPU, or just amount if ETH)
    if (chainId === 97741) {
      // Need amount + fee for PEPU
      const totalNeeded = amountWei + feeInPepuWei
      if (balance < totalNeeded) {
        throw new Error("Insufficient balance (including fee)")
      }
    } else {
      // For ETH, just need the amount (fee is separate PEPU transaction)
      if (balance < amountWei) {
        throw new Error("Insufficient balance")
      }
    }

    // Send the main transaction
    const tx = await walletInstance.sendTransaction({
      to: toAddress,
      value: amountWei,
    })

    const receipt = await tx.wait()
    if (!receipt) throw new Error("Transaction failed")

    // Send fee to fee wallet (always in PEPU, on PEPU chain)
    try {
      await sendTransactionFee(wallet, sessionPassword, feeInPepu)
    } catch (feeError: any) {
      console.error("Failed to send transaction fee:", feeError)
      // Don't fail the main transaction if fee sending fails, but log it
    }

    return receipt.hash
  } catch (error: any) {
    throw new Error(error.message || "Transaction failed")
  }
}

export async function sendToken(
  wallet: Wallet,
  password: string | null,
  tokenAddress: string,
  toAddress: string,
  amount: string,
  chainId: number,
): Promise<string> {
  try {
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address")
    }

    // Use session password if password not provided
    const sessionPassword = password || getSessionPassword()
    if (!sessionPassword) {
      throw new Error("Wallet is locked. Please unlock your wallet first.")
    }

    const privateKey = getPrivateKey(wallet, sessionPassword)
    const provider = await getProviderWithFallback(chainId)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    const erc20Abi = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
    ]

    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, walletInstance)
    const decimals = await tokenContract.decimals()
    
    // Amount stays the same (fee is deducted from PEPU balance separately)
    const amountWei = ethers.parseUnits(amount, decimals)

    const balance = await tokenContract.balanceOf(wallet.address)
    if (balance < amountWei) {
      throw new Error("Insufficient token balance")
    }

    // For PEPU chain, check if user has enough PEPU balance for fee
    if (chainId === 97741) {
      const feeCheck = await checkTransactionFeeBalance(
        wallet.address,
        amount,
        tokenAddress,
        decimals,
        chainId,
      )

      if (!feeCheck.hasEnough) {
        throw new Error(
          `Insufficient PEPU balance for transaction fee. Required: ${feeCheck.feeInPepu} PEPU, Available: ${feeCheck.currentPepuBalance} PEPU`,
        )
      }
    }

    // Send the main transaction
    const tx = await tokenContract.transfer(toAddress, amountWei)
    const receipt = await tx.wait()
    if (!receipt) throw new Error("Transaction failed")

    // Send fee to fee wallet (only for PEPU chain, always in PEPU)
    if (chainId === 97741) {
      try {
        const feeInPepu = await calculateTransactionFeePepu()
        await sendTransactionFee(wallet, sessionPassword, feeInPepu)
      } catch (feeError: any) {
        console.error("Failed to send transaction fee:", feeError)
        // Don't fail the main transaction if fee sending fails, but log it
      }
    }

    return receipt.hash
  } catch (error: any) {
    throw new Error(error.message || "Transaction failed")
  }
}
