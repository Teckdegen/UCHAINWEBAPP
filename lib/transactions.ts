import { ethers } from "ethers"
import { getProvider, getProviderWithFallback } from "./rpc"
import { getPrivateKey, getSessionPassword, type Wallet } from "./wallet"

const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "0x0000000000000000000000000000000000000000"
const FEE_PERCENTAGE = 0.5

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

    const privateKey = getPrivateKey(wallet, sessionPassword)
    const provider = await getProviderWithFallback(chainId)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    const amountWei = ethers.parseEther(amount)
    const balance = await provider.getBalance(wallet.address)

    if (balance < amountWei) {
      throw new Error("Insufficient balance")
    }

    const tx = await walletInstance.sendTransaction({
      to: toAddress,
      value: amountWei,
    })

    const receipt = await tx.wait()
    if (!receipt) throw new Error("Transaction failed")

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
    const amountWei = ethers.parseUnits(amount, decimals)

    const balance = await tokenContract.balanceOf(wallet.address)
    if (balance < amountWei) {
      throw new Error("Insufficient token balance")
    }

    const tx = await tokenContract.transfer(toAddress, amountWei)
    const receipt = await tx.wait()
    if (!receipt) throw new Error("Transaction failed")

    return receipt.hash
  } catch (error: any) {
    throw new Error(error.message || "Transaction failed")
  }
}
