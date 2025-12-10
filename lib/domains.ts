import { ethers } from "ethers"
import { getProvider } from "./rpc"

// UnchainedDomains contract address on PEPU chain
const UNCHAINED_DOMAINS_CONTRACT = "0x59b040636186afC0851e5891A7b94C3Ca7680128"

// Contract ABI for domain resolution
const DOMAIN_ABI = [
  "function resolveName(string calldata name, string calldata tld) external view returns (address walletAddress)",
  "function getDomainByWallet(address wallet) external view returns (string memory name, string memory tld)",
  "function isDomainAvailable(string calldata name, string calldata tld) external view returns (bool)",
]

/**
 * Resolve a .pepu domain name to a wallet address
 * @param domainName - Domain name without TLD (e.g., "teck" for "teck.pepu")
 * @param tld - TLD (default: ".pepu")
 * @returns Wallet address or null if domain doesn't exist or expired
 */
export async function resolvePepuDomain(
  domainName: string,
  tld: string = ".pepu"
): Promise<string | null> {
  try {
    // Only resolve on PEPU chain
    const chainId = 97741
    const provider = getProvider(chainId)
    const contract = new ethers.Contract(UNCHAINED_DOMAINS_CONTRACT, DOMAIN_ABI, provider)

    // Normalize domain name (lowercase)
    const normalizedName = domainName.toLowerCase().trim()

    const address = await contract.resolveName(normalizedName, tld)

    if (address === ethers.ZeroAddress || !address) {
      return null
    }

    return address
  } catch (error) {
    console.error("Error resolving domain:", error)
    return null
  }
}

/**
 * Get domain name for a wallet address (reverse lookup)
 * @param walletAddress - Wallet address to lookup
 * @returns Domain name with TLD (e.g., "teck.pepu") or null if not found
 */
export async function getDomainByWallet(walletAddress: string): Promise<string | null> {
  try {
    // Only lookup on PEPU chain
    const chainId = 97741
    const provider = getProvider(chainId)
    const contract = new ethers.Contract(UNCHAINED_DOMAINS_CONTRACT, DOMAIN_ABI, provider)

    const [name, tld] = await contract.getDomainByWallet(walletAddress)

    if (!name || name === "" || !tld || tld === "") {
      return null
    }

    return `${name}${tld}`
  } catch (error) {
    console.error("Error getting domain by wallet:", error)
    return null
  }
}

/**
 * Check if a string is a .pepu domain name
 * @param input - String to check
 * @returns true if it looks like a domain name
 */
export function isPepuDomain(input: string): boolean {
  if (!input || typeof input !== "string") return false
  
  const trimmed = input.trim().toLowerCase()
  
  // Check if it ends with .pepu
  if (trimmed.endsWith(".pepu")) {
    return true
  }
  
  // Check if it's just a name (without TLD) - we'll assume .pepu
  // Domain names are typically alphanumeric with hyphens, 1-63 chars
  const domainPattern = /^[a-z0-9-]{1,63}$/i
  if (domainPattern.test(trimmed) && !trimmed.startsWith("0x")) {
    return true
  }
  
  return false
}

/**
 * Extract domain name from input (handles both "name.pepu" and "name" formats)
 * @param input - Domain input string
 * @returns Object with name and tld
 */
export function parseDomainInput(input: string): { name: string; tld: string } | null {
  if (!input || typeof input !== "string") return null
  
  const trimmed = input.trim().toLowerCase()
  
  if (trimmed.endsWith(".pepu")) {
    const name = trimmed.slice(0, -5) // Remove ".pepu"
    return { name, tld: ".pepu" }
  }
  
  // If it's just a name without TLD, assume .pepu
  const domainPattern = /^[a-z0-9-]{1,63}$/i
  if (domainPattern.test(trimmed) && !trimmed.startsWith("0x")) {
    return { name: trimmed, tld: ".pepu" }
  }
  
  return null
}

