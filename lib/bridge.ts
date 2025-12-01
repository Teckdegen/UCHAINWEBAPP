import { ethers } from "ethers"
import { getProvider } from "./rpc"
import { getPrivateKey, type Wallet } from "./wallet"

const SUPERBRIDGE_L2_ADDRESS =
  process.env.NEXT_PUBLIC_SUPERBRIDGE_L2_ADDRESS || "0x0000000000000000000000000000000000000000"
const SUPERBRIDGE_L1_ADDRESS =
  process.env.NEXT_PUBLIC_SUPERBRIDGE_L1_ADDRESS || "0x0000000000000000000000000000000000000000"

const BRIDGE_ABI = [
  {
    inputs: [],
    name: "bridge",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

const L1_BRIDGE_ABI = [
  {
    inputs: [],
    name: "TOKEN",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
]

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
]

export async function getFeePercentage(chainId = 97741): Promise<number> {
  try {
    const provider = getProvider(chainId)
    const bridgeContract = new ethers.Contract(SUPERBRIDGE_L2_ADDRESS, BRIDGE_ABI, provider)
    const feeBps = await bridgeContract.feeBps()
    return Number(feeBps) / 10000
  } catch {
    return 0.05
  }
}

export async function getPoolBalance(): Promise<string> {
  try {
    // Get provider for Ethereum mainnet (L1)
    const l1Provider = getProvider(1)
    
    // Get the PEPU token address from L1 bridge contract
    const l1BridgeContract = new ethers.Contract(SUPERBRIDGE_L1_ADDRESS, L1_BRIDGE_ABI, l1Provider)
    const pepuTokenAddress = await l1BridgeContract.TOKEN()
    
    // Get the ERC20 token balance of the L1 bridge contract
    const pepuTokenContract = new ethers.Contract(pepuTokenAddress, ERC20_ABI, l1Provider)
    const [balance, decimals] = await Promise.all([
      pepuTokenContract.balanceOf(SUPERBRIDGE_L1_ADDRESS),
      pepuTokenContract.decimals(),
    ])
    
    // Format the balance using the token's decimals
    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error("Error getting pool balance from L1:", error)
    return "0"
  }
}

export async function executeBridge(
  wallet: Wallet,
  password: string,
  amount: string,
  chainId = 97741,
): Promise<string> {
  try {
    const privateKey = getPrivateKey(wallet, password)
    const provider = getProvider(chainId)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    const amountWei = ethers.parseEther(amount)
    const bridgeContract = new ethers.Contract(SUPERBRIDGE_L2_ADDRESS, BRIDGE_ABI, walletInstance)

    const tx = await bridgeContract.bridge({ value: amountWei, gasLimit: 300000 })
    const receipt = await tx.wait()

    if (!receipt) throw new Error("Bridge transaction failed")
    return receipt.hash
  } catch (error: any) {
    throw new Error(error.message || "Bridge failed")
  }
}
