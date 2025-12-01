import { ethers } from "ethers"
import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"

// Multiple RPC endpoints for Ethereum (fallback support)
const ETH_RPC_URLS = [
  "https://eth.leorpc.com/?api_key=FREE",
  "https://eth.drpc.org",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com",
  "https://cloudflare-eth.com/v1/mainnet",
  "https://eth.llamarpc.com",
  "https://ethereum.publicnode.com",
  "https://ethereum.publicnode.com/archive",
  "https://eth.api.onfinality.io/public",
  "https://ethereum.public.blockpi.network/v1/rpc/public",
  "https://eth.rpc.hypersync.xyz",
  "https://public-eth.nownodes.io",
  "https://eth.getblock.io/mainnet/",
  "https://eth-mainnet.public.blastapi.io",
  "https://gateway.tatum.io/ethereum-mainnet",
  "https://rpc.mevblocker.io",
  "https://eth.meowrpc.com",
  "https://eth.rpc.subquery.network/public",
  "https://ethereum.blinklabs.xyz",
  "https://endpoints.omniatech.io/v1/eth/mainnet/public",
  "https://eth-mainnet.g.alchemy.com/v2/demo",
  "https://rpc.ankr.com/eth",
]

const RPC_URLS: Record<number, string | string[]> = {
  1: ETH_RPC_URLS,
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

// Try multiple RPC endpoints with fallback
async function tryRpcEndpoints(urls: string[]): Promise<ethers.JsonRpcProvider> {
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url)
      // Test connection
      await provider.getBlockNumber()
      return provider
    } catch (error) {
      console.warn(`RPC endpoint failed: ${url}`, error)
      continue
    }
  }
  // If all fail, return the first one (will throw error on use)
  throw new Error("All RPC endpoints failed")
}

export function getProvider(chainId: number): ethers.JsonRpcProvider {
  const rpcConfig = RPC_URLS[chainId] || RPC_URLS[1]
  
  if (Array.isArray(rpcConfig)) {
    // For Ethereum with multiple endpoints, return a provider that tries them
    // We'll create a custom provider that tries endpoints
    return new ethers.JsonRpcProvider(rpcConfig[0])
  }
  
  return new ethers.JsonRpcProvider(rpcConfig)
}

// Get provider with automatic fallback
export async function getProviderWithFallback(chainId: number): Promise<ethers.JsonRpcProvider> {
  const rpcConfig = RPC_URLS[chainId] || RPC_URLS[1]
  
  if (Array.isArray(rpcConfig)) {
    return await tryRpcEndpoints(rpcConfig)
  }
  
  return new ethers.JsonRpcProvider(rpcConfig)
}

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`
}

export function getNativeSymbol(chainId: number): string {
  return NATIVE_SYMBOLS[chainId] || "TOKEN"
}

export async function getNativeBalance(address: string, chainId: number): Promise<string> {
  // Use viem for Ethereum native balance
  if (chainId === 1) {
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(ETH_RPC_URLS[0]),
      })
      const balance = await client.getBalance({ address: address as `0x${string}` })
      return ethers.formatEther(balance)
    } catch {
      // Fallback to ethers provider chain
    }
  }

  try {
    const provider = await getProviderWithFallback(chainId)
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch (error) {
    const provider = getProvider(chainId)
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  }
}

export async function getTokenBalance(tokenAddress: string, userAddress: string, chainId: number): Promise<string> {
  // Use viem for Ethereum ERC-20 balance
  if (chainId === 1) {
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(ETH_RPC_URLS[0]),
      })
      const [balance, decimals] = await Promise.all([
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }],
            },
          ],
          functionName: "balanceOf",
          args: [userAddress as `0x${string}`],
        }),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              name: "decimals",
              type: "function",
              stateMutability: "view",
              inputs: [],
              outputs: [{ name: "", type: "uint8" }],
            },
          ],
          functionName: "decimals",
          args: [],
        }),
      ])

      return ethers.formatUnits(balance as bigint, Number(decimals))
    } catch {
      // fall through to ethers-based path
    }
  }

  try {
    const provider = await getProviderWithFallback(chainId)
    const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
    const [balance, decimals] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()])

    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    const provider = getProvider(chainId)
    const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
    const [balance, decimals] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()])

    return ethers.formatUnits(balance, decimals)
  }
}

export async function getTokenInfo(
  tokenAddress: string,
  chainId: number,
): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const provider = await getProviderWithFallback(chainId)
    const erc20Abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ]

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider)
    const [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()])

    return { name, symbol, decimals: Number.parseInt(decimals) }
  } catch {
    try {
      // Fallback to first endpoint
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
}
