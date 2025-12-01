import { ethers } from "ethers"

const RPC_URLS: Record<number, string> = {
  1: "https://eth.llamarpc.com",
  97741: "https://rpc-pepu-v2-mainnet-0.t.conduit.xyz",
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  97741: "Pepe Unchained V2",
}

const NATIVE_SYMBOLS: Record<number, string> = {
  1: "ETH",
  97741: "PEPU",
}

export function getProvider(chainId: number): ethers.JsonRpcProvider {
  const rpcUrl = RPC_URLS[chainId] || RPC_URLS[1]
  return new ethers.JsonRpcProvider(rpcUrl)
}

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`
}

export function getNativeSymbol(chainId: number): string {
  return NATIVE_SYMBOLS[chainId] || "TOKEN"
}

export async function getNativeBalance(address: string, chainId: number): Promise<string> {
  const provider = getProvider(chainId)
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

export async function getTokenBalance(tokenAddress: string, userAddress: string, chainId: number): Promise<string> {
  const provider = getProvider(chainId)
  const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]

  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
  const [balance, decimals] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()])

  return ethers.formatUnits(balance, decimals)
}

export async function getTokenInfo(
  tokenAddress: string,
  chainId: number,
): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const provider = getProvider(chainId)
    const erc20Abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ]

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
    const [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()])

    return { name, symbol, decimals: Number.parseInt(decimals) }
  } catch {
    return null
  }
}
